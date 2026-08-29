import { PLATFORMS } from '../platforms.js'

/**
 * Publisher adapters — GHOS-031, SYSTEM_ARCHITECTURE.md §3.9.
 *
 * Contract: `publish(request) → { ok, platformPostId, url, error? }`.
 *
 * Every platform here is `manual_log` today. That is a deliberate honest
 * default, not an omission: automated posting needs per-platform OAuth apps
 * with granted publishing scopes, and a stub that pretended to post would
 * produce publication rows with no post behind them — which then flow into
 * telemetry, attribution and the Winner decision as if they were real.
 *
 * `manual_log` means: a human posts, and records the resulting URL here. That
 * is a fully working closed loop — the identity, cost, telemetry and
 * attribution chain is complete — it is just not automated. Wiring a real API
 * is then a change to one adapter, not to the OS.
 *
 * Credentials never live in this repo (SYSTEM_ARCHITECTURE.md §9); a
 * `social_accounts` row stores only a `credentialRef` naming the env var.
 */

const manualLog = (platformId) => ({
  id: platformId,
  mode: 'manual_log',
  label: PLATFORMS[platformId]?.label ?? platformId,
  automation: PLATFORMS[platformId]?.automation ?? 'manual_only',
  note:
    PLATFORMS[platformId]?.automation === 'api'
      ? `${PLATFORMS[platformId].label} 有官方發布 API，但本系統尚未接上 OAuth。目前為人工發布後登錄貼文 URL；接上後改為自動發布，其餘流程不變。`
      : `${PLATFORMS[platformId]?.label ?? platformId} 沒有可用的官方發布 API，本系統只記錄人工發布結果。`,
  async publish({ publication, platformPostId, url }) {
    if (!platformPostId && !url) {
      return {
        ok: false,
        error: 'manual_log_requires_reference',
        errorMessage: '此平台為人工發布模式：請在發文後回填 platformPostId 或貼文 URL，系統才能開始追蹤成效。',
      }
    }
    return { ok: true, platformPostId: platformPostId ?? deriveId(url), url: url ?? null, mode: 'manual_log', publishedAt: publication.scheduledAt ?? new Date().toISOString() }
  },
})

/** Best-effort post id from a URL, so the telemetry sync has a key to poll on. */
function deriveId(url) {
  if (!url) return null
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    return parts.at(-1) ?? null
  } catch {
    return null
  }
}

export const PUBLISH_ADAPTERS = Object.fromEntries(Object.keys(PLATFORMS).map((id) => [id, manualLog(id)]))

export const getPublishAdapter = (platform) => PUBLISH_ADAPTERS[platform] ?? null

export const listPublishAdapters = () =>
  Object.values(PUBLISH_ADAPTERS).map((a) => ({ id: a.id, label: a.label, mode: a.mode, automation: a.automation, note: a.note }))
