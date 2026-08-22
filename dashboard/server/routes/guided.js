import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { KOLS_DIR } from '../config.js'
import { STEPS, getStep, validateStep, draftToAffinity } from '../lib/wizard.js'
import { generatePlans } from '../lib/plans.js'
import { getRegionTopics, PLATFORMS } from '../lib/topics/index.js'
import { checkContent } from '../lib/redlines.js'
import { listNotes, getNote, noteIndex } from '../lib/scoring/notes.js'
import { getConfig } from '../lib/scoring/gates.js'
import { getData } from '../lib/kols.js'

const router = express.Router()

const parsePlatforms = (v) =>
  ((Array.isArray(v) ? v : String(v ?? '').split(',')).map((s) => s.trim()).filter((s) => PLATFORMS.includes(s)) || []).length
    ? (Array.isArray(v) ? v : String(v).split(',')).map((s) => s.trim()).filter((s) => PLATFORMS.includes(s))
    : PLATFORMS

/* ---------------------------------------------------------------- §3 備註 */

router.get('/notes', (req, res) => res.json({ notes: listNotes(), byKey: noteIndex() }))
router.get('/notes/:dimension', (req, res) => {
  const n = getNote(req.params.dimension)
  if (!n) return res.status(404).json({ error: `unknown dimension "${req.params.dimension}"` })
  res.json(n)
})

router.get('/config/scoring', (req, res) => {
  const cfg = getConfig({ refresh: true })
  const items = Object.entries(cfg.calibration)
  res.json({
    ...cfg,
    calibrationSummary: {
      total: items.length,
      calibrated: items.filter(([, v]) => v.status === 'calibrated').length,
      /** docs/11 §3.3 — this belongs on the front page, not buried. */
      banner: `已校準項目：${items.filter(([, v]) => v.status === 'calibrated').length} / ${items.length}。其餘都是先驗，可以被資料推翻。`,
    },
  })
})

/* ---------------------------------------------------------------- §6 wizard */

router.get('/create/steps', (req, res) => res.json({ steps: STEPS.map(({ panel, ...s }) => ({ ...s, panel })) }))

router.get('/create/steps/:id', (req, res) => {
  const step = getStep(req.params.id)
  if (!step) return res.status(404).json({ error: 'no such step' })
  res.json(step)
})

/** Per-step validation plus a redline pass over whatever has been filled so far. */
router.post('/create/validate', (req, res) => {
  const { stepId, draft = {} } = req.body ?? {}
  const validation = validateStep(stepId, draft)
  const affinity = draftToAffinity(draft)
  const redline = checkContent({
    scope: 'persona',
    persona: affinity,
    profile: { content: { pillars: draft.pillars ?? [] } },
  })
  res.json({ ...validation, redline })
})

/** Final assembly. Nothing is written while a block-level redline stands. */
router.post('/create/finalize', (req, res) => {
  const { draft = {}, write = false } = req.body ?? {}
  const problems = STEPS.slice(0, 7).map((s) => validateStep(s.id, draft)).filter((v) => !v.passed)
  const affinity = draftToAffinity(draft)
  const redline = checkContent({
    scope: 'persona',
    persona: affinity,
    profile: { content: { pillars: draft.pillars ?? [] } },
  })

  const canSave = problems.length === 0 && !redline.blocked
  if (!canSave || !write) {
    return res.json({
      saved: false,
      canSave,
      problems,
      redline,
      preview: affinity,
      reason: redline.blocked
        ? '有 block 級紅線未解決——不得存檔。'
        : problems.length
          ? '還有步驟沒填完。'
          : 'write=false，只做預覽。',
    })
  }

  const id = String(draft.id ?? '').trim()
  if (!/^[a-z0-9-]{3,40}$/.test(id)) return res.status(400).json({ error: 'id 必須是 3–40 字的小寫英數與連字號' })
  const dir = path.join(KOLS_DIR, id)
  if (fs.existsSync(dir)) return res.status(409).json({ error: `kols/${id} 已存在` })

  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'topic_affinity.json'), JSON.stringify(affinity, null, 2) + '\n')
  getData({ refresh: true })
  res.status(201).json({ saved: true, id, path: `kols/${id}/topic_affinity.json`, redline })
})

/* ---------------------------------------------------------------- §7 explore */

router.get('/explore/topics', async (req, res, next) => {
  try {
    const { region = 'GLOBAL', platforms, limit = 20, refresh } = req.query
    const set = await getRegionTopics(region, {
      platforms: parsePlatforms(platforms),
      limit: Number(limit) || 20,
      refresh: refresh === 'true',
    })
    res.json({
      ...set,
      /** §7.1 — the label is not negotiable while confidence is `none`. */
      volumeLabel: set.heatConfidence === 'none' ? '樣本共現密度' : '樣本共現密度（有歷史可比）',
      seedWarning:
        '種子詞決定了你能看到什麼——這份清單其實是「跟種子詞一起出現的字」，不是「大家在講什麼」。',
    })
  } catch (err) {
    next(err)
  }
})

/**
 * §7.2 — cross-domain co-occurrence. Deliberately NOT called "structural holes"
 * or "bridges": Burt's concept is about actors and network positions, and a tag
 * appearing in two domains is just as likely to be a generic filler word.
 * Zone B, and it says so.
 */
router.get('/explore/cross-domain', async (req, res, next) => {
  try {
    const { region = 'GLOBAL', platforms } = req.query
    const set = await getRegionTopics(region, { platforms: parsePlatforms(platforms), limit: 500 })

    const byTag = new Map()
    for (const t of set.allTopics) {
      const key = t.tag.toLowerCase().replace(/^#/, '')
      if (!byTag.has(key)) byTag.set(key, [])
      byTag.get(key).push(t)
    }

    const candidates = [...byTag.entries()]
      .filter(([, rows]) => new Set(rows.map((r) => r.domain)).size > 1)
      .map(([tag, rows]) => ({
        tag: `#${tag}`,
        domains: [...new Set(rows.map((r) => r.domain))],
        perDomainSamples: rows.map((r) => ({ domain: r.domain, volume: r.volume })),
      }))

    res.json({
      zone: 'B',
      enabled: false,
      candidates: [],
      candidateCountIfEnabled: candidates.length,
      label: '跨域共現候選',
      why: 'Burt (1992) 的結構洞說的是「連接互不相通群體的位置」比「熱度最高的位置」更有價值。這一項想找的是那種位置。',
      caveat:
        '但這個代理指標目前站不住腳：在靜態資料裡最容易跨不相關類別共現的，通常是缺乏領域特徵的泛用詞（#日常、#分享），不是真正能橋接兩群受眾的節點。所以它在實驗區，預設關閉，也不叫「橋接」或「結構洞」。',
      exitCondition: '需要：跨 domain 的作者集合重疊率低、各 domain 內都有足夠樣本、且不在泛用詞名單內。目前三項都無法驗證。',
    })
  } catch (err) {
    next(err)
  }
})

/* ---------------------------------------------------------------- §8 plans */

router.post('/plans/generate', async (req, res, next) => {
  try {
    const { kolId, region = 'GLOBAL', platforms, count = 8, includeHooks = true } = req.body ?? {}
    if (!kolId) return res.status(400).json({ error: 'kolId 為必填' })
    res.json(await generatePlans(kolId, { region, platforms: parsePlatforms(platforms), count, includeHooks }))
  } catch (err) {
    next(err)
  }
})

export default router
