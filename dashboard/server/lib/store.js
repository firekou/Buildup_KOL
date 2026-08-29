import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { DATA_DIR } from '../config.js'

/**
 * Append-only JSON store for evaluation records.
 *
 * Deliberately file-backed and dependency-free so the dashboard runs anywhere.
 * On Railway the container filesystem is ephemeral — mount a volume and set
 * DATA_DIR to it, or records vanish on redeploy. Swapping this module for a
 * Postgres-backed one is the intended upgrade path; nothing else imports fs.
 *
 * `createStore()` exists because Growth OS needs ~25 more collections of its
 * own (projects/growth-hack-os/DATA_MODEL.md §2). Those live in a sibling
 * directory with the same durability guarantees rather than a second copy of
 * the atomic-write dance below — one implementation, two collection sets.
 */

const FILES = {
  pre: 'pre-evaluations.json',
  post: 'post-evaluations.json',
  matchRecords: 'match-records.json',
  /**
   * docs/11 §9.3 · P1-1 — one row per successful topic fetch.
   *
   * Burst detection is defined as "abnormal relative to this term's own past"
   * (Kleinberg 2002). Without a stored history there is no past to compare to,
   * so `heatConfidence` can never leave `none`. The Railway volume and this
   * append-only store already existed; we were simply throwing the data away
   * every time the in-memory cache expired.
   */
  topicSnapshots: 'topic-snapshots.json',
  /**
   * docs/11 §2.4 · P1-6 — every VETO, plus what a human thought of it.
   *
   * Without this the FLOOR can never be calibrated: vetoed pairs are never
   * produced, so they generate no outcome data, so the line stays wherever we
   * first guessed it. The human verdict is the only signal available for the
   * region below the EXPERIMENT band.
   */
  vetoLog: 'veto-log.json',
  /**
   * docs/11 §5.6 — every time a human overturns the semantic layer's verdict.
   *
   * This is the only signal that says whether a rule's `semantic_prompt` is
   * written well. Without it the second layer is unfalsifiable, which is the
   * exact failure GPT flagged: "otherwise it just hides the unreliability
   * inside the prompt".
   */
  judgementLog: 'judgement-log.json',
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * docs/14 §1.5 / §9.3 — write to a temp file in the same directory, then
 * `rename` over the target.
 *
 * This was a plain `fs.writeFileSync`. A process killed part-way through that
 * call leaves a truncated file, and `readAll()` then logs "unreadable" and
 * returns `[]` — every record silently gone. That is not a hypothetical on
 * Railway: a service with a volume attached has real downtime on every
 * redeploy, so "interrupted while writing" is a normal event, not an edge case.
 *
 * `rename` within one filesystem is atomic, so a reader sees either the old
 * file or the new one — never a half-written one. The temp file must live in
 * the same directory for that guarantee to hold, hence the sibling path.
 */
function atomicWrite(target, rows) {
  ensureDir(path.dirname(target))
  const tmp = `${target}.${process.pid}.${crypto.randomUUID().slice(0, 8)}.tmp`
  try {
    fs.writeFileSync(tmp, JSON.stringify(rows, null, 2))
    fs.renameSync(tmp, target)
  } catch (err) {
    // Never leave the temp file behind to accumulate on the volume.
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* already gone, or never created */
    }
    throw err
  }
}

/**
 * Build a store over `baseDir` holding the collections named in `fileMap`
 * (`{ kind: 'file-name.json' }`).
 *
 * `idPrefix` controls the generated `id` for collections whose caller does not
 * supply one; Growth OS always supplies its own (growth/ids.js), the legacy
 * collections do not.
 */
export function createStore(baseDir, fileMap, { idPrefix = (kind) => kind } = {}) {
  const filePath = (kind) => {
    const name = fileMap[kind]
    if (!name) throw new Error(`unknown store "${kind}"`)
    return path.join(baseDir, name)
  }

  /**
   * Rows are cached per collection and invalidated by mtime, so a hot read
   * path (the dashboard read model touches a dozen collections per request)
   * does not re-parse every JSON file on every call. mtime rather than a
   * write-through cache because a sibling process — the seed script, a
   * `node -e` one-off — can write the same file.
   */
  const cache = new Map()

  function readAll(kind) {
    const file = filePath(kind)
    if (!fs.existsSync(file)) return []
    let mtimeMs
    try {
      mtimeMs = fs.statSync(file).mtimeMs
    } catch {
      return []
    }
    const hit = cache.get(kind)
    if (hit && hit.mtimeMs === mtimeMs) return hit.rows
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
      const rows = Array.isArray(parsed) ? parsed : []
      cache.set(kind, { mtimeMs, rows })
      return rows
    } catch (err) {
      // A corrupt store must not take the API down; surface it and keep serving.
      console.error(`[store] ${file} unreadable: ${err.message}`)
      return []
    }
  }

  function writeAll(kind, rows) {
    atomicWrite(filePath(kind), rows)
    cache.delete(kind)
  }

  /** Filter by exact match on every key given a non-empty value. */
  function matches(row, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (value == null || value === '') continue
      if (Array.isArray(value)) {
        if (!value.includes(row[key])) return false
      } else if (row[key] !== value) return false
    }
    return true
  }

  const api = {
    kinds: () => Object.keys(fileMap),

    list(kind, filter = {}) {
      return readAll(kind)
        .filter((r) => matches(r, filter))
        .slice()
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    },

    /** Insertion order — lineage walks and timelines need oldest-first. */
    listAsc(kind, filter = {}) {
      return readAll(kind).filter((r) => matches(r, filter))
    },

    get(kind, id) {
      return readAll(kind).find((r) => r.id === id) ?? null
    },

    find(kind, predicate) {
      return readAll(kind).find(predicate) ?? null
    },

    filter(kind, predicate) {
      return readAll(kind).filter(predicate)
    },

    count(kind, filter = {}) {
      return readAll(kind).filter((r) => matches(r, filter)).length
    },

    insert(kind, record) {
      const rows = readAll(kind).slice()
      const row = {
        id: record.id ?? `${idPrefix(kind)}_${crypto.randomUUID().slice(0, 8)}`,
        createdAt: record.createdAt ?? new Date().toISOString(),
        ...record,
      }
      rows.push(row)
      writeAll(kind, rows)
      return row
    },

    /**
     * Insert unless a row already satisfies `predicate`; returns
     * `{ row, inserted }`.
     *
     * SYSTEM_ARCHITECTURE.md §2.5 — telemetry syncs, conversion webhooks and
     * publish callbacks all get re-delivered. Every one of those write paths
     * goes through here so a redelivery does not double-count a conversion.
     */
    upsert(kind, predicate, record, patch = null) {
      const rows = readAll(kind).slice()
      const idx = rows.findIndex(predicate)
      if (idx === -1) return { row: api.insert(kind, record), inserted: true }
      if (patch) {
        rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() }
        writeAll(kind, rows)
      }
      return { row: rows[idx], inserted: false }
    },

    update(kind, id, patch) {
      const rows = readAll(kind).slice()
      const idx = rows.findIndex((r) => r.id === id)
      if (idx === -1) return null
      rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() }
      writeAll(kind, rows)
      return rows[idx]
    },

    /** Apply `patch` to every row matching `predicate`. Returns rows changed. */
    updateWhere(kind, predicate, patch) {
      const rows = readAll(kind).slice()
      let changed = 0
      for (let i = 0; i < rows.length; i += 1) {
        if (!predicate(rows[i])) continue
        rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() }
        changed += 1
      }
      if (changed) writeAll(kind, rows)
      return changed
    },

    remove(kind, id) {
      const rows = readAll(kind)
      const next = rows.filter((r) => r.id !== id)
      if (next.length === rows.length) return false
      writeAll(kind, next)
      return true
    },

    /** Replace a whole collection. Only the seed script should need this. */
    replaceAll(kind, rows) {
      writeAll(kind, rows)
      return rows.length
    },

    stats: () => ({
      dataDir: baseDir,
      /**
       * `DATA_DIR` is set — which is necessary for persistence but NOT
       * sufficient: it says nothing about whether a volume is actually
       * mounted there. A container with DATA_DIR=/data and no volume writes
       * happily to an ephemeral directory and loses everything on redeploy.
       *
       * Named for what it actually observes, because the previous name
       * (`persistent`) was rendered in the UI as 「資料已持久化」 — a claim
       * this process cannot make. See dashboard/README.md 踩過的坑（二）.
       */
      dataDirConfigured: Boolean(process.env.DATA_DIR),
      persistent: Boolean(process.env.DATA_DIR),
      counts: Object.fromEntries(Object.keys(fileMap).map((k) => [k, readAll(k).length])),
    }),

    /** Newest `createdAt`/`updatedAt` across a collection — data freshness (GHOS-X05). */
    lastWriteAt(kind) {
      let latest = null
      for (const row of readAll(kind)) {
        const at = row.updatedAt ?? row.createdAt
        if (at && (latest == null || at > latest)) latest = at
      }
      return latest
    },
  }

  return api
}

const legacy = createStore(DATA_DIR, FILES)

export const list = legacy.list
export const get = legacy.get
export const insert = legacy.insert
export const update = legacy.update
export const remove = legacy.remove
export const stats = legacy.stats
