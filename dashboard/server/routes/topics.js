import express from 'express'
import { getRegionTopics, listRegions, crossQuery, PLATFORMS } from '../lib/topics/index.js'
import { isApifyConfigured, apify } from '../config.js'

const router = express.Router()

const parsePlatforms = (value) => {
  if (!value) return PLATFORMS
  const wanted = String(value).split(',').map((s) => s.trim()).filter(Boolean)
  const valid = wanted.filter((p) => PLATFORMS.includes(p))
  return valid.length ? valid : PLATFORMS
}

router.get('/topics/regions', (req, res) => {
  res.json({
    regions: listRegions(),
    platforms: PLATFORMS,
    apify: {
      configured: isApifyConfigured(),
      actors: apify.actors,
      cacheTtlSeconds: apify.cacheTtl,
    },
  })
})

router.get('/topics', async (req, res, next) => {
  try {
    const region = req.query.region || 'GLOBAL'
    const result = await getRegionTopics(region, {
      platforms: parsePlatforms(req.query.platforms),
      limit: Math.min(Number(req.query.limit) || 10, 100),
      refresh: req.query.refresh === 'true',
    })
    // allTopics can be large; the list endpoint only ships the ranked slice.
    const { allTopics, ...rest } = result
    res.json(rest)
  } catch (err) {
    next(err)
  }
})

router.post('/topics/cross-query', async (req, res, next) => {
  try {
    const { region = 'GLOBAL', tags = [], mode = 'intersection', platforms } = req.body ?? {}
    if (!Array.isArray(tags) || !tags.length) {
      return res.status(400).json({ error: '至少要給一個 tag' })
    }
    res.json(await crossQuery(region, tags, { mode, platforms: parsePlatforms(platforms?.join?.(',')) }))
  } catch (err) {
    next(err)
  }
})

export default router
