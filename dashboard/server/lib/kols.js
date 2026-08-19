import fs from 'node:fs'
import path from 'node:path'
import { KOLS_DIR } from '../config.js'

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const exists = (p) => fs.existsSync(p)

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])

/** Directories, in priority order, that hold display-worthy stills for a KOL. */
const IMAGE_DIRS = ['images/ref', 'images/seedream_v1', 'images', '圖文', 'social media']

let cache = null

/**
 * Collect up to `limit` images for a KOL, preferring the 3-photo identity
 * reference set, then generated scene stills, then anything else on disk.
 */
function collectImages(kolDir, kolId, profile, limit = 12) {
  const found = []
  const seen = new Set()

  const push = (absolute, role) => {
    const rel = path.relative(kolDir, absolute).split(path.sep).join('/')
    if (seen.has(rel)) return
    seen.add(rel)
    found.push({
      role,
      file: rel,
      url: `/api/media/${kolId}/${rel.split('/').map(encodeURIComponent).join('/')}`,
      label: path.basename(rel, path.extname(rel)),
    })
  }

  // 1. Declared identity reference set + avatar from profile.json — these are canonical.
  for (const seed of profile?.ai_assets?.seed_images ?? []) {
    const abs = path.join(kolDir, seed.file)
    if (exists(abs)) push(abs, 'identity_ref')
  }
  const avatar = profile?.ai_assets?.avatar_image?.file
  if (avatar && exists(path.join(kolDir, avatar))) push(path.join(kolDir, avatar), 'avatar')

  // 2. Anything on disk in the conventional folders.
  for (const dir of IMAGE_DIRS) {
    const abs = path.join(kolDir, dir)
    if (!exists(abs) || !fs.statSync(abs).isDirectory()) continue
    const walk = (current, depth) => {
      if (depth > 2 || found.length >= limit) return
      for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (found.length >= limit) return
        const child = path.join(current, entry.name)
        if (entry.isDirectory()) walk(child, depth + 1)
        else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
          push(child, dir === 'images/ref' ? 'identity_ref' : 'scene')
        }
      }
    }
    walk(abs, 0)
  }

  return found.slice(0, limit)
}

function readMarkdown(kolDir, name) {
  const file = path.join(kolDir, name)
  return exists(file) ? fs.readFileSync(file, 'utf8') : null
}

function loadAll() {
  const index = readJson(path.join(KOLS_DIR, 'index.json'))
  const axes = readJson(path.join(KOLS_DIR, 'topic-axes.json'))

  const kols = index.kols.map((entry) => {
    const kolDir = path.join(KOLS_DIR, entry.id)
    const profilePath = path.join(kolDir, 'profile.json')
    const affinityPath = path.join(kolDir, 'topic_affinity.json')

    const profile = exists(profilePath) ? readJson(profilePath) : null
    const affinity = exists(affinityPath) ? readJson(affinityPath) : null
    const images = profile ? collectImages(kolDir, entry.id, profile) : []

    return {
      id: entry.id,
      name: entry.name,
      handle: entry.handle,
      category: entry.category,
      gender: entry.gender,
      ethnicity: entry.ethnicity,
      status: entry.status,
      projectCode: entry.project_code,
      flavor: entry.flavor,
      profile,
      affinity,
      images,
      docs: {
        character: readMarkdown(kolDir, 'character.md'),
        contentStyle: readMarkdown(kolDir, 'content_style.md'),
        characterCard: readMarkdown(kolDir, 'character-card.md'),
      },
      /** Data-completeness flags — the dashboard shows these instead of silently degrading. */
      completeness: {
        hasProfile: Boolean(profile),
        hasAffinity: Boolean(affinity),
        identityRefs: images.filter((i) => i.role === 'identity_ref').length,
        totalImages: images.length,
        topicHooks: affinity?.topic_hooks?.length ?? 0,
        pillarKeywords: Object.keys(affinity?.pillar_keywords ?? {}).length,
      },
    }
  })

  return { axes, kols, indexVersion: index.version }
}

export function getData({ refresh = false } = {}) {
  if (!cache || refresh) cache = loadAll()
  return cache
}

export const getAxes = () => getData().axes
export const listKols = () => getData().kols
export const getKol = (id) => getData().kols.find((k) => k.id === id) || null

/** Compact shape for list views — avoids shipping every character.md to the browser. */
export function toSummary(kol) {
  return {
    id: kol.id,
    name: kol.name,
    handle: kol.handle,
    category: kol.category,
    status: kol.status,
    projectCode: kol.projectCode,
    flavor: kol.flavor,
    archetype: kol.profile?.persona?.archetype ?? null,
    tags: kol.profile?.meta?.tags ?? [],
    axes: kol.affinity?.axes ?? null,
    formatFit: kol.affinity?.format_fit ?? null,
    regions: kol.affinity?.reach?.regions ?? [],
    language: kol.affinity?.reach?.language ?? null,
    hookCount: kol.completeness.topicHooks,
    avatar: kol.images.find((i) => i.role === 'avatar')?.url
      ?? kol.images.find((i) => i.role === 'identity_ref')?.url
      ?? kol.images[0]?.url
      ?? null,
    completeness: kol.completeness,
  }
}
