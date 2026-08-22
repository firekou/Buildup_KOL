import express from 'express'
import { RULES, checkContent } from '../lib/redlines.js'
import { getKol } from '../lib/kols.js'
import * as store from '../lib/store.js'

const router = express.Router()

/** The rule set itself — so the UI can render `why_plain` and `evidence` without a second copy. */
router.get('/redline/rules', (req, res) => {
  res.json({
    version: RULES.version,
    updated: RULES.updated,
    gradingCriteria: RULES.grading_criteria,
    detectionLevels: RULES.detection_levels,
    rules: RULES.rules.map((r) => ({
      id: r.id,
      category: r.category ?? 'redline',
      severity: r.severity,
      detection: r.detection ?? 'lint',
      scope: r.scope,
      title: r.title,
      rule: r.rule,
      whyPlain: r.why_plain,
      semanticPrompt: r.semantic_prompt ?? null,
      evidence: r.evidence ?? [],
      remedy: r.remedy,
    })),
  })
})

/**
 * First-layer check. docs/11 §5.4 — this endpoint never returns a final
 * verdict for `lint` rules; `resolved: false` means the semantic layer still
 * owes an answer.
 */
router.post('/redline/check', (req, res) => {
  const { scope = 'script', text = '', kolId = null } = req.body ?? {}
  const kol = kolId ? getKol(kolId) : null
  if (kolId && !kol) return res.status(404).json({ error: `unknown KOL "${kolId}"` })

  res.json(
    checkContent({
      scope,
      text,
      persona: kol?.affinity ?? null,
      profile: kol?.profile ?? null,
    }),
  )
})

/** docs/11 §5.6 — record a human overturning the semantic layer. */
router.post('/redline/judgement', (req, res) => {
  const { ruleId, text, llmVerdict, humanVerdict, reason = null, reviewedBy = null } = req.body ?? {}
  if (!ruleId || !humanVerdict) {
    return res.status(400).json({ error: 'ruleId 與 humanVerdict 為必填' })
  }
  res.status(201).json(
    store.insert('judgementLog', {
      ruleId,
      text: String(text ?? '').slice(0, 2000),
      llmVerdict: llmVerdict ?? null,
      humanVerdict,
      overturned: Boolean(llmVerdict) && llmVerdict !== humanVerdict,
      reason,
      reviewedBy,
      rulesVersion: RULES.version,
    }),
  )
})

router.get('/redline/judgements', (req, res) => {
  const rows = store.list('judgementLog', { ruleId: req.query.ruleId })
  res.json({
    total: rows.length,
    overturned: rows.filter((r) => r.overturned).length,
    rows,
  })
})

/** docs/11 §2.4 — the veto log, and the human verdict on each veto. */
router.post('/veto-log', (req, res) => {
  const { kolId, topicId, fit, gatesFailed = [], note = null } = req.body ?? {}
  if (!kolId) return res.status(400).json({ error: 'kolId 為必填' })
  res.status(201).json(
    store.insert('vetoLog', { kolId, topicId: topicId ?? null, fit: fit ?? null, gatesFailed, note, humanVerdict: null }),
  )
})

router.patch('/veto-log/:id', (req, res) => {
  const { humanVerdict, reviewedBy = null, note = null } = req.body ?? {}
  if (!['agree', 'disagree', 'unsure'].includes(humanVerdict)) {
    return res.status(400).json({ error: 'humanVerdict 必須是 agree / disagree / unsure' })
  }
  const row = store.update('vetoLog', req.params.id, {
    humanVerdict,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    ...(note ? { note } : {}),
  })
  if (!row) return res.status(404).json({ error: 'not found' })
  res.json(row)
})

router.get('/veto-log', (req, res) => {
  const rows = store.list('vetoLog', { kolId: req.query.kolId })
  res.json({
    total: rows.length,
    reviewed: rows.filter((r) => r.humanVerdict).length,
    disagreed: rows.filter((r) => r.humanVerdict === 'disagree').length,
    rows,
  })
})

export default router
