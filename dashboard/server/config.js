import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDir = path.dirname(fileURLToPath(import.meta.url))

/** Repository root — the server reads KOL data straight out of the repo. */
export const REPO_ROOT = path.resolve(serverDir, '../..')
export const KOLS_DIR = path.join(REPO_ROOT, 'kols')
export const DASHBOARD_DIR = path.join(REPO_ROOT, 'dashboard')
export const CLIENT_DIST = path.join(DASHBOARD_DIR, 'dist')

/**
 * Writable data directory for evaluation records.
 * On Railway, mount a volume and point DATA_DIR at it — otherwise records are
 * lost on redeploy (the container filesystem is ephemeral).
 */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(REPO_ROOT, 'data')

export const PORT = Number(process.env.PORT) || 8080

export const apify = {
  token: process.env.APIFY_TOKEN || '',
  /** Actor ids are configurable so the actor can be swapped without a code change. */
  actors: {
    threads: process.env.APIFY_ACTOR_THREADS || 'curious_coder~threads-scraper',
    tiktok: process.env.APIFY_ACTOR_TIKTOK || 'clockworks~tiktok-scraper',
    instagram: process.env.APIFY_ACTOR_INSTAGRAM || 'apify~instagram-hashtag-scraper',
  },
  /** Seconds a fetched topic set stays cached before a re-fetch. */
  cacheTtl: Number(process.env.TOPIC_CACHE_TTL_SECONDS) || 1800,
  /** Milliseconds before an Apify run is abandoned and the fixture set is used. */
  timeoutMs: Number(process.env.APIFY_TIMEOUT_MS) || 90_000,
}

export const isApifyConfigured = () => Boolean(apify.token)
