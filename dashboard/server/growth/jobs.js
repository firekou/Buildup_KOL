import { db } from './store.js'
import { newId } from './ids.js'

/**
 * Job runner — GHOS-X03, SYSTEM_ARCHITECTURE.md §2.4 / §8.
 *
 * Not a queue. This is a *record* of asynchronous work: every generation,
 * publish, telemetry sync and scan runs inside `runJob`, so System Ops can
 * answer "what failed, why, and how many times" without a log grep. The spec's
 * reliability requirement is `status / retry_count / last_error` on every job,
 * and that is exactly the row shape below.
 *
 * A real queue (BullMQ, pg-boss) drops in behind `enqueue()` when generation
 * volume justifies it. Until then, in-process with a persisted record is the
 * honest shape: the work genuinely does happen in this process.
 */

export const JOB_TYPES = [
  'signal.scan',
  'generation.run',
  'publication.publish',
  'telemetry.sync',
  'conversion.ingest',
  'attribution.resolve',
  'experiment.evaluate',
  'mutation.clone',
]

export const JOB_STATUS = ['queued', 'running', 'succeeded', 'failed', 'dead_letter']

/** Attempts before a job is parked in the dead-letter state for a human. */
export const MAX_ATTEMPTS = 3

export function createJob(jobType, payload = {}, { maxAttempts = MAX_ATTEMPTS, idempotencyKey = null } = {}) {
  if (!JOB_TYPES.includes(jobType)) throw new Error(`unknown job type "${jobType}"`)

  if (idempotencyKey) {
    const existing = db.find('jobs', (j) => j.idempotencyKey === idempotencyKey && j.status !== 'failed')
    // GHOS-X02: a publish job must not fire twice because a UI request timed
    // out and the operator clicked again.
    if (existing) return { job: existing, duplicate: true }
  }

  const job = db.insert('jobs', {
    id: newId('job'),
    jobType,
    payload,
    status: 'queued',
    attempts: 0,
    maxAttempts,
    lastError: null,
    result: null,
    idempotencyKey,
    startedAt: null,
    finishedAt: null,
  })
  return { job, duplicate: false }
}

/**
 * Run `fn` as a recorded job. Returns `{ job, result }` on success and throws
 * on final failure — but the job row survives either way, which is the point.
 */
export async function runJob(jobType, payload, fn, options = {}) {
  const { job, duplicate } = createJob(jobType, payload, options)
  if (duplicate && job.status === 'succeeded') return { job, result: job.result, duplicate: true }

  const startedAt = new Date().toISOString()
  db.update('jobs', job.id, { status: 'running', attempts: job.attempts + 1, startedAt })

  try {
    const result = await fn()
    const finished = db.update('jobs', job.id, {
      status: 'succeeded',
      result,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - Date.parse(startedAt),
      lastError: null,
    })
    return { job: finished, result, duplicate: false }
  } catch (err) {
    const attempts = job.attempts + 1
    const finished = db.update('jobs', job.id, {
      // A job that has spent its attempts is not "failed and forgotten" — it is
      // parked where System Ops shows it, with the error that killed it.
      status: attempts >= (options.maxAttempts ?? MAX_ATTEMPTS) ? 'dead_letter' : 'failed',
      attempts,
      lastError: String(err?.message ?? err).slice(0, 1000),
      finishedAt: new Date().toISOString(),
    })
    err.jobId = finished.id
    throw err
  }
}

/** Re-run a failed job's payload with the same job id lineage. */
export function retryable() {
  return db.filter('jobs', (j) => j.status === 'failed' && j.attempts < j.maxAttempts)
}

export const deadLetters = () => db.filter('jobs', (j) => j.status === 'dead_letter')

export const listJobs = ({ jobType = null, status = null, limit = 100 } = {}) =>
  db.list('jobs', { jobType, status }).slice(0, limit)

/** Per-type health, for the System Ops page. */
export function jobHealth() {
  const all = db.list('jobs')
  const byType = {}
  for (const job of all) {
    const bucket = (byType[job.jobType] ??= { total: 0, succeeded: 0, failed: 0, deadLetter: 0, running: 0, lastRunAt: null, lastError: null, avgDurationMs: null, _durations: [] })
    bucket.total += 1
    if (job.status === 'succeeded') bucket.succeeded += 1
    if (job.status === 'failed') bucket.failed += 1
    if (job.status === 'dead_letter') bucket.deadLetter += 1
    if (job.status === 'running') bucket.running += 1
    if (Number.isFinite(job.durationMs)) bucket._durations.push(job.durationMs)
    if (!bucket.lastRunAt || String(job.createdAt) > bucket.lastRunAt) {
      bucket.lastRunAt = job.createdAt
      bucket.lastError = job.lastError
    }
  }
  for (const bucket of Object.values(byType)) {
    bucket.avgDurationMs = bucket._durations.length
      ? Math.round(bucket._durations.reduce((a, b) => a + b, 0) / bucket._durations.length)
      : null
    bucket.successRate = bucket.total ? bucket.succeeded / bucket.total : null
    delete bucket._durations
  }
  return byType
}
