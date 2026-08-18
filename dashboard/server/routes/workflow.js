import express from 'express'
import { kolToTopics, topicToKols, combinationToBrief } from '../lib/workflow.js'
import { PLATFORMS } from '../lib/topics/index.js'

const router = express.Router()

const parsePlatforms = (value) => {
  if (!value) return PLATFORMS
  const list = Array.isArray(value) ? value : String(value).split(',')
  const valid = list.map((s) => String(s).trim()).filter((p) => PLATFORMS.includes(p))
  return valid.length ? valid : PLATFORMS
}

/** (a) 從 KOL 尋找適合的話題 */
router.get('/workflow/kol-to-topics', async (req, res, next) => {
  try {
    res.json(
      await kolToTopics(req.query.kolId, {
        region: req.query.region || 'GLOBAL',
        platforms: parsePlatforms(req.query.platforms),
        limit: Math.min(Number(req.query.limit) || 10, 50),
      }),
    )
  } catch (err) {
    next(err)
  }
})

/** (b) 從話題篩選適合的 KOL */
router.post('/workflow/topic-to-kols', async (req, res, next) => {
  try {
    const { region = 'GLOBAL', platforms, ...topicRef } = req.body ?? {}
    res.json(await topicToKols(topicRef, { region, platforms: parsePlatforms(platforms) }))
  } catch (err) {
    next(err)
  }
})

/** (c) 從人選與話題的組合產出導流素材企劃 + 預評 */
router.post('/workflow/combination', async (req, res, next) => {
  try {
    const { kolId, topicIds = [], adHocTopics = [], region = 'GLOBAL', platforms, fourAxis = {} } = req.body ?? {}
    res.json(
      await combinationToBrief({
        kolId,
        topicIds,
        adHocTopics,
        region,
        platforms: parsePlatforms(platforms),
        fourAxis,
      }),
    )
  } catch (err) {
    next(err)
  }
})

export default router
