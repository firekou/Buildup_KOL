import crypto from 'node:crypto'

/**
 * Generation provider adapters — GHOS-027, SYSTEM_ARCHITECTURE.md §3.7.
 *
 * The contract, and only the contract, is what the orchestrator knows about:
 *
 *   generate(request) → {
 *     ok, output { kind, text?, storageRef?, mimeType?, seconds?, images? },
 *     usage { inputTokens?, outputTokens?, ... },
 *     latencyMs, providerRef, error?
 *   }
 *
 * Two adapters ship enabled. `template` composes an asset deterministically
 * from the creative brief — no API key, no cost, fully offline, and it is what
 * makes the closed loop runnable and testable end to end. `aitokenking` calls
 * the LLM gateway already configured for this repo.
 *
 * Image/video adapters are declared but return `not_configured` rather than a
 * fake asset: a placeholder that looks like a generated video would silently
 * poison the cost ledger and the review queue alike.
 */

export const ADAPTERS = {}

const register = (adapter) => {
  ADAPTERS[adapter.id] = adapter
  return adapter
}

/* --------------------------------------------------------- template (offline) */

/**
 * Deterministic composer. Same brief in, same text out — which is what lets
 * the fixture-driven closed-loop test assert on content instead of on "some
 * string came back".
 */
register({
  id: 'template',
  provider: 'internal',
  kinds: ['text'],
  requiresKey: false,
  label: '模板組稿（離線）',
  note: '不呼叫任何外部模型，成本為 0。用於跑通閉環、寫測試，以及在沒有 API key 時仍能操作整條流程。',
  async generate({ brief, arm, persona }) {
    const startedAt = Date.now()
    const lines = [
      brief.hook,
      '',
      ...(brief.beats ?? []).map((b, i) => `${i + 1}. ${b}`),
      '',
      brief.cta,
    ].filter((l) => l !== undefined)

    const text = lines.join('\n')
    return {
      ok: true,
      output: {
        kind: 'text',
        text,
        mimeType: 'text/plain',
        // Content hash is the dedupe key for the asset registry — two arms that
        // produced identical copy is a planning bug worth surfacing.
        contentHash: crypto.createHash('sha256').update(text).digest('hex'),
      },
      usage: { inputTokens: 0, outputTokens: 0, chars: text.length },
      latencyMs: Date.now() - startedAt,
      providerRef: `template:${arm?.id ?? 'adhoc'}`,
      model: 'template-v1',
      personaId: persona?.id ?? null,
    }
  },
})

/* ----------------------------------------------------------- aitokenking */

register({
  id: 'aitokenking',
  provider: 'aitokenking',
  kinds: ['text'],
  requiresKey: true,
  envKey: 'AITOKENKING_API_KEY',
  label: 'AI Token King（OpenAI 相容 gateway）',
  note: '文案／腳本生成。usage 由回應的 token 數換算成本，不用固定單價估。',
  async generate({ prompt, model = 'gpt-5', timeoutMs = 60_000 }) {
    const key = process.env.AITOKENKING_API_KEY
    if (!key) return { ok: false, error: 'not_configured', errorMessage: 'AITOKENKING_API_KEY 未設定' }

    const startedAt = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch('https://api.aitokenking.com.tw/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { ok: false, error: `http_${res.status}`, errorMessage: body?.error?.message ?? res.statusText, latencyMs: Date.now() - startedAt }
      }
      const text = body?.choices?.[0]?.message?.content ?? ''
      return {
        ok: true,
        output: { kind: 'text', text, mimeType: 'text/plain', contentHash: crypto.createHash('sha256').update(text).digest('hex') },
        usage: { inputTokens: body?.usage?.prompt_tokens ?? 0, outputTokens: body?.usage?.completion_tokens ?? 0 },
        latencyMs: Date.now() - startedAt,
        providerRef: body?.id ?? null,
        model,
      }
    } catch (err) {
      return { ok: false, error: controller.signal.aborted ? 'timeout' : 'network', errorMessage: String(err?.message ?? err).slice(0, 300), latencyMs: Date.now() - startedAt }
    } finally {
      clearTimeout(timer)
    }
  },
})

/* ------------------------------------------------- image / video (declared) */

/**
 * Declared but not wired. Returning `not_configured` is deliberate: the
 * orchestrator records a failed ModelRun with that reason, which is honest and
 * visible in System Ops, whereas a stub that returned a fake storage ref would
 * make the review queue and the cost ledger both wrong at once.
 */
for (const [id, spec] of Object.entries({
  higgsfield: { provider: 'higgsfield', kinds: ['image', 'video'], label: 'Higgsfield', envKey: 'HIGGSFIELD_API_KEY', note: '影片／圖片生成。接上後成本走 cost-model.js 的 credit 單價。' },
  'gpt-image': { provider: 'openai', kinds: ['image'], label: 'GPT Image 2', envKey: 'OPENAI_API_KEY', note: '目前 repo 的預設圖片模型（4 credits/張）。' },
})) {
  register({
    id,
    ...spec,
    requiresKey: true,
    async generate() {
      return {
        ok: false,
        error: 'not_configured',
        errorMessage: `${spec.label} adapter 尚未接上。設定 ${spec.envKey} 並在 adapters/generation.js 實作 generate() 後即可啟用；在那之前請用「外部生成後登錄素材」流程。`,
      }
    },
  })
}

export const listAdapters = () =>
  Object.values(ADAPTERS).map((a) => ({
    id: a.id,
    provider: a.provider,
    kinds: a.kinds,
    label: a.label,
    note: a.note,
    requiresKey: a.requiresKey,
    configured: !a.requiresKey || Boolean(process.env[a.envKey ?? '']),
  }))

export const getAdapter = (id) => ADAPTERS[id] ?? null
