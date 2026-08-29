/**
 * End-to-end smoke test over the live API: boots nothing, assumes the server
 * is already listening. Run with `npm start` in one shell, `npm run smoke` in
 * another, or `BASE=... npm run smoke` against a deployment.
 */
const BASE = process.env.BASE || `http://localhost:${process.env.PORT || 8080}`

let failures = 0
const results = []

async function check(name, fn) {
  try {
    const detail = await fn()
    results.push(`  ok    ${name}${detail ? ` — ${detail}` : ''}`)
  } catch (err) {
    failures += 1
    results.push(`  FAIL  ${name} — ${err.message}`)
  }
}

const json = async (path, init) => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${path} → ${res.status} ${JSON.stringify(body).slice(0, 200)}`)
  return body
}

const assert = (cond, message) => {
  if (!cond) throw new Error(message)
}

async function main() {
  let kolId
  let preId
  let matchRecordId

  await check('GET /api/health', async () => {
    const b = await json('/api/health')
    assert(b.ok && b.kols > 0, `unexpected: ${JSON.stringify(b)}`)
    return `${b.kols} KOLs`
  })

  await check('GET /api/meta', async () => {
    const b = await json('/api/meta')
    assert(b.axes?.length === 4, `expected 4 axes, got ${b.axes?.length}`)
    // docs/11 §2 — there is no weighted total any more. Gates are not weights.
    assert(b.matchWeights === undefined, 'matchWeights must be gone — gates are not weighted terms')
    assert(Array.isArray(b.scoringDimensions) && b.scoringDimensions.length === 3, 'expected 3 scored dimensions')
    assert(!b.scoringDimensions.includes('topicHeat'), 'topicHeat must not be a scored dimension')
    assert(b.calibration && Object.values(b.calibration).every((c) => c.status === 'none'), 'nothing may claim to be calibrated yet')
    return `topic source: ${b.topicSource}`
  })

  await check('GET /api/kols', async () => {
    const b = await json('/api/kols')
    assert(b.kols.length > 0, 'no KOLs')
    assert(b.kols.every((k) => k.axes), 'a KOL is missing axes')
    assert(b.kols.every((k) => k.formatFit), 'a KOL is missing format_fit')
    kolId = b.kols[0].id
    return `${b.kols.length} KOLs, first = ${kolId}`
  })

  await check('GET /api/kols/:id', async () => {
    const b = await json(`/api/kols/${kolId}`)
    assert(b.hooks.length >= 3, 'fewer than 3 topic hooks')
    assert(b.hooks.every((h) => 'gatesPassed' in h.match || h.match.validation), 'a hook has no gate result')
    assert(b.images.length > 0, 'no images resolved')
    return `${b.hooks.length} hooks, ${b.images.length} images, top band ${b.hooks[0].match.band?.label ?? '—'}`
  })

  await check('GET /api/topics?region=SG', async () => {
    const b = await json('/api/topics?region=SG&limit=10')
    assert(b.topics.length === 10, `expected 10 topics, got ${b.topics.length}`)
    assert(b.topics[0].heat >= b.topics.at(-1).heat, 'topics are not heat-sorted')
    return `source=${b.source}, top=${b.topics[0].tag}`
  })

  await check('POST /api/topics/cross-query', async () => {
    const b = await json('/api/topics/cross-query', {
      method: 'POST',
      body: JSON.stringify({ region: 'SG', tags: ['city'], mode: 'intersection' }),
    })
    assert(Array.isArray(b.matched), 'no matched array')
    return `${b.matched.length} matched`
  })

  await check('(a) GET /api/workflow/kol-to-topics', async () => {
    const b = await json(`/api/workflow/kol-to-topics?kolId=${kolId}&region=SG`)
    assert(b.recommended.length + b.excluded.length > 0, 'no results')
    assert(b.hooks.length > 0, 'no hooks scored')
    return `${b.recommended.length} recommended, ${b.excluded.length} blocked`
  })

  await check('(b) POST /api/workflow/topic-to-kols', async () => {
    const b = await json('/api/workflow/topic-to-kols', {
      method: 'POST',
      body: JSON.stringify({ region: 'SG', tag: '#登山事故', title: '高海拔登山事故與風險判斷', domain: 'news' }),
    })
    assert(b.recommended.length > 0, 'no KOL recommended')
    return `top = ${b.recommended[0].kol.id} (${b.recommended[0].match.band?.label ?? '—'})`
  })

  await check('redline veto blocks a gambling topic', async () => {
    const b = await json('/api/workflow/topic-to-kols', {
      method: 'POST',
      body: JSON.stringify({ region: 'MY', tag: '#百家樂攻略', title: '百家乐必胜投注攻略 稳赢打法', domain: 'game' }),
    })
    // docs/11 §5.4 — keyword matching is now a lint layer, so a redline hit
    // surfaces as needsReview rather than an automatic veto. What must still
    // hold is that nobody sails through with a clean bill of health.
    const clean = b.recommended.filter((r) => (r.match.needsReview ?? []).length === 0 && (r.match.warnings ?? []).length === 0)
    assert(clean.length === 0, `賭博話題不該有任何 KOL 完全無標記：${clean.map((c) => c.kol.id).join(',')}`)
    return `${b.excluded.length} 被 gate 擋下，${b.recommended.length} 需人工判定`
  })

  await check('(c) POST /api/workflow/combination', async () => {
    const topics = await json('/api/topics?region=SG&limit=3')
    const b = await json('/api/workflow/combination', {
      method: 'POST',
      body: JSON.stringify({
        kolId,
        region: 'SG',
        topicIds: [topics.topics[0].id],
        fourAxis: { entertaining: 4, musicality: 4, authenticity: 5, motionFluency: 4 },
        targets: { views: 25000, linkClicks: 60 },
      }),
    })
    assert(b.preEvaluation.predictedFunnel === undefined, 'funnel prediction should be gone')
    assert(b.preEvaluation.targets.views === 25000, 'targets not carried through')
    assert(b.brief.feasibility.some((f) => f.message.includes('日常適配')), 'format_fit not surfaced in the brief')
    assert(Object.keys(b.brief).length <= 10, `brief has ${Object.keys(b.brief).length} fields, expected a trimmed one`)
    assert(b.preEvaluation.decision.key, 'no decision')
    return `decision=${b.preEvaluation.decision.key}, band=${b.match.band?.label ?? '—'}, target=${b.preEvaluation.targets.views}`
  })

  await check('POST /api/evaluations/pre', async () => {
    const topics = await json('/api/topics?region=SG&limit=3')
    const combo = await json('/api/workflow/combination', {
      method: 'POST',
      body: JSON.stringify({
        kolId,
        region: 'SG',
        topicIds: [topics.topics[0].id],
        fourAxis: { entertaining: 4, musicality: 4, authenticity: 5, motionFluency: 4 },
        targets: { views: 25000, linkClicks: 60 },
      }),
    })
    const saved = await json('/api/evaluations/pre', { method: 'POST', body: JSON.stringify(combo.preEvaluation) })
    preId = saved.id
    return `saved ${preId}`
  })

  await check('POST /api/match-records (Match 庫)', async () => {
    const rec = await json('/api/match-records', {
      method: 'POST',
      body: JSON.stringify({
        kolId,
        platform: 'tiktok',
        postUrl: 'https://example.test/smoke',
        publishedAt: new Date().toISOString(),
        views: 21000,
        likes: 890,
        comments: 120,
        shares: 65,
        saves: 40,
        profileVisits: 640,
        linkClicks: 48,
        conversions: 1,
      }),
    })
    matchRecordId = rec.id
    return `saved ${matchRecordId}`
  })

  await check('POST /api/evaluations/post + comparison', async () => {
    const b = await json('/api/evaluations/post', {
      method: 'POST',
      body: JSON.stringify({
        preEvaluationId: preId,
        matchRecordId,
        fourAxisActual: { entertaining: 4, musicality: 3, authenticity: 5, motionFluency: 4 },
      }),
    })
    assert(b.comparison?.rows?.length === 3, `comparison should have 3 rows, got ${b.comparison?.rows?.length}`)
    assert('measuredAt' in b.record, 'post record must carry measuredAt (docs/11 §9.4-B)')
    assert('observationWindow' in b.record, 'post record must resolve an observation window')
    assert(b.comparison.attribution?.key, 'no attribution')
    // 顯示三欄，但原始欄位必須照存（docs/10 第五刀）
    assert(b.record.actuals.profileVisits === 640, 'profileVisits must still be stored')
    assert(b.record.actuals.saves === 40, 'saves must still be stored')
    return `attribution=${b.comparison.attribution.key}, 已存欄位 ${Object.keys(b.record.actuals).length} 個`
  })

  await check('GET /api/evaluations/compare/:preId', async () => {
    const b = await json(`/api/evaluations/compare/${preId}`)
    assert(b.status === 'complete', `status=${b.status}`)
    return `觀看 vs 目標 ${b.comparison.rows[0].variancePercent}%（${b.comparison.rows[0].verdict}）`
  })

  await check('校準端點已移除（docs/10 第六刀）', async () => {
    const res = await fetch(`${BASE}/api/evaluations/calibration`)
    assert(res.status === 404, `expected 404, got ${res.status}`)
    return '404 as expected'
  })

  await check('無支柱對應 → 待綁定，不給等級', async () => {
    const b = await json('/api/workflow/topic-to-kols', {
      method: 'POST',
      body: JSON.stringify({ region: 'SG', tag: '#盆栽修剪', title: '阳台盆栽修剪与介质配比', domain: 'life' }),
    })
    const unbound = b.recommended.filter((r) => r.match.needsBinding)
    assert(unbound.length > 0, 'expected at least one KOL with no pillar home')
    assert(unbound.every((r) => r.match.decision?.key === 'unbound'), 'unbound match must be flagged as needing a pillar binding')
    return `${unbound.length} 位待綁定`
  })

  /* ------------------------------------------------ Growth OS (projects/growth-hack-os) */

  await check('Growth OS meta 端點提供完整詞彙表', async () => {
    const b = await json('/api/growth/meta')
    assert(b.stages?.length === 10, `expected 10 pipeline stages, got ${b.stages?.length}`)
    assert(b.evaluator?.version, 'evaluator version must be reported')
    assert(b.policyProfiles?.length > 0, 'policy profiles must be seeded at boot')
    assert(b.generationAdapters?.some((a) => a.id === 'template' && a.configured), 'template adapter must always be usable')
    return `${b.stages.length} 階段 · evaluator v${b.evaluator.version} · ${b.policyProfiles.length} policy profiles`
  })

  await check('Growth OS 產品看板可回答每個產品走到哪一格', async () => {
    const b = await json('/api/growth/dashboard/board')
    assert(Array.isArray(b.board), 'board must be an array')
    for (const row of b.board) {
      assert(row.stage && row.reached?.includes(row.stage), `${row.name} 的 stage 必須在 reached 之內`)
      assert(row.stage === 'compounding' ? true : Boolean(row.blockedBy), `${row.name} 未完成閉環時必須說出卡在哪`)
    }
    return `${b.board.length} 個產品`
  })

  await check('Winner yield 不會超過 1', async () => {
    const b = await json('/api/growth/dashboard/overview')
    assert(b.winners.yield == null || b.winners.yield <= 1, `yield=${b.winners.yield}`)
    return b.winners.yieldBasis
  })

  await check('歸因覆蓋率把直接量測／模型／無法歸因分開', async () => {
    const b = await json('/api/growth/attribution')
    const c = b.coverage
    assert(c.direct + c.modeled + c.unattributed === c.total, '三類相加必須等於總數')
    assert(typeof c.says === 'string' && c.says.length > 0, 'coverage 必須有可讀的說明句')
    return c.says
  })

  await check('實驗契約缺欄位時不得建立', async () => {
    const res = await fetch(`${BASE}/api/growth/experiments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productId: 'prd_nope', hypothesis: '太短' }),
    })
    assert(res.status === 400 || res.status === 404, `expected rejection, got ${res.status}`)
    return `${res.status} as expected`
  })

  console.log(`\nSmoke test against ${BASE}\n${results.join('\n')}\n`)
  if (failures) {
    console.error(`${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('all checks passed')
}

main().catch((err) => {
  console.error(results.join('\n'))
  console.error('smoke run aborted:', err)
  process.exit(1)
})
