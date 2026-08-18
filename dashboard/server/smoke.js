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
    assert(b.axes?.length === 8, 'expected 8 axes')
    return `topic source: ${b.topicSource}`
  })

  await check('GET /api/kols', async () => {
    const b = await json('/api/kols')
    assert(b.kols.length > 0, 'no KOLs')
    assert(b.kols.every((k) => k.axes), 'a KOL is missing persona_axes')
    kolId = b.kols[0].id
    return `${b.kols.length} KOLs, first = ${kolId}`
  })

  await check('GET /api/kols/:id', async () => {
    const b = await json(`/api/kols/${kolId}`)
    assert(b.hooks.length >= 3, 'fewer than 3 topic hooks')
    assert(b.hooks.every((h) => Number.isFinite(h.match.score)), 'a hook has no match score')
    assert(b.images.length > 0, 'no images resolved')
    return `${b.hooks.length} hooks, ${b.images.length} images, top match ${b.hooks[0].match.score}`
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
    return `top = ${b.recommended[0].kol.id} (${b.recommended[0].match.score})`
  })

  await check('redline veto blocks a gambling topic', async () => {
    const b = await json('/api/workflow/topic-to-kols', {
      method: 'POST',
      body: JSON.stringify({ region: 'MY', tag: '#百家樂攻略', title: '百家乐必胜投注攻略 稳赢打法', domain: 'game' }),
    })
    const compliance = ['xiaoxiao-tan', 'faye-tan', 'loima-cheung']
    const blockedIds = b.excluded.map((e) => e.kol.id)
    assert(
      compliance.every((id) => blockedIds.includes(id)),
      `showgame KOLs not blocked: blocked = ${blockedIds.join(',') || 'none'}`,
    )
    return `${b.excluded.length} blocked by redlines`
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
      }),
    })
    assert(b.preEvaluation.predictedFunnel.views > 0, 'no predicted views')
    assert(b.preEvaluation.decision.key, 'no decision')
    return `decision=${b.preEvaluation.decision.key}, match=${b.match.score}, predViews=${b.preEvaluation.predictedFunnel.views}`
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
    assert(b.comparison?.rows?.length === 5, 'comparison should have 5 funnel rows')
    assert(b.comparison.attribution?.key, 'no attribution')
    return `attribution=${b.comparison.attribution.key}`
  })

  await check('GET /api/evaluations/compare/:preId', async () => {
    const b = await json(`/api/evaluations/compare/${preId}`)
    assert(b.status === 'complete', `status=${b.status}`)
    return `views variance ${b.comparison.rows[0].variancePercent}%`
  })

  await check('GET /api/evaluations/calibration', async () => {
    const b = await json('/api/evaluations/calibration')
    assert('sampleSize' in b, 'no sampleSize')
    return `sampleSize=${b.sampleSize}, ready=${b.ready}`
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
