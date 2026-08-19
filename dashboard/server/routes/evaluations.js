import express from 'express'
import * as store from '../lib/store.js'
import { buildPostEvaluation, compare, normalizeActuals } from '../lib/scoring/evaluation.js'
import { isApifyConfigured } from '../config.js'

const router = express.Router()

/* ------------------------------------------------------------ Match 庫 */

/**
 * Match 庫 — the performance-data table that post-evaluation reads from.
 * Records arrive either by manual entry (POST) or, once Apify is configured,
 * by a scheduled pull keyed on the published post URL.
 */
router.get('/match-records', (req, res) => {
  res.json({ records: store.list('matchRecords', { kolId: req.query.kolId }) })
})

router.post('/match-records', (req, res) => {
  const { kolId, postUrl, platform, publishedAt, ...metrics } = req.body ?? {}
  if (!kolId) return res.status(400).json({ error: 'kolId is required' })
  const record = store.insert('matchRecords', {
    kolId,
    postUrl: postUrl ?? null,
    platform: platform ?? null,
    publishedAt: publishedAt ?? null,
    source: 'manual',
    metrics: normalizeActuals(metrics),
  })
  res.status(201).json(record)
})

router.post('/match-records/sync', (req, res) => {
  if (!isApifyConfigured()) {
    return res.status(503).json({
      error: 'APIFY_TOKEN 未設定，無法自動回抓成效資料',
      hint: '在 Railway 設定 APIFY_TOKEN 後即可啟用；在那之前請用 POST /api/match-records 手動輸入。',
    })
  }
  // Pulling per-post metrics needs an actor scoped to the published URL, which
  // differs per platform and per plan. Left explicit rather than half-wired.
  res.status(501).json({
    error: 'Match 庫自動同步尚未接上 actor',
    hint: '請在 dashboard/server/lib/topics/apify.js 依所選 actor 補上 post-level metrics 抓取，再改寫此端點。',
  })
})

/* ------------------------------------------------------- 預先評估 (Pre) */

router.get('/evaluations/pre', (req, res) => {
  res.json({ records: store.list('pre', { kolId: req.query.kolId }) })
})

router.get('/evaluations/pre/:id', (req, res) => {
  const record = store.get('pre', req.params.id)
  if (!record) return res.status(404).json({ error: 'not found' })
  res.json(record)
})

router.post('/evaluations/pre', (req, res) => {
  const payload = req.body ?? {}
  if (!payload.kolId || !payload.matchSnapshot) {
    return res.status(400).json({ error: 'kolId 與 matchSnapshot 為必填——請先跑 /api/workflow/combination' })
  }
  res.status(201).json(store.insert('pre', { ...payload, type: 'pre' }))
})

router.delete('/evaluations/pre/:id', (req, res) => {
  res.json({ deleted: store.remove('pre', req.params.id) })
})

/* ------------------------------------------------------ 後續評估 (Post) */

router.get('/evaluations/post', (req, res) => {
  res.json({ records: store.list('post', { kolId: req.query.kolId }) })
})

router.post('/evaluations/post', (req, res) => {
  const { preEvaluationId, matchRecordId, actuals: rawActuals, fourAxisActual = {}, publishedAt, notes } = req.body ?? {}

  const pre = preEvaluationId ? store.get('pre', preEvaluationId) : null
  if (preEvaluationId && !pre) return res.status(404).json({ error: `找不到預評記錄 ${preEvaluationId}` })

  let actuals = rawActuals
  let sourceRecord = null
  if (matchRecordId) {
    sourceRecord = store.get('matchRecords', matchRecordId)
    if (!sourceRecord) return res.status(404).json({ error: `Match 庫裡找不到 ${matchRecordId}` })
    actuals = { ...sourceRecord.metrics, ...(rawActuals ?? {}) }
  }
  if (!actuals) return res.status(400).json({ error: '需要 actuals 或 matchRecordId 其中之一' })

  const post = buildPostEvaluation({
    preEvaluation: pre,
    actuals,
    fourAxisActual,
    publishedAt: publishedAt ?? sourceRecord?.publishedAt ?? null,
    notes,
    matchRecordId: matchRecordId ?? null,
  })

  const saved = store.insert('post', post)
  res.status(201).json({ record: saved, comparison: pre ? compare(pre, saved) : null })
})

/* ------------------------------------------------------- 對照 / 校準 */

router.get('/evaluations/compare/:preId', (req, res) => {
  const pre = store.get('pre', req.params.preId)
  if (!pre) return res.status(404).json({ error: 'not found' })
  const post = store.list('post').find((p) => p.preEvaluationId === pre.id)
  if (!post) return res.json({ pre, post: null, comparison: null, status: 'awaiting_post' })
  res.json({ pre, post, comparison: compare(pre, post), status: 'complete' })
})

router.get('/evaluations/pairs', (req, res) => {
  const posts = store.list('post')
  const pairs = store.list('pre', { kolId: req.query.kolId }).map((pre) => {
    const post = posts.find((p) => p.preEvaluationId === pre.id) ?? null
    return { pre, post, comparison: post ? compare(pre, post) : null }
  })
  res.json({ pairs })
})

// The calibration loop (Pearson correlation + per-KOL baseline suggestions)
// was removed in docs/10 第六刀: it needed 10 completed post-evaluations to
// activate and there are zero, so its only effect was rendering "樣本 2 / 10".
// Because 第五刀 keeps storing every raw metric, rebuilding it later is cheap.

export default router
