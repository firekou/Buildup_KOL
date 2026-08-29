/**
 * Platform catalogue — the 下發平臺 layer.
 *
 * PRODUCT_SPEC.md §13 `platform_policy` and SYSTEM_ARCHITECTURE.md §3.9: one
 * adapter per platform, and the constraints that adapter enforces live in data
 * so the review gate can check an asset against them *before* a publish job
 * burns a rate-limit slot.
 *
 * `automation` is the field that matters for governance. `api` means the
 * platform has a documented publishing API and automated posting is within its
 * terms; `manual_only` means the OS records the publication a human made and
 * never pretends to have posted it. Nothing here is allowed to be flipped to
 * `api` because it would be convenient — that is the ban-evasion line the spec
 * draws (ROADMAP.md Epic 8 explicit non-task).
 */

export const PLATFORMS = {
  threads: {
    id: 'threads',
    label: 'Threads',
    formats: ['text', 'image', 'carousel', 'short_video'],
    maxTextLength: 500,
    aspectRatios: ['1:1', '4:5', '9:16'],
    automation: 'api',
    disclosureRequired: true,
    disclosureNote: 'Meta 對 AI 生成的寫實影像要求標示；帳號 bio 與貼文皆需可辨識為 AI 角色。',
    telemetry: ['impressions', 'likes', 'replies', 'reposts', 'clicks'],
    rateLimitPerDay: 25,
    notes: '純文字題材命中率高；連結會被降權，CTA 建議放留言或 bio。',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    formats: ['image', 'carousel', 'reel'],
    maxTextLength: 2200,
    aspectRatios: ['1:1', '4:5', '9:16'],
    automation: 'api',
    disclosureRequired: true,
    disclosureNote: 'Reels 需標示 AI 生成；貼文內文不得暗示為真人拍攝。',
    telemetry: ['impressions', 'reach', 'likes', 'comments', 'saves', 'shares', 'profile_visits', 'clicks'],
    rateLimitPerDay: 25,
    notes: '外連只能走 bio / link sticker，tracking link 一定要帶。',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    formats: ['short_video'],
    maxTextLength: 2200,
    aspectRatios: ['9:16'],
    automation: 'api',
    disclosureRequired: true,
    disclosureNote: 'TikTok 要求 AI 生成內容開啟 AI-generated content 標籤。',
    telemetry: ['views', 'likes', 'comments', 'shares', 'watch_time', 'clicks'],
    rateLimitPerDay: 10,
    notes: '前 1.5 秒決定完播；hook mutation 在這裡的訊號最乾淨。',
  },
  x: {
    id: 'x',
    label: 'X',
    formats: ['text', 'image', 'short_video'],
    maxTextLength: 280,
    aspectRatios: ['16:9', '1:1', '9:16'],
    automation: 'api',
    disclosureRequired: true,
    disclosureNote: '合成媒體政策：不得以真人身分誤導。',
    telemetry: ['impressions', 'likes', 'reposts', 'replies', 'bookmarks', 'clicks'],
    rateLimitPerDay: 50,
    notes: '爭議題材擴散快，risk gate 要收緊；連結可直放。',
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    label: 'YouTube Shorts',
    formats: ['short_video'],
    maxTextLength: 5000,
    aspectRatios: ['9:16'],
    automation: 'api',
    disclosureRequired: true,
    disclosureNote: '需勾選 altered/synthetic content 揭露。',
    telemetry: ['views', 'likes', 'comments', 'shares', 'watch_time', 'clicks'],
    rateLimitPerDay: 10,
    notes: '描述欄可放 tracking link，是最好歸因的短影音平台。',
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    label: '小紅書',
    formats: ['image', 'carousel', 'short_video'],
    maxTextLength: 1000,
    aspectRatios: ['3:4', '9:16'],
    // No sanctioned publishing API for this account type — the OS records what
    // a human posted rather than automating it.
    automation: 'manual_only',
    disclosureRequired: true,
    disclosureNote: '需依平台規範標註 AI 生成；商業推廣需報備。',
    telemetry: ['impressions', 'likes', 'collects', 'comments', 'follows'],
    rateLimitPerDay: 5,
    notes: '導站限制多，主要作品牌與搜尋沉澱，conversion 走 referral code。',
  },
}

export const PLATFORM_IDS = Object.keys(PLATFORMS)

export const getPlatform = (id) => PLATFORMS[id] ?? null

export const FORMATS = [...new Set(Object.values(PLATFORMS).flatMap((p) => p.formats))]

/**
 * Constraint check used by the review gate (growth/gates.js) and by the
 * publisher before it accepts a job. Returns violations, never throws — the
 * caller decides whether a violation blocks or merely warns.
 */
export function checkPlatformFit({ platform, format, textLength = 0, aspectRatio = null }) {
  const spec = getPlatform(platform)
  if (!spec) return [{ code: 'UNKNOWN_PLATFORM', message: `未知平台 "${platform}"` }]

  const violations = []
  if (format && !spec.formats.includes(format)) {
    violations.push({ code: 'FORMAT_UNSUPPORTED', message: `${spec.label} 不支援 ${format}（支援：${spec.formats.join('/')}）` })
  }
  if (textLength > spec.maxTextLength) {
    violations.push({ code: 'TEXT_TOO_LONG', message: `${spec.label} 文案上限 ${spec.maxTextLength} 字，目前 ${textLength} 字` })
  }
  if (aspectRatio && !spec.aspectRatios.includes(aspectRatio)) {
    violations.push({ code: 'ASPECT_RATIO', message: `${spec.label} 建議比例 ${spec.aspectRatios.join('/')}，目前 ${aspectRatio}` })
  }
  return violations
}
