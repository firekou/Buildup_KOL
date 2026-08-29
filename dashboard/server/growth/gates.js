import { db } from './store.js'
import { checkContent } from '../lib/redlines.js'
import { getPlatform, checkPlatformFit } from './platforms.js'
import * as policy from './policy.js'
import { getPersona } from './personas.js'

/**
 * Review & Policy Gate pipeline — FR-P0-07, SYSTEM_ARCHITECTURE.md §3.8.
 *
 *   schema validation
 *   → product policy
 *   → persona policy
 *   → platform policy
 *   → claim / media policy
 *   → optional human review
 *   → publication approval
 *
 * Two design rules make this worth having rather than a checklist in a doc:
 *
 * 1. Every gate returns `blocking | warning | pass` plus the sentence that
 *    decided it. A gate that says "failed" without saying why gets waived by
 *    the first operator in a hurry, permanently.
 *
 * 2. The claim gate delegates to `.claude/skills/kol-redline-check`, which is
 *    already the source of truth for red lines in this repo and has 25 cited
 *    rules behind it. A second keyword list here would drift from that one,
 *    and a drifting redline is worse than none because it still looks enforced.
 *    Critically, that checker's first layer is keyword matching and it says so:
 *    `resolved: false` means the semantic layer still owes an answer, and this
 *    pipeline propagates that as `needs_human`, never as a pass.
 */

export const GATE_RESULTS = ['pass', 'warning', 'blocking', 'needs_human']

const gate = (id, label, result, message, detail = null) => ({ gate: id, label, result, message, detail })

/* ------------------------------------------------------------ the chain */

export function runGates({ asset, arm, experiment, product, opportunity = null }) {
  const gates = []
  const persona = getPersona(arm.personaId, product.id)
  const profile = policy.resolveProfile(product)
  const platformSpec = getPlatform(arm.platform)
  const text = asset.text ?? ''

  /* 1 — schema validation ------------------------------------------------ */
  gates.push(
    asset.assetType === 'text' && !text.trim()
      ? gate('schema', 'Schema', 'blocking', '文字素材沒有內容。')
      : gate('schema', 'Schema', 'pass', `素材類型 ${asset.assetType}，欄位完整。`),
  )

  if (asset.duplicateOfArmId) {
    gates.push(
      gate('duplicate_content', '重複內容', 'blocking',
        `此素材與 arm ${asset.duplicateOfArmId} 的內容完全相同（content hash 一致）。兩個 arm 產出相同內容，這組比較不會產生任何資訊。`),
    )
  }

  /* 2 — product policy --------------------------------------------------- */
  const productAllowed = policy.allowedPlatforms(product)
  gates.push(
    productAllowed.includes(arm.platform)
      ? gate('product_platform', '產品平台限制', 'pass', `${platformSpec?.label ?? arm.platform} 在此產品的允許清單內。`)
      : gate('product_platform', '產品平台限制', 'blocking', `此產品或其 policy profile 封鎖了 ${platformSpec?.label ?? arm.platform}。`),
  )

  const blockedClaims = product.analysis?.blockedClaims ?? []
  const assertedBlocked = blockedClaims.filter((c) => textIncludesClaim(text, c))
  gates.push(
    assertedBlocked.length
      ? gate('product_claims', '產品未證實宣稱', 'blocking',
          `素材使用了尚無 proof point 的結果型宣稱：${assertedBlocked.join('、')}。補上證據，或改寫成不承諾結果的說法。`, assertedBlocked)
      : gate('product_claims', '產品未證實宣稱', 'pass',
          blockedClaims.length ? `未觸及 ${blockedClaims.length} 項待證宣稱。` : '產品沒有待證的結果型宣稱。'),
  )

  const minAge = product.minAge ?? profile.minAge
  gates.push(
    minAge && minAge >= 18
      ? gate('age_restriction', '年齡限制', 'warning', `產品最低年齡 ${minAge} 歲：發布帳號與受眾設定必須符合，且不得投放至未成年為主的版位。`)
      : gate('age_restriction', '年齡限制', 'pass', minAge ? `最低年齡 ${minAge} 歲。` : '無年齡限制設定。'),
  )

  /* 3 — persona policy --------------------------------------------------- */
  if (!persona) {
    gates.push(gate('persona', '人設', 'blocking', `找不到人設 ${arm.personaId}。`))
  } else {
    const personaBlocked = (persona.overlay?.blockedClaims ?? []).filter((c) => textIncludesClaim(text, c))
    gates.push(
      personaBlocked.length
        ? gate('persona_claims', '人設禁止宣稱', 'blocking', `此人設明確不得宣稱：${personaBlocked.join('、')}。`, personaBlocked)
        : gate('persona_claims', '人設禁止宣稱', 'pass', '未觸及此人設的禁止宣稱。'),
    )

    const claimDomains = [
      ...(opportunity?.claimDomains ?? []),
      ...((product.analysis?.claimSurface?.domains ?? []).map((d) => d.domain)),
    ]
    const highStakes = claimDomains.filter((d) => policy.ALWAYS_HUMAN_REVIEW.includes(d))
    const mode = persona.source.credibilityMode
    gates.push(
      highStakes.length && mode === 'embodied'
        ? gate('persona_credibility', '人設可信度', 'blocking',
            `題目涉及 ${highStakes.join('/')}，但此人設的可信度來自親身經歷（credibility_mode=embodied）——AI 人設無法背書這類主張。`)
        : gate('persona_credibility', '人設可信度', 'pass', `credibility_mode=${mode ?? '未定義'}，與此題的 claim 強度相符。`),
    )
  }

  /* 4 — platform policy -------------------------------------------------- */
  const fitViolations = checkPlatformFit({ platform: arm.platform, format: arm.format, textLength: text.length })
  gates.push(
    fitViolations.length
      ? gate('platform_format', '平台格式', 'blocking', fitViolations.map((v) => v.message).join('；'), fitViolations)
      : gate('platform_format', '平台格式', 'pass', `符合 ${platformSpec?.label ?? arm.platform} 的格式與長度限制。`),
  )

  if (platformSpec?.disclosureRequired) {
    gates.push(
      gate('disclosure', 'AI 揭露', 'needs_human',
        `${platformSpec.label} 要求 AI 生成揭露：${platformSpec.disclosureNote} 發布時必須確認已開啟平台的 AI 標示，此項無法由系統代為確認。`),
    )
  }

  if (platformSpec?.automation === 'manual_only') {
    gates.push(
      gate('platform_automation', '平台自動化', 'warning',
        `${platformSpec.label} 沒有可用的官方發布 API，本系統只記錄人工發布的結果，不會代為發文。`),
    )
  }

  /* 5 — claim / media policy （委派既有 redline 檢查） --------------------- */
  // `scope` must be one of the checker's own three (persona / plan / script);
  // every publishable asset is judged as `script`, which is its widest rule set.
  const redline = checkContent({
    scope: 'script',
    text,
    persona: persona?.source ? { redlines: persona.source.redlines, credibility_mode: persona.source.credibilityMode } : null,
    profile: null,
  })

  for (const hit of redline.blocks ?? []) {
    gates.push(gate(`redline:${hit.id}`, `紅線 ${hit.id}`, 'blocking', `${hit.title}：${hit.remedy ?? hit.rule}`, hit))
  }
  for (const hit of redline.warnings ?? []) {
    gates.push(gate(`redline:${hit.id}`, `警示 ${hit.id}`, 'warning', `${hit.title}：${hit.remedy ?? hit.rule}`, hit))
  }
  for (const hit of redline.needsReview ?? []) {
    gates.push(gate(`redline:${hit.id}`, `紅線 ${hit.id}`, 'needs_human', `關鍵字命中，需語意層判定：${hit.title}`, hit))
  }
  // The checker is explicit that its lint layer is not a verdict. Propagating
  // `pendingSemantic` as `needs_human` is the whole reason this integration is
  // worth more than copying the keyword list.
  if (!redline.resolved) {
    const pending = (redline.pendingSemantic ?? []).map((r) => r.id)
    gates.push(
      gate('redline_semantic', '紅線語意層', 'needs_human',
        `第一層是關鍵字比對，不是判定。以下規則仍須由人或語意層逐條判斷：${pending.join('、') || '（無）'}`,
        { pending, guidance: redline.guidance }),
    )
  }

  /* 6 — human review requirement ---------------------------------------- */
  const claimDomains = [
    ...(opportunity?.claimDomains ?? []),
    ...((product.analysis?.claimSurface?.domains ?? []).map((d) => d.domain)),
  ]
  const humanRule = policy.requiresHumanReview(product, { claimDomains: [...new Set(claimDomains)], flags: opportunity?.riskFlags ?? [] })
  if (humanRule.required) {
    gates.push(gate('human_review', '人工審查', 'needs_human', humanRule.reasons.join('；'), { policyVersion: humanRule.policyVersion }))
  }

  return summarise(gates, humanRule.policyVersion ?? `${profile.key}@${profile.version}`)
}

/**
 * Claim matching. Substring alone is too weak (a claim phrased differently
 * slips past) and too strong (a claim quoted in order to reject it trips).
 * So: match on the claim's distinctive tokens, and require most of them.
 */
function textIncludesClaim(text, claim) {
  const haystack = String(text).toLowerCase()
  const tokens = String(claim).toLowerCase().split(/[\s,、，。;；/]+/).filter((t) => t.length >= 2)
  if (!tokens.length) return false
  const hits = tokens.filter((t) => haystack.includes(t))
  return hits.length / tokens.length >= 0.6
}

function summarise(gates, policyVersion) {
  const blocking = gates.filter((g) => g.result === 'blocking')
  const needsHuman = gates.filter((g) => g.result === 'needs_human')
  const warnings = gates.filter((g) => g.result === 'warning')

  return {
    gates,
    policyVersion,
    blocking,
    needsHuman,
    warnings,
    // Three outcomes, and `auto_approvable` is the rare one by design.
    verdict: blocking.length ? 'blocked' : needsHuman.length ? 'review_required' : 'auto_approvable',
    summary: blocking.length
      ? `${blocking.length} 項阻擋：${blocking.map((g) => g.label).join('、')}`
      : needsHuman.length
        ? `${needsHuman.length} 項需人工判斷：${needsHuman.map((g) => g.label).join('、')}`
        : warnings.length
          ? `無阻擋，但有 ${warnings.length} 項提醒。`
          : '全部通過。',
  }
}
