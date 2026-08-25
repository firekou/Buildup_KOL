/**
 * Batch 0 · probes 0-1 and 0-2 (docs/15 §2.1).
 *
 *   0-1  Are the Google News RSS per-region parameters usable? How many items
 *        come back? Is there a rate limit?
 *   0-2  What are Yahoo's actual per-region RSS paths?
 *
 * docs/14 §4.1 marked every one of these `unverified` because the dev sandbox's
 * proxy denies CONNECT to news.google.com and tw.news.yahoo.com. This runs
 * where the network is.
 *
 * The parser is deliberately a regex over the raw XML rather than a dependency:
 * we are measuring whether a feed exists and what shape it has, not building
 * the production reader. If a feed turns out to need real XML parsing, that is
 * itself a finding worth recording.
 */

/** Candidate feeds, straight from `kols/persona-directions.json` regionSources. */
export const NEWS_FEEDS = {
  TW: [
    { source: 'google', url: 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant' },
    { source: 'google-search', url: 'https://news.google.com/rss/search?q=%E5%81%A5%E5%BA%B7&hl=zh-TW&gl=TW&ceid=TW:zh-Hant' },
    { source: 'yahoo', url: 'https://tw.news.yahoo.com/rss/' },
    { source: 'yahoo-health', url: 'https://tw.news.yahoo.com/rss/health' },
  ],
  HK: [
    { source: 'google', url: 'https://news.google.com/rss?hl=zh-HK&gl=HK&ceid=HK:zh-Hant' },
    { source: 'yahoo', url: 'https://hk.news.yahoo.com/rss/' },
  ],
  SG: [
    { source: 'google', url: 'https://news.google.com/rss?hl=en-SG&gl=SG&ceid=SG:en' },
    { source: 'yahoo', url: 'https://sg.news.yahoo.com/rss/' },
  ],
  JP: [
    { source: 'google', url: 'https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja' },
    { source: 'yahoo', url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml' },
  ],
  KR: [{ source: 'google', url: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko' }],
  US: [
    { source: 'google', url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en' },
    { source: 'yahoo', url: 'https://www.yahoo.com/news/rss' },
  ],
  MY: [{ source: 'google', url: 'https://news.google.com/rss?hl=en-MY&gl=MY&ceid=MY:en' }],
}

const grab = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))].map((m) => m[1])

const stripCdata = (s) => s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim()

/** Host of a link, lowercased and without `www.` — the unit `outletCount` must count. */
function outletOf(link) {
  try {
    return new URL(stripCdata(link)).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export async function probeFeed({ region, source, url, timeoutMs = 30_000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'buildup-kol-scan-probe/1.0 (+batch0)' },
    })
    const body = await res.text()
    const elapsedMs = Date.now() - startedAt

    if (!res.ok) {
      return {
        ok: false, region, source, url, status: res.status, elapsedMs,
        bodySnippet: body.slice(0, 200),
      }
    }

    const items = grab(body, 'item')
    const pubDates = items.flatMap((i) => grab(i, 'pubDate')).map((d) => Date.parse(stripCdata(d))).filter(Number.isFinite)
    const links = items.flatMap((i) => grab(i, 'link').slice(0, 1))
    const outlets = new Set(links.map(outletOf).filter(Boolean))
    // Google wraps the real publisher in <source url="…">; the <link> is a
    // news.google.com redirect, so outletCount off <link> alone would be 1.
    const sourceUrls = [...body.matchAll(/<source[^>]*url="([^"]+)"/gi)].map((m) => m[1])
    const sourceOutlets = new Set(sourceUrls.map(outletOf).filter(Boolean))

    const sorted = [...pubDates].sort((a, b) => a - b)
    const now = Date.now()

    return {
      ok: true, region, source, url, status: res.status, elapsedMs,
      contentType: res.headers.get('content-type'),
      bytes: body.length,
      isXml: /<rss|<feed|<channel/i.test(body.slice(0, 2000)),
      items: items.length,
      dated: pubDates.length,
      oldestAgeDays: sorted.length ? Math.round(((now - sorted[0]) / 86_400_000) * 10) / 10 : null,
      newestAgeDays: sorted.length ? Math.round(((now - sorted.at(-1)) / 86_400_000) * 10) / 10 : null,
      /** docs/14 §4.4-3 — outlets must be counted by domain, not by article. */
      outletCountFromLink: outlets.size,
      outletCountFromSourceTag: sourceOutlets.size,
      sampleOutlets: [...(sourceOutlets.size ? sourceOutlets : outlets)].slice(0, 5),
      sampleTitle: items.length ? stripCdata(grab(items[0], 'title')[0] ?? '').slice(0, 80) : null,
    }
  } catch (err) {
    return {
      ok: false, region, source, url,
      elapsedMs: Date.now() - startedAt,
      error: String(err?.message ?? err).slice(0, 300),
      aborted: controller.signal.aborted,
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 0-1's rate-limit question: hit the same feed N times back to back and see
 * whether the status codes stay 200.
 */
export async function probeRateLimit({ url, times = 5 } = {}) {
  const statuses = []
  for (let i = 0; i < times; i += 1) {
    const r = await probeFeed({ region: 'RATE', source: 'repeat', url, timeoutMs: 20_000 })
    statuses.push(r.status ?? (r.error ? `err:${r.error.slice(0, 40)}` : '?'))
  }
  return { url, times, statuses, allOk: statuses.every((s) => s === 200) }
}
