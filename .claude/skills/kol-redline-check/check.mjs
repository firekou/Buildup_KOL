#!/usr/bin/env node
/**
 * KOL 紅線檢查器 — 純函式，零外部相依。
 *
 * 規則全部來自 rules.json（唯一真實來源）。Dashboard 後端 import 同一份，
 * 所以規則只有一份，不會漂移。
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

    results.push({
      id: rule.id,
      severity: rule.severity,
      title: rule.title,
      rule: rule.rule,
      whyPlain: rule.why_plain,
      evidence: rule.evidence ?? [],
      remedy: rule.remedy,
      modelDisagreement: rule.model_disagreement ?? null,
      findings,
    })
  }

  const blocks = results.filter((r) => r.severity === 'block')
  const warnings = results.filter((r) => r.severity === 'warn')

  return {
    passed: blocks.length === 0,
    blocked: blocks.length > 0,
    blocks,
    warnings,
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
  if (result.passed && !result.warnings.length) {
    lines.push('✅ 沒有命中任何紅線或警示。')
    return lines.join('\n')
  }
  for (const r of [...result.blocks, ...result.warnings]) {
    lines.push(`${r.severity === 'block' ? '⛔ BLOCK' : '⚠️  WARN '}  ${r.id} · ${r.title}`)
    lines.push(`   規則：${r.rule}`)
    for (const f of r.findings) lines.push(`   位置：${f.where} — ${f.detail}`)
    lines.push(`   白話：${r.whyPlain}`)
    if (r.modelDisagreement) lines.push(`   註記：${r.modelDisagreement}`)
    for (const e of r.evidence) {
      lines.push(`   依據：${e.source}${e.url ? ` → ${e.url}` : ''}`)
    }
    lines.push(`   怎麼改：${r.remedy}`)
    lines.push('')
  }
  lines.push(result.blocked ? '⛔ 有 block 級紅線未解決——不得存檔或發布。' : '⚠️  只有警示，可以繼續，但請把決定記錄下來。')
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
