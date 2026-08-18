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
