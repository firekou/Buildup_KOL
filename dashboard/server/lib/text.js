import * as OpenCCModule from 'opencc-js'

const OpenCC = OpenCCModule.default ?? OpenCCModule

/**
 * Text matching for a corpus that mixes Traditional Chinese (pillar names,
 * character bibles), Simplified Chinese (post copy for the SG/MY/CN personas)
 * and English (profile descriptions, global tags).
 *
 * Two problems have to be solved before any overlap score means anything:
 *   1. 概率 vs 機率 — the same concept in two scripts. Everything is folded to
 *      Simplified before comparison.
 *   2. CJK has no word boundaries. Whole-phrase substring matching is too
 *      strict; single-character matching is far too loose. Character bigrams
 *      are the standard middle ground, so that is what is compared.
 */
const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' })

const EN_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'not', 'but', 'his', 'her', 'she', 'they',
  'you', 'are', 'was', 'were', 'has', 'have', 'had', 'one', 'out', 'its', 'it', 'as', 'at', 'on', 'in',
  'of', 'to', 'is', 'by', 'or', 'an', 'a', 'be', 'him', 'their', 'them', 'than', 'then', 'what', 'why',
  'how', 'when', 'who', 'about', 'more', 'most', 'each', 'every', 'never', 'always', 'like', 'just',
])

const CJK = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\u3040-\\u30ff\\uf900-\\ufaff'

export function normalize(text) {
  return toSimplified(String(text ?? '').toLowerCase())
}

/**
 * Comparable feature set for a piece of text: latin words (3+ chars, minus
 * stopwords) plus CJK character bigrams.
 */
export function grams(text) {
  const lower = normalize(text)
  const set = new Set()

  for (const word of lower.match(/[a-z][a-z0-9]{2,}/g) ?? []) {
    if (!EN_STOPWORDS.has(word)) set.add(word)
  }
  for (const run of lower.match(new RegExp(`[${CJK}]{2,}`, 'g')) ?? []) {
    for (let i = 0; i + 2 <= run.length; i += 1) set.add(run.slice(i, i + 2))
  }
  return set
}

/** Share of the needle's features that appear in the haystack. 0–1. */
export function coverage(needleText, haystackText) {
  const needle = grams(needleText)
  if (!needle.size) return 0
  const hay = grams(haystackText)
  let hits = 0
  for (const g of needle) if (hay.has(g)) hits += 1
  return hits / needle.size
}

/** Does the haystack contain this keyword, script-insensitively? */
export function containsKeyword(haystackText, keyword) {
  const k = normalize(keyword).trim()
  if (!k) return false
  const hay = normalize(haystackText)
  // Short latin keywords must match on a word boundary — "ai" should not fire
  // on "daily". CJK has no boundaries, so substring matching is correct there.
  if (/^[a-z0-9]+$/.test(k)) {
    return new RegExp(`(^|[^a-z0-9])${k}([^a-z0-9]|$)`).test(hay)
  }
  return hay.includes(k)
}
