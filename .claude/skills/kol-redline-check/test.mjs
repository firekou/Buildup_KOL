#!/usr/bin/env node
/**
 * docs/11 §5.6 — the golden test set for the redline layers.
 *
 * What this can and cannot test:
 *
 *   Layer 1 (this file)  keyword lint — deterministic, so it IS testable.
 *   Layer 2              LLM semantic judgement — not deterministic, so the
 *                        cases here define the CONTRACT it must satisfy; the
 *                        actual judging is exercised by the skill, and
 *                        disagreements are recorded in `judgementLog`.
 *
 * The assertion that matters most is the false-positive one: a `shouldPass`
 * case must never be decisively blocked by keyword matching alone. Both spec
 * reviewers gave the same example — "我親身比對了三份報告" is a database-type
 * KOL doing ordinary work, and v1.0 would have blocked it outright.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { check, RULES } from './check.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(HERE, 'testcases')

const ruleById = new Map(RULES.rules.map((r) => [r.id, r]))
const scopeFor = (rule) => (rule.scope.includes('script') ? 'script' : rule.scope[0])

let pass = 0
const failures = []
const handoffs = []

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()) {
  const set = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  const rule = ruleById.get(set.rule)
  if (!rule) {
    failures.push(`${set.rule}: 測試集存在，但 rules.json 裡沒有這條規則`)
    continue
  }
  const scope = scopeFor(rule)
  const decisive = (r) => [...r.blocks, ...r.warnings].some((x) => x.id === set.rule)
  const surfaced = (r) =>
    [...r.blocks, ...r.warnings, ...r.needsReview, ...r.pendingSemantic].some((x) => x.id === set.rule)

  // 1. False positives — the guarantee layer 1 must give on its own.
  for (const c of set.shouldPass ?? []) {
    const r = check({ scope, text: c.text })
    if (r.blocks.length) {
      failures.push(`${set.rule} 假陽性：lint 直接否決了正當用法\n      文字：${c.text}\n      理由：${c.why}\n      命中：${r.blocks.map((b) => b.id).join(', ')}`)
    } else pass += 1
  }

  // 2. `exact` rules must decide on their own; `lint` rules must reach layer 2.
  for (const c of [...(set.shouldBlock ?? []), ...(set.shouldWarn ?? [])]) {
    const r = check({ scope, text: c.text })
    if (rule.detection === 'exact') {
      if (decisive(r)) pass += 1
      else failures.push(`${set.rule} 漏判：detection 是 exact，應由第一層直接判定\n      文字：${c.text}`)
    } else if (surfaced(r)) {
      pass += 1
      handoffs.push({ rule: set.rule, text: c.text, why: c.why })
    } else {
      failures.push(`${set.rule} 漏判：既沒有被 lint 命中，也沒有進語意層\n      文字：${c.text}`)
    }
  }
}

// 3. Every lint rule must own a golden set — otherwise §5.6 is unenforced.
for (const rule of RULES.rules) {
  if (rule.detection !== 'lint') continue
  if (!fs.existsSync(path.join(DIR, `${rule.id}.json`))) {
    handoffs.push({ rule: rule.id, text: null, why: '尚無黃金測試集（docs/11 §5.6 要求每條 lint 規則至少 3 擋 / 3 放）' })
  }
}

console.log(`\n紅線測試（規則版本 ${RULES.version}）`)
console.log(`通過 ${pass} 項${failures.length ? `，失敗 ${failures.length} 項` : ''}\n`)

if (handoffs.length) {
  console.log('交給語意層的案例（第一層無法自行判定，這是設計如此）：')
  for (const h of handoffs) console.log(`  · ${h.rule}${h.text ? ` — ${h.text.slice(0, 34)}…` : ''}  ${h.why ? `（${h.why.slice(0, 46)}）` : ''}`)
  console.log('')
}

if (failures.length) {
  console.log('失敗：')
  for (const f of failures) console.log(`  ✗ ${f}`)
  console.log('')
  process.exit(1)
}

console.log('✅ 第一層沒有誤擋任何正當用法，exact 規則全部自行判定成功。')
