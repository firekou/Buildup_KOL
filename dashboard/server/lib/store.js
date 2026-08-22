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

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function filePath(kind) {
  const name = FILES[kind]
  if (!name) throw new Error(`unknown store "${kind}"`)
  return path.join(DATA_DIR, name)
}

function readAll(kind) {
  ensureDir()
  const file = filePath(kind)
  if (!fs.existsSync(file)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    // A corrupt store must not take the API down; surface it and keep serving.
    console.error(`[store] ${file} unreadable: ${err.message}`)
    return []
  }
}

function writeAll(kind, rows) {
  ensureDir()
  fs.writeFileSync(filePath(kind), JSON.stringify(rows, null, 2))
}

export function list(kind, filter = {}) {
  let rows = readAll(kind)
  for (const [key, value] of Object.entries(filter)) {
    if (value == null || value === '') continue
    rows = rows.filter((r) => r[key] === value)
  }
  return rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function get(kind, id) {
  return readAll(kind).find((r) => r.id === id) ?? null
}

export function insert(kind, record) {
  const rows = readAll(kind)
  const row = {
    id: record.id ?? `${kind}_${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    ...record,
  }
  rows.push(row)
  writeAll(kind, rows)
  return row
}

export function update(kind, id, patch) {
  const rows = readAll(kind)
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1) return null
  rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() }
  writeAll(kind, rows)
  return rows[idx]
}

export function remove(kind, id) {
  const rows = readAll(kind)
  const next = rows.filter((r) => r.id !== id)
  if (next.length === rows.length) return false
  writeAll(kind, next)
  return true
}

export const stats = () => ({
  dataDir: DATA_DIR,
  persistent: Boolean(process.env.DATA_DIR),
  counts: Object.fromEntries(Object.keys(FILES).map((k) => [k, readAll(k).length])),
})
