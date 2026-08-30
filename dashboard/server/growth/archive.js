import { db } from './store.js'
import { newId, assertId } from './ids.js'
import * as audit from './audit.js'
import { emit } from './events.js'
import { getPersona } from './personas.js'
import { getProduct } from './products.js'
import { getAsset } from './generation.js'
import { redlineGate } from '../lib/redlines.js'
import { createTrackingLink } from './tracking.js'

/**
 * The public archive — the one surface in this system that outsiders read.
 *
 * Why it exists, in one line: a reply is an advertisement, and the archive is
 * the thing being advertised. Someone reads a reply, gets curious, clicks the
 * avatar, and lands on a profile. Threads and X profiles are reverse-chrono
 * feeds with no categories and weak search, so the body of work has to live
 * somewhere we control, and the bio link is the only door to it.
 *
 * Three properties this module exists to guarantee, none of which a CMS gives
 * you for free:
 *
 * 1. **Private by default.** `status` starts at `draft`. Only `published`
 *    rows are ever served publicly. A bug that forgets to filter should fail
 *    closed, so `listPublic()` is the only read path the public route uses.
 *
 * 2. **Disclosure is structural, not editorial.** When the author is an AI
 *    persona, `disclosure` is computed from the persona record at publish
 *    time and stored on the row. It is not a sentence someone can forget to
 *    type, and it is not a field the article body can override. This is
 *    R-AI-DISCLOSURE ("不得假裝是真人") enforced by construction.
 *
 * 3. **The redline check runs before publish, not after.** `publishArticle`
 *    refuses a row whose first-layer check is unresolved. Per the repo rule,
 *    an unresolved semantic rule is `needs_human` — never a pass — so the
 *    refusal names what is outstanding instead of silently allowing it.
 *
 * Deliberately NOT here: scheduling, revisions, comments, RSS. The archive's
 * job right now is to exist and be worth reading; every one of those is a
 * feature you add once there is traffic to justify it.
 */

export const ARTICLE_STATUS = ['draft', 'review', 'published', 'retired']

/* ------------------------------------------------------------------ slugs */

/**
 * CJK survives into the slug. A percent-encoded Chinese URL renders as
 * Chinese in every current browser's address bar and in link previews, so
 * transliterating would trade a readable URL for an unreadable one.
 */
function slugify(title) {
  const base = String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_/]+/g, '-')
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-z0-9-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return base || 'note'
}

/** Appends `-2`, `-3`… rather than a random tail, so a slug stays guessable. */
function uniqueSlug(title, selfId = null) {
  const base = slugify(title)
  let candidate = base
  for (let n = 2; n < 200; n += 1) {
    const clash = db.find('articles', (a) => a.slug === candidate && a.id !== selfId)
    if (!clash) return candidate
    candidate = `${base}-${n}`
  }
  return `${base}-${Date.now().toString(36)}`
}

/* ------------------------------------------------------------ disclosure */

/**
 * What the reader is told about who wrote this, derived from the persona
 * record rather than authored per article.
 *
 * `kind` is what the renderer branches on; `text` is what it prints. Both are
 * frozen onto the row at publish time so that editing a persona later cannot
 * retroactively change what an already-published page claimed.
 */
export function disclosureFor(personaId, productId = null) {
  const persona = personaId ? getPersona(personaId, productId) : null
  if (!persona) return { kind: 'unattributed', authorName: null, text: '本文未標示作者。' }

  const tags = persona.tags ?? []
  const isAiPersona = tags.includes('ai-digital-human') || tags.includes('ai-persona')
  const name = persona.name ?? persona.id
  const mode = persona.source?.credibilityMode ?? null

  if (!isAiPersona) {
    return { kind: 'human', authorName: name, credibilityMode: mode, text: `作者：${name}` }
  }

  // The basis sentence is not decoration. Sundar's MAIN model (cited in
  // R-EMBODIMENT's evidence) is that "a machine made this" is a credibility
  // *bonus* for objective analysis and a direct counter-argument for lived
  // experience. Saying which one this is, is the whole point of disclosing.
  const basis =
    mode === 'database'
      ? '文章的內容來自公開資料的整理與推算，不包含任何親身經歷的主張。'
      : '文章不包含任何親身經歷的主張——每一個結論都應該可以由文中列出的來源自行驗算。'

  return {
    kind: 'ai_persona',
    authorName: name,
    credibilityMode: mode,
    text: `${name} 是一個 AI 生成的角色，不是真實存在的人。${basis}`,
  }
}

/* --------------------------------------------------------------- writing */

export function createArticle(input, actor = 'system') {
  const productId = assertId(input.productId, 'product', 'article.productId')
  const product = getProduct(productId)
  if (!product) throw new Error(`no such product: ${productId}`)

  const title = String(input.title ?? '').trim()
  if (!title) throw new Error('article.title is required')
  const body = String(input.body ?? '').trim()
  if (!body) throw new Error('article.body is required')

  const article = db.insert('articles', {
    id: newId('article'),
    productId,
    personaId: input.personaId ?? null,
    slug: uniqueSlug(title),
    title,
    summary: String(input.summary ?? '').trim() || null,
    body,
    topics: Array.isArray(input.topics) ? input.topics.filter(Boolean).map(String) : [],
    // Provenance. An archive whose pieces cannot be traced back to the event
    // that prompted them is just a blog, and loses the one thing that makes
    // this system's output checkable.
    sourceAssetId: input.sourceAssetId ?? null,
    sourceSignalId: input.sourceSignalId ?? null,
    sourceUrl: input.sourceUrl ?? null,
    // Filled at publish time, never by the caller.
    status: 'draft',
    disclosure: null,
    trackingLinkId: null,
    publishedAt: null,
    views: 0,
    lastViewedAt: null,
    createdBy: actor,
  })

  audit.record({
    actorType: actor === 'system' ? 'system' : 'human',
    actorId: actor,
    action: 'article.created',
    entityType: 'article',
    entityId: article.id,
    reason: `建立檔案庫文章草稿「${title}」。`,
  })

  return article
}

export function updateArticle(id, patch, actor = 'system') {
  const current = requireArticle(id)
  const next = { ...patch }
  // A published URL is a promise. Changing the title does not silently move
  // the page out from under anyone who linked to it.
  if (next.title && current.status !== 'published') next.slug = uniqueSlug(next.title, id)
  delete next.status
  delete next.disclosure
  delete next.views
  delete next.publishedAt
  return db.update('articles', id, { ...next, updatedBy: actor })
}

/* ------------------------------------------------------------ publishing */

/**
 * The gate. Returns `{ ok, reasons }` without mutating, so the UI can show
 * why a piece is not publishable before anyone clicks the button.
 */
export function publishReadiness(id) {
  const article = requireArticle(id)
  const reasons = []

  if (!article.personaId) reasons.push('沒有指定作者人設——讀者需要知道是誰寫的，而且揭露文字是從人設推出來的。')
  if (!article.summary) reasons.push('沒有摘要——索引頁靠摘要讓人決定要不要點進來。')
  if (!article.topics.length) reasons.push('沒有分類——分類是讀者回頭找舊文章的唯一方法，也正是自建檔案庫的理由。')

  const gate = redlineGate({ scope: 'script', text: `${article.title}\n\n${article.body}` })
  if (gate.veto) {
    reasons.push(`紅線檢查擋下：${gate.blocks.map((b) => b.title ?? b.id).join('、')}`)
  }
  if (gate.undecided) {
    reasons.push(
      `紅線第一層命中 ${gate.lintHits.length} 條，需要人工判定後才能發布：${gate.lintHits.map((h) => h.id).join('、')}。` +
        '（關鍵字比對只是候選，不是判決——但沒判定完就不能當作通過。）',
    )
  }

  return { ok: reasons.length === 0, reasons, gate }
}

export function publishArticle(id, { actor = 'system', force = false, forceReason = null } = {}) {
  const article = requireArticle(id)
  const readiness = publishReadiness(id)

  if (!readiness.ok && !force) {
    const err = new Error(`這篇還不能發布：\n- ${readiness.reasons.join('\n- ')}`)
    err.status = 409
    err.reasons = readiness.reasons
    throw err
  }
  // A human override is allowed but is never invisible: it goes to the audit
  // log as a human decision, separate from anything the system decided.
  if (!readiness.ok && force) {
    if (!forceReason) {
      const err = new Error('強制發布必須寫理由——沒有理由的覆寫，三個月後沒有人知道當時在想什麼。')
      err.status = 400
      throw err
    }
    audit.record({
      actorType: 'human',
      actorId: actor,
      action: 'article.publish_forced',
      entityType: 'article',
      entityId: id,
      reason: `略過 ${readiness.reasons.length} 項未通過的檢查發布。理由：${forceReason}`,
      detail: { reasons: readiness.reasons },
    })
  }

  const disclosure = disclosureFor(article.personaId, article.productId)

  // One tracking link per article, minted once at first publish.
  //
  // This is the single place in the whole funnel where attribution is not a
  // guess. Reply → profile click is invisible to both platforms' APIs, so it
  // can only ever be `modeled`; a click from a page we serve to a URL we mint
  // is `direct`. Keeping the link per-article (not per-account) is what buys
  // that precision back, and it is only possible because this page is ours.
  let trackingLinkId = article.trackingLinkId ?? null
  const product = getProduct(article.productId)
  if (!trackingLinkId && product?.primaryDomain) {
    try {
      trackingLinkId = createTrackingLink({
        productId: article.productId,
        articleId: id,
        destinationUrl: product.primaryDomain,
        medium: 'archive',
        platform: 'owned_site',
      }).id
    } catch (e) {
      // A bad primaryDomain must not block publishing an article. The page
      // then renders without a product link, which is the correct fallback:
      // an archive with no product link is still worth reading.
      audit.record({
        actorType: 'system', actorId: 'archive', action: 'article.tracking_link_failed',
        entityType: 'article', entityId: id,
        reason: `無法建立追蹤連結：${e.message}。文章照常發布，但不會顯示產品連結。`,
      })
    }
  }

  const published = db.update('articles', id, {
    status: 'published',
    disclosure,
    trackingLinkId,
    publishedAt: new Date().toISOString(),
    updatedBy: actor,
  })

  audit.record({
    actorType: actor === 'system' ? 'system' : 'human',
    actorId: actor,
    action: 'article.published',
    entityType: 'article',
    entityId: id,
    reason: `發布到公開檔案庫：/notes/${published.slug}`,
  })

  emit('article.published', {
    productId: article.productId,
    personaId: article.personaId,
    source: 'archive',
    properties: { articleId: id, slug: published.slug, disclosureKind: disclosure.kind },
  })

  return published
}

export function retireArticle(id, { actor = 'system', reason = null } = {}) {
  requireArticle(id)
  const row = db.update('articles', id, { status: 'retired', updatedBy: actor })
  audit.record({
    actorType: actor === 'system' ? 'system' : 'human',
    actorId: actor,
    action: 'article.retired',
    entityType: 'article',
    entityId: id,
    reason: reason ?? '從公開檔案庫下架。',
  })
  return row
}

/* ----------------------------------------------------------------- reads */

export const getArticle = (id) => db.get('articles', id)
export const listArticles = (filter = {}) => db.list('articles', filter)

function requireArticle(id) {
  const row = db.get('articles', assertId(id, 'article', 'articleId'))
  if (!row) throw new Error(`no such article: ${id}`)
  return row
}

/**
 * The ONLY read path the public route may use. Everything else in this module
 * can return drafts; this one cannot, by construction rather than by the
 * caller remembering to filter.
 */
export function listPublic({ productId = null, topic = null } = {}) {
  return db
    .list('articles', {})
    .filter((a) => a.status === 'published')
    .filter((a) => (productId ? a.productId === productId : true))
    .filter((a) => (topic ? a.topics.includes(topic) : true))
    .sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')))
}

export function getPublicBySlug(slug) {
  const row = db.find('articles', (a) => a.slug === String(slug) && a.status === 'published')
  return row ?? null
}

/** Topic → count, for the index page's navigation. Published rows only. */
export function publicTopics(productId = null) {
  const counts = new Map()
  for (const a of listPublic({ productId })) {
    for (const t of a.topics) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))
}

/* -------------------------------------------------------------- measuring */

/**
 * Raw page loads. Not unique visitors, not sessions, not humans — this counts
 * requests that rendered the page, bots included. It is labelled that way
 * everywhere it is shown, because a number called "readers" that is actually
 * "requests" is worse than no number.
 *
 * Cost note: the store rewrites the whole collection file per call. That is
 * fine at the traffic a new account gets and would not be at real traffic; the
 * fix then is a counter that flushes on an interval, not a different store.
 */
export function recordView(slug) {
  const row = getPublicBySlug(slug)
  if (!row) return null
  return db.update('articles', row.id, {
    views: (row.views ?? 0) + 1,
    lastViewedAt: new Date().toISOString(),
  })
}

/* ------------------------------------------------- social post → article */

/**
 * Turn a generated social post into an article draft.
 *
 * These are genuinely different shapes and the conversion is not cosmetic. A
 * post is one block of text with no title, written to be read once while
 * scrolling. An article needs a title and a topic because its whole job is to
 * be *found again* months later. So this seeds the fields it can and leaves
 * the two it cannot invent — `title` and `topics` — for a human, rather than
 * deriving a title from the first line and pretending that is editing.
 */
export function draftFromAsset(assetId, { title = null, topics = [], summary = null, actor = 'system' } = {}) {
  const asset = getAsset(assertId(assetId, 'asset', 'assetId'))
  if (!asset) throw new Error(`no such asset: ${assetId}`)
  if (!asset.text) throw new Error(`asset ${assetId} has no text to turn into an article`)

  const arm = db.get('arms', asset.armId)
  const experiment = arm ? db.get('experiments', arm.experimentId) : null
  const opportunity = experiment ? db.get('opportunities', experiment.opportunityId) : null
  const signal = opportunity ? db.get('signals', opportunity.signalId) : null

  return createArticle(
    {
      productId: asset.productId,
      personaId: asset.personaId ?? arm?.personaId ?? null,
      title: title ?? asset.text.split('\n')[0].slice(0, 60),
      summary,
      body: asset.text,
      topics,
      sourceAssetId: asset.id,
      sourceSignalId: signal?.id ?? null,
      sourceUrl: signal?.url ?? null,
    },
    actor,
  )
}
