#!/usr/bin/env node
/**
 * KOL 紅線檢查器 — 第一層 lint。純函式，零外部相依。
 *
 * 規則全部來自 rules.json（唯一真實來源）。Dashboard 後端 import 同一份，
 * 所以規則只有一份，不會漂移。
 *
 * **這一層不做最終判定。** rules.json v1.1 起，關鍵字比對降格為 lint：
 * 目的是「不要漏」，容許高假陽性。命中 detection:"lint" 的規則回傳
 * needsReview，必須由第二層語意判定（skill 內由 Claude 依 semantic_prompt
 * 判斷；Dashboard 內呈現給人確認）。只有 detection:"exact" 的規則——字串
 * 本身無歧義——才會直接判定。
 *
 * 理由（Gemini 與 GPT 的規格 review 共同指出）：
 *   假陽性 —「我親身比對了三份報告」「我實際測試了三種提示詞模板」
 *   假陰性 —「上次在營地醒來」「那晚我手指凍到沒感覺」
 *
 * CLI:
 *   node check.mjs --persona kols/rachel-ong/topic_affinity.json
 *   node check.mjs --text "我親身走過那條路線" --scope script
 *   echo '{"text":"..."}' | node check.mjs --stdin
 *
 * 離開碼：0 = 沒有 block；1 = 有 block（可直接掛進 CI 或 pre-commit）
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const RULES = JSON.parse(fs.readFileSync(path.join(HERE, 'rules.json'), 'utf8'))

/* ------------------------------------------------------------------ 文字比對 */

// 繁簡都要擋。這裡不引入 opencc（skill 必須零相依），改為在 rules.json
// 裡兩種寫法都列出來——規則檔是人維護的，列全比動態轉換更可稽核。
const normalize = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ')

const isLatin = (s) => /^[a-z0-9]+(?:[\s-][a-z0-9]+)*$/.test(s)
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Latin 用詞界比對，CJK 用子字串——CJK 沒有空白可當界。 */
export function hit(haystack, needle) {
  const n = normalize(needle).trim()
  if (!n) return false
  const hay = normalize(haystack)
  if (isLatin(n)) return new RegExp(`(^|[^a-z0-9])${escapeRe(n)}([^a-z0-9]|$)`).test(hay)
  return hay.includes(n)
}

const allPatterns = (rule) => [
  ...(rule.patterns?.zh ?? []),
  ...(rule.patterns?.en ?? []),
  ...(rule.forbidden_phrases?.zh ?? []),
  ...(rule.forbidden_phrases?.en ?? []),
]

/* ------------------------------------------------------------------ 個別檢查 */

/** R-NO-WHY：分數必須有理由，否則該軸未定義（不是 0）。 */
function checkAxisWhy(rule, persona) {
  const findings = []
  for (const [key, cell] of Object.entries(persona?.axes ?? {})) {
    if (!Number.isFinite(cell?.score)) {
      findings.push({ where: `axes.${key}`, detail: 'score 缺失或非數字' })
    } else if (String(cell?.why ?? '').trim().length < (rule.min_length ?? 10)) {
      findings.push({ where: `axes.${key}`, detail: `why 缺失或短於 ${rule.min_length} 字——此分數視為未定義，整條軸排除於計算` })
    }
  }
  return findings
}

/** W-BLURRED-PILLAR：支柱過多，或靠泛用關鍵字命中任何題目。 */
function checkBlurredPillar(rule, persona, profile) {
  const findings = []
  const pillars = profile?.content?.pillars ?? []
  if (pillars.length > (rule.max_pillars ?? 3)) {
    findings.push({
      where: 'profile.content.pillars',
      detail: `支柱 ${pillars.length} 根，超過建議上限 ${rule.max_pillars}`,
    })
  }
  for (const [name, keywords] of Object.entries(persona?.pillar_keywords ?? {})) {
    const generic = (keywords ?? []).filter((k) =>
      (rule.generic_keywords ?? []).some((g) => normalize(g) === normalize(k)),
    )
    if (generic.length) {
      findings.push({
        where: `pillar_keywords["${name}"]`,
        detail: `泛用關鍵字 ${generic.join('／')}——這些詞在任何帳號上都會命中，等於這根支柱沒有邊界`,
      })
    }
  }
  return findings
}

/** applies_when：例如具身紅線只在 credibility_mode 非 database 時適用。 */
function applies(rule, persona) {
  const when = rule.applies_when
  if (!when) return true
  for (const [field, allowed] of Object.entries(when)) {
    const value = persona?.[field] ?? null
    if (!allowed.includes(value)) return false
  }
  return true
}

/* ------------------------------------------------------------------ 主檢查 */

/**
 * @param {object} input
 * @param {'persona'|'plan'|'script'} input.scope
 * @param {object} [input.persona]  topic_affinity.json 的內容
 * @param {object} [input.profile]  profile.json 的內容
 * @param {string} [input.text]     要檢查的自由文字（企劃、腳本、貼文）
 */
export function check({ scope = 'script', persona = null, profile = null, text = '' } = {}) {
  const results = []

  // 人設檢查時，把人設本身的文字也攤平成 haystack——紅線可能藏在 why 或 hook 裡。
  const personaText = persona
    ? JSON.stringify(persona) + ' ' + JSON.stringify(profile ?? {})
    : ''
  const haystack = `${text} ${scope === 'persona' ? personaText : ''}`

  for (const rule of RULES.rules) {
    if (!rule.scope.includes(scope)) continue
    if (!applies(rule, persona)) continue

    let findings = []

    if (rule.check === 'axis_why_length') {
      findings = checkAxisWhy(rule, persona)
    } else if (rule.id === 'W-BLURRED-PILLAR') {
      findings = checkBlurredPillar(rule, persona, profile)
    } else {
      const matched = allPatterns(rule).filter((p) => hit(haystack, p))
      if (matched.length) findings = [{ where: scope, detail: `命中：${matched.join('／')}`, matched }]
    }

    if (!findings.length) continue

    // structural checks (axis why, pillar count) 是可直接判定的事實，
    // 與 detection 欄位無關——它們檢查的是結構，不是語意。
    const structural = rule.check === 'axis_why_length' || rule.id === 'W-BLURRED-PILLAR'
    const decisive = rule.detection === 'exact' || structural

    results.push({
      id: rule.id,
      category: rule.category ?? 'redline',
      severity: rule.severity,
      detection: rule.detection ?? 'lint',
      decisive,
      title: rule.title,
      rule: rule.rule,
      whyPlain: rule.why_plain,
      semanticPrompt: rule.semantic_prompt ?? null,
      evidence: rule.evidence ?? [],
      remedy: rule.remedy,
      findings,
    })
  }

  // 只有 decisive 的命中才算數。lint 命中一律進 needsReview，等第二層。
  const blocks = results.filter((r) => r.decisive && r.severity === 'block')
  const warnings = results.filter((r) => r.decisive && r.severity === 'warn')
  const needsReview = results.filter((r) => !r.decisive)

  // 語意判定專用：有些規則沒有任何 pattern（R-REAL-PERSON-IMPERSONATION、
  // R-HATE-HARASSMENT），lint 永遠不會命中它們——但它們仍必須被第二層檢查。
  const alwaysSemantic = RULES.rules
    .filter((r) => r.scope.includes(scope) && r.semantic_prompt && !results.some((x) => x.id === r.id))
    .map((r) => ({
      id: r.id,
      severity: r.severity,
      title: r.title,
      rule: r.rule,
      whyPlain: r.why_plain,
      semanticPrompt: r.semantic_prompt,
      remedy: r.remedy,
      findings: [],
      reason: 'lint 未命中，但本規則必須由語意層判定',
    }))

  return {
    // passed 只代表「第一層沒有確定的 block」。
    // needsReview 或 pendingSemantic 非空時，尚不足以宣告通過。
    passed: blocks.length === 0,
    blocked: blocks.length > 0,
    complete: blocks.length === 0 && needsReview.length === 0 && alwaysSemantic.length === 0,
    blocks,
    warnings,
    needsReview,
    pendingSemantic: alwaysSemantic,
    rulesVersion: RULES.version,
    checkedScope: scope,
  }
}

/* ------------------------------------------------------------------ CLI */

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function render(result) {
  const lines = []
  lines.push(`紅線檢查（規則版本 ${result.rulesVersion}，範圍 ${result.checkedScope}）`)
  lines.push('')
  if (result.complete && !result.warnings.length) {
    lines.push('✅ 沒有命中任何紅線或警示。')
    return lines.join('\n')
  }
  const tag = (r) => {
    if (!r.decisive) return '🔍 REVIEW'
    return r.severity === 'block' ? '⛔ BLOCK' : '⚠️  WARN '
  }
  for (const r of [...result.blocks, ...result.warnings, ...result.needsReview]) {
    lines.push(`${tag(r)}  ${r.id} · ${r.title}`)
    lines.push(`   規則：${r.rule}`)
    for (const f of r.findings) lines.push(`   位置：${f.where} — ${f.detail}`)
    lines.push(`   白話：${r.whyPlain}`)
    if (!r.decisive) {
      lines.push('   ⚠️ 這是第一層 lint 的命中，不是判定。請依下列指引做語意判斷：')
      lines.push(`   ${String(r.semanticPrompt ?? '（本規則未提供語意指引）').split('\n').join('\n   ')}`)
    }
    for (const e of r.evidence ?? []) {
      lines.push(`   依據：${e.source}${e.url ? ` → ${e.url}` : ''}`)
    }
    lines.push(`   怎麼改：${r.remedy}`)
    lines.push('')
  }
  if (result.pendingSemantic.length) {
    lines.push('🔍 以下規則沒有關鍵字可抓，必須由語意層逐一判定：')
    for (const r of result.pendingSemantic) {
      lines.push(`   ${r.id} · ${r.title}`)
      lines.push(`   ${String(r.semanticPrompt).split('\n').join('\n   ')}`)
      lines.push('')
    }
  }

  if (result.blocked) lines.push('⛔ 有 block 級紅線未解決——不得存檔或發布。')
  else if (!result.complete) lines.push('🔍 第一層沒有確定的 block，但還有項目待語意判定——現在還不能宣告通過。')
  else lines.push('⚠️  只有警示，可以繼續，但請把決定記錄下來。')
  return lines.join('\n')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  const args = process.argv.slice(2)
  const flag = (name) => {
    const i = args.indexOf(name)
    return i >= 0 ? args[i + 1] : null
  }

  let input = {}
  if (args.includes('--stdin')) {
    input = JSON.parse(readStdin() || '{}')
  } else if (flag('--persona')) {
    const affinityPath = flag('--persona')
    const dir = path.dirname(affinityPath)
    const profilePath = path.join(dir, 'profile.json')
    input = {
      scope: 'persona',
      persona: JSON.parse(fs.readFileSync(affinityPath, 'utf8')),
      profile: fs.existsSync(profilePath) ? JSON.parse(fs.readFileSync(profilePath, 'utf8')) : null,
    }
  } else if (flag('--text')) {
    input = { scope: flag('--scope') ?? 'script', text: flag('--text') }
  } else {
    console.error('usage: check.mjs [--persona <topic_affinity.json>] [--text <str> --scope plan|script] [--stdin]')
    process.exit(2)
  }

  const result = check(input)
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2))
  else console.log(render(result))
  process.exit(result.blocked ? 1 : 0)
}
