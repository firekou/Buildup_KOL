import express from 'express'
import * as archive from '../growth/archive.js'
import { getPersona } from '../growth/personas.js'
import { getProduct } from '../growth/products.js'
import { db } from '../growth/store.js'

/**
 * The public archive — server-rendered, no client bundle, no API.
 *
 * Rendered on the server rather than in the existing React app for three
 * reasons, in order of how much they matter:
 *
 * 1. The React app is the internal tool. Serving the archive from it would put
 *    the operator console one route away from a public URL. Different audience,
 *    different origin of truth, different failure mode — keep them apart.
 * 2. A page whose entire job is to be *found again* has to be readable by
 *    crawlers and link-preview fetchers, which is the whole point of an
 *    archive over a social feed.
 * 3. It must work with JavaScript off and on a bad connection. This is the
 *    landing point of a bio link, and the reader has spent exactly one click
 *    of curiosity on us.
 *
 * Everything served here goes through `archive.listPublic` / `getPublicBySlug`,
 * which filter to `status === 'published'` by construction. There is no code
 * path in this file that can reach a draft.
 */

const r = express.Router()

/* ------------------------------------------------------------- rendering */

/**
 * Escaped everywhere, without exception. The body is model-generated text on
 * a public page: the one place in this system where an unescaped `<` is a
 * stored-XSS bug rather than a cosmetic one.
 */
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const fmtDate = (iso) => (iso ? String(iso).slice(0, 10) : '')

/**
 * A deliberately small subset: blank-line paragraphs, `## ` headings, and
 * `- ` / `1) ` / `1. ` list items. No link syntax, no raw HTML passthrough —
 * a public page rendering arbitrary model output is not the place to be
 * generous about what counts as markup.
 */
function renderBody(text) {
  const blocks = String(text ?? '').split(/\n{2,}/)
  const out = []

  for (const raw of blocks) {
    const block = raw.trim()
    if (!block) continue

    if (block.startsWith('## ')) {
      out.push(`<h2>${esc(block.slice(3).trim())}</h2>`)
      continue
    }

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    const isList = lines.length > 0 && lines.every((l) => /^([-•]|\d+[).])\s+/.test(l))
    if (isList) {
      const ordered = /^\d/.test(lines[0])
      const items = lines.map((l) => `<li>${esc(l.replace(/^([-•]|\d+[).])\s+/, ''))}</li>`).join('')
      out.push(ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`)
      continue
    }

    // Single newlines inside a paragraph are the author's line breaks — social
    // posts are written that way and collapsing them would change the rhythm.
    out.push(`<p>${lines.map(esc).join('<br>')}</p>`)
  }

  return out.join('\n')
}

const STYLE = `
:root{--bg:#fbfaf8;--fg:#1c1b19;--muted:#6b6862;--rule:#e4e1db;--accent:#2f5d50;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#141513;--fg:#e9e7e2;--muted:#9a968e;--rule:#2c2e2b;--accent:#8fc0ae;--card:#1b1d1a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);
  font:16px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;
  -webkit-text-size-adjust:100%}
.wrap{max-width:680px;margin:0 auto;padding:32px 20px 80px}
a{color:var(--accent)}
header.site{padding-bottom:20px;border-bottom:1px solid var(--rule);margin-bottom:28px}
header.site h1{font-size:19px;margin:0 0 4px;letter-spacing:.01em}
header.site h1 a{color:var(--fg);text-decoration:none}
.role{color:var(--muted);font-size:14px;margin:0}
.disclosure{margin:14px 0 0;padding:10px 12px;border-left:3px solid var(--rule);
  background:var(--card);color:var(--muted);font-size:13px;line-height:1.6;border-radius:0 4px 4px 0}
nav.topics{margin:0 0 28px;font-size:14px;line-height:2}
nav.topics a{display:inline-block;margin-right:14px;text-decoration:none}
nav.topics a.on{font-weight:600;text-decoration:underline}
ul.index{list-style:none;padding:0;margin:0}
ul.index li{padding:18px 0;border-bottom:1px solid var(--rule)}
ul.index h2{font-size:18px;margin:0 0 6px;line-height:1.45}
ul.index h2 a{color:var(--fg);text-decoration:none}
ul.index h2 a:hover{color:var(--accent)}
.meta{color:var(--muted);font-size:13px;margin:0}
.summary{margin:6px 0 0;color:var(--muted);font-size:15px}
article h1{font-size:25px;line-height:1.4;margin:0 0 10px}
article h2{font-size:17px;margin:32px 0 8px}
article p{margin:0 0 18px}
article ol,article ul{margin:0 0 18px;padding-left:22px}
article li{margin:0 0 8px}
.tags{margin:24px 0 0;font-size:13px}
.tags a{margin-right:10px}
.cta{margin:36px 0 0;padding:16px 18px;background:var(--card);border:1px solid var(--rule);border-radius:6px;font-size:15px}
.cta p{margin:0 0 8px}
.cta p:last-child{margin:0}
.source{margin:22px 0 0;font-size:13px;color:var(--muted)}
footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--rule);color:var(--muted);font-size:13px}
.empty{padding:40px 0;color:var(--muted)}
`

function page({ title, description, body, canonical = null }) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ''}
<meta property="og:title" content="${esc(title)}">
${description ? `<meta property="og:description" content="${esc(description)}">` : ''}
<meta property="og:type" content="article">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<style>${STYLE}</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`
}

/* ---------------------------------------------------------------- author */

/**
 * The archive is one author's body of work, so the header is derived from the
 * persona of the most recent published piece rather than configured
 * separately — two places to state who this is would drift.
 */
function authorHeader(articles) {
  const latest = articles.find((a) => a.personaId)
  if (!latest) return { html: '<header class="site"><h1><a href="/notes">筆記</a></h1></header>', persona: null }

  const persona = getPersona(latest.personaId, latest.productId)
  const disclosure = latest.disclosure ?? archive.disclosureFor(latest.personaId, latest.productId)
  const name = persona?.name ?? disclosure.authorName ?? '作者'
  const role = persona?.archetype ?? ''

  return {
    persona,
    html: `<header class="site">
  <h1><a href="/notes">${esc(name)}</a></h1>
  ${role ? `<p class="role">${esc(role)}</p>` : ''}
  <p class="disclosure">${esc(disclosure.text)}</p>
</header>`,
  }
}

function topicNav(productId, active = null) {
  const topics = archive.publicTopics(productId)
  if (!topics.length) return ''
  const all = `<a href="/notes"${active ? '' : ' class="on"'}>全部</a>`
  const links = topics
    .map((t) => {
      const on = active === t.topic ? ' class="on"' : ''
      return `<a href="/notes/topic/${encodeURIComponent(t.topic)}"${on}>${esc(t.topic)} (${t.count})</a>`
    })
    .join('')
  return `<nav class="topics">${all}${links}</nav>`
}

/* ---------------------------------------------------------------- routes */

function renderIndex(res, { topic = null } = {}) {
  const articles = archive.listPublic(topic ? { topic } : {})
  const all = topic ? archive.listPublic() : articles
  const { html: header } = authorHeader(all.length ? all : articles)

  const list = articles.length
    ? `<ul class="index">${articles
        .map(
          (a) => `<li>
  <h2><a href="/notes/${encodeURIComponent(a.slug)}">${esc(a.title)}</a></h2>
  <p class="meta">${esc(fmtDate(a.publishedAt))}${a.topics.length ? ` · ${a.topics.map(esc).join('、')}` : ''}</p>
  ${a.summary ? `<p class="summary">${esc(a.summary)}</p>` : ''}
</li>`,
        )
        .join('')}</ul>`
    : `<p class="empty">還沒有公開的文章。</p>`

  res
    .type('html')
    .set('cache-control', 'public, max-age=300')
    .send(
      page({
        title: topic ? `${topic} — 筆記` : '筆記',
        description: topic ? `關於「${topic}」的整理。` : '把時事裡值得知道的東西整理成可以再用一次的判準。',
        body: `${header}${topicNav(null, topic)}${list}<footer>整理與推算的過程都寫在文章裡，看到錯的地方歡迎指出來。</footer>`,
      }),
    )
}

function notFound(res) {
  res
    .status(404)
    .type('html')
    .send(
      page({
        title: '找不到這一頁 — 筆記',
        body: `<header class="site"><h1><a href="/notes">筆記</a></h1></header>
<p class="empty">這個網址沒有對應的文章。可能是還沒發布，或是連結打錯了。</p>
<footer><a href="/notes">← 看全部文章</a></footer>`,
      }),
    )
}

r.get('/notes', (req, res) => renderIndex(res))

r.get('/notes/topic/:topic', (req, res) => renderIndex(res, { topic: req.params.topic }))

r.get('/notes/:slug', (req, res) => {
  const article = archive.getPublicBySlug(req.params.slug)
  // 404 here rather than next(): falling through reaches the SPA catch-all,
  // which would answer a bad public URL with the internal console's shell.
  if (!article) return notFound(res)

  archive.recordView(article.slug)

  const { html: header } = authorHeader([article])
  const product = getProduct(article.productId)
  const link = article.trackingLinkId ? db.get('trackingLinks', article.trackingLinkId) : null

  // The product appears once, at the end, framed as a way for the reader to
  // check the article's own claim themselves. That framing is not politeness:
  // the person arrived curious about an argument, not ready to buy, and the
  // archive is worth nothing if it reads as a funnel.
  const cta =
    link && product
      ? `<div class="cta">
  <p>想自己驗算上面的算法？</p>
  <p><a href="/api/growth/t/${esc(link.trackingCode)}" rel="nofollow">${esc(product.name)}</a> 可以用同一組 key 把不同模型的帳單拉出來比對。</p>
</div>`
      : ''

  const source = article.sourceUrl
    ? `<p class="source">這篇的起點：<a href="${esc(article.sourceUrl)}" rel="nofollow noopener" target="_blank">原始報導</a></p>`
    : ''

  const tags = article.topics.length
    ? `<p class="tags">${article.topics
        .map((t) => `<a href="/notes/topic/${encodeURIComponent(t)}">${esc(t)}</a>`)
        .join('')}</p>`
    : ''

  res
    .type('html')
    .set('cache-control', 'public, max-age=300')
    .send(
      page({
        title: `${article.title} — 筆記`,
        description: article.summary ?? undefined,
        body: `${header}
<article>
  <h1>${esc(article.title)}</h1>
  <p class="meta">${esc(fmtDate(article.publishedAt))}</p>
  ${renderBody(article.body)}
  ${source}
  ${cta}
  ${tags}
</article>
<footer><a href="/notes">← 回到全部文章</a></footer>`,
      }),
    )
})

export default r
