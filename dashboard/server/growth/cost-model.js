/**
 * Generation price catalogue and cost strategy — FR-P0-10, GHOS-007 / 028.
 *
 * Every number here is traceable to `costs/video-generation-costs.md`, which
 * records actual billed credits per generation in this repo. That matters:
 * DATA_MODEL.md §6 requires each cost row to carry a `source_ref` so the ledger
 * can be reconciled, and a made-up unit price makes the whole unit-economics
 * page unreconcilable.
 *
 * Credits are the billing unit for the video/image provider; USD is derived
 * from the plan the account is actually on, so switching plan re-prices the
 * whole ledger going forward without rewriting history (each cost event stores
 * the rate it was charged at).
 */

export const COST_SOURCE = 'costs/video-generation-costs.md'

/** Higgsfield Ultra plans, from the billing table in the cost doc. */
export const CREDIT_PLANS = {
  'ultra-3000-monthly': { label: 'Ultra 3,000／月繳', monthlyUsd: 99, creditsPerMonth: 3000, usdPerCredit: 0.033 },
  'ultra-9000-annual': { label: 'Ultra 9,000／年繳', monthlyUsd: 174, creditsPerMonth: 9000, usdPerCredit: 0.0193 },
  'ultra-9000-monthly': { label: 'Ultra 9,000／月繳', monthlyUsd: 243, creditsPerMonth: 9000, usdPerCredit: 0.027 },
}

export const DEFAULT_PLAN = process.env.GHOS_CREDIT_PLAN && CREDIT_PLANS[process.env.GHOS_CREDIT_PLAN]
  ? process.env.GHOS_CREDIT_PLAN
  : 'ultra-3000-monthly'

export const usdPerCredit = (planKey = DEFAULT_PLAN) => (CREDIT_PLANS[planKey] ?? CREDIT_PLANS[DEFAULT_PLAN]).usdPerCredit

/**
 * Unit prices in credits. `observed` marks a figure measured from real billed
 * runs in this repo; `listed` marks a provider list price we have not yet
 * billed against. The distinction is shown in the UI — an estimate built on
 * `listed` prices is not the same claim as one built on `observed`.
 */
export const MODEL_COSTS = {
  'gpt-image-2:high': { provider: 'openai', kind: 'image', creditsPerUnit: 4, unit: 'image', basis: 'observed', note: '目前預設圖片模型（cost doc 2026-08-05 起多筆）' },
  'seedream-4.5': { provider: 'bytedance', kind: 'image', creditsPerUnit: 1, unit: 'image', basis: 'observed', note: '定裝／參考照常用，單價最低' },
  'nano-banana-2': { provider: 'google', kind: 'image', creditsPerUnit: 3.5, unit: 'image', basis: 'observed', note: 'Zhang Qinfeng 定裝照三模型比較之一' },
  'seedance-2.0': { provider: 'bytedance', kind: 'video', creditsPerUnit: 4.5, unit: 'second', basis: 'observed', note: '由 cost doc 逐段影片的秒數／credit 推得（例：13s=58.5）' },
  'higgsfield-video': { provider: 'higgsfield', kind: 'video', creditsPerUnit: 4.5, unit: 'second', basis: 'observed', note: '與 seedance 同價位帶' },
  'text-llm': { provider: 'aitokenking', kind: 'text', creditsPerUnit: 0, unit: 'call', basis: 'listed', note: '文案生成走 token 計價，成本由 usage 換算而非固定單價' },
}

/** Token pricing for text generation, USD per 1M tokens. */
export const TEXT_MODEL_PRICING = {
  'claude-sonnet-5': { inputUsdPerM: 3, outputUsdPerM: 15, basis: 'listed' },
  'gpt-5': { inputUsdPerM: 2.5, outputUsdPerM: 10, basis: 'listed' },
  'default': { inputUsdPerM: 3, outputUsdPerM: 15, basis: 'listed' },
}

/**
 * Cost of one generation, in credits and USD, with the derivation attached.
 *
 * `breakdown` is not decoration — it is what makes a ledger row reconcilable
 * against the provider invoice. A number with no derivation is a number nobody
 * can dispute, which is worse than a wrong one.
 */
export function estimateCost({ model, kind, seconds = null, images = 1, usage = null, planKey = DEFAULT_PLAN }) {
  const rate = usdPerCredit(planKey)
  const spec = MODEL_COSTS[model]

  if (kind === 'text' || spec?.kind === 'text') {
    const pricing = TEXT_MODEL_PRICING[model] ?? TEXT_MODEL_PRICING.default
    const inTok = usage?.inputTokens ?? 0
    const outTok = usage?.outputTokens ?? 0
    const usd = (inTok / 1e6) * pricing.inputUsdPerM + (outTok / 1e6) * pricing.outputUsdPerM
    return {
      credits: 0,
      usd: Math.round(usd * 1e6) / 1e6,
      planKey,
      usdPerCredit: rate,
      basis: pricing.basis,
      breakdown: `${inTok} in + ${outTok} out tokens @ $${pricing.inputUsdPerM}/$${pricing.outputUsdPerM} per 1M`,
      sourceRef: 'model pricing table (listed)',
    }
  }

  if (!spec) {
    // Unknown model: record zero and say so, rather than inventing a price.
    // A zero that is labelled `unknown_model` is auditable; a guessed number is not.
    return { credits: null, usd: null, planKey, usdPerCredit: rate, basis: 'unknown_model', breakdown: `未登錄的模型 "${model}"，成本需人工補登`, sourceRef: null }
  }

  const units = spec.unit === 'second' ? (seconds ?? 0) : images
  const credits = Math.round(spec.creditsPerUnit * units * 100) / 100
  return {
    credits,
    usd: Math.round(credits * rate * 1e6) / 1e6,
    planKey,
    usdPerCredit: rate,
    basis: spec.basis,
    breakdown: `${units} ${spec.unit} × ${spec.creditsPerUnit} credits = ${credits} credits × $${rate}/credit`,
    sourceRef: COST_SOURCE,
  }
}

/**
 * Cost strategy — the rules that decide *how much* to spend on an experiment
 * before it has earned the right to more.
 *
 * The economics the repo already measured: a full multi-segment video averages
 * ~304 credits (~$10 on the current plan), an image ~2.5–4 credits (~$0.08–
 * $0.13). So a five-arm video test costs ~$50 before a single view — which is
 * why the default ladder starts on images and text, and only buys video once a
 * hook has cleared a cheaper round.
 */
export const COST_LADDER = [
  {
    tier: 'probe',
    label: '探針（文案／圖）',
    formats: ['text', 'image', 'carousel'],
    typicalCreditsPerArm: 8,
    says: '先用最便宜的形式測 hook 與題目本身。多數 Loser 應該死在這一層。',
    promoteWhen: '同題有 arm 在 primary outcome 上明顯優於其他 arm，且資料完整度足夠。',
  },
  {
    tier: 'short_video',
    label: '短影音',
    formats: ['short_video', 'reel'],
    typicalCreditsPerArm: 304,
    says: '單支多段影片平均 304 credits（cost doc 五支已完整記錄專案的實測平均）。只給已通過探針層的 hook。',
    promoteWhen: '影片層 Winner 且 clone lift 為正，才進放大層。',
  },
  {
    tier: 'scale',
    label: '放大',
    formats: ['short_video', 'reel'],
    typicalCreditsPerArm: 304,
    says: '對已證實的 Winner family 做變體與跨平台改編。',
    promoteWhen: '——（最後一層）',
  },
]

/**
 * Budget guardrail. Returns a decision plus the arithmetic behind it; the
 * caller (generation orchestrator) refuses to spend when `allowed` is false.
 */
export function checkBudget({ spentUsd = 0, capUsd = null, incomingUsd = 0, label = 'experiment' }) {
  if (capUsd == null) {
    return { allowed: true, reason: `${label} 未設定預算上限，未擋下；建議設定後才啟動大量生成。`, spentUsd, capUsd, incomingUsd, remainingUsd: null }
  }
  const projected = spentUsd + incomingUsd
  const allowed = projected <= capUsd
  return {
    allowed,
    reason: allowed
      ? `已花 $${spentUsd.toFixed(2)} + 本次 $${incomingUsd.toFixed(2)} = $${projected.toFixed(2)}，未超過上限 $${capUsd.toFixed(2)}。`
      : `已花 $${spentUsd.toFixed(2)} + 本次 $${incomingUsd.toFixed(2)} = $${projected.toFixed(2)}，超過上限 $${capUsd.toFixed(2)}，已擋下。`,
    spentUsd,
    capUsd,
    incomingUsd,
    projectedUsd: projected,
    remainingUsd: Math.max(0, capUsd - spentUsd),
  }
}

/** Which ladder tier a format belongs to — used to warn about tier-skipping. */
export const tierForFormat = (format) => COST_LADDER.find((t) => t.formats.includes(format)) ?? null
