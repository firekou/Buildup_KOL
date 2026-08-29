import { PRODUCT_ROLES } from './products.js'

/**
 * 「這則事件接不接得上這個產品，怎麼接」
 *
 * This is the module that turns a wall of scanned events into a short list an
 * operator can act on. It answers one question per signal — can this product
 * carry this topic, and through which of its own declared facts — and then
 * drafts the three judgement fields so the operator edits text instead of
 * facing three blank boxes.
 *
 * What it must not do: invent evidence. It only ever recombines what the
 * operator already declared about the product (differentiators, objections,
 * audience) with what the signal actually says. Every draft is marked as a
 * draft and every proposal names the product field it came from, so a wrong
 * suggestion is visibly wrong rather than quietly authoritative.
 */

/**
 * Terms so generic that matching on them tells you nothing. Without this,
 * every product whose copy mentions 「使用」 or 「服務」 matches every event.
 */
const GENERIC = new Set([
  '使用', '服務', '提供', '可以', '需要', '通常', '一般', '這個', '那個', '我們', '他們', '自己',
  '問題', '功能', '方式', '情況', '時候', '東西', '事情', '結果', '影響', '能力', '技術', '平台',
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'more', 'than', 'they', 'you',
])

const STOP = new Set([
  '的', '了', '是', '在', '和', '與', '及', '對', '從', '把', '被', '就', '都', '也', '而', '但',
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'is', 'are', 'with', 'this', 'that',
])

export const tokenise = (text) =>
  String(text ?? '')
    .toLowerCase()
    .split(/[\s,、，。；;：:/|\\\-—()（）「」『』【】\[\]#！!？?~"'’]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP.has(t) && !GENERIC.has(t))

const hasCjk = (t) => /[\u3400-\u9fff\uf900-\ufaff]/.test(t)

/**
 * Term overlap, with the two scripts handled differently because they have to
 * be.
 *
 * CJK has no word delimiters, so a substring test is the only option — but a
 * two-character run is common enough to hit by chance, so CJK terms must be
 * three characters or more to count.
 *
 * Latin gets a word-boundary test. Substring matching here is what made "ai"
 * match inside "taiwan" and reported a Taipei travel clip as relevant to an
 * AI API product — a false positive that is worse than no matching at all,
 * because it sends the operator to write copy about a topic the product has
 * nothing to do with.
 */
function overlap(aTokens, text) {
  const hay = String(text ?? '').toLowerCase()
  return aTokens.filter((t) => {
    if (hasCjk(t)) return t.length >= 3 && hay.includes(t)
    if (t.length < 3) return false
    return new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(hay)
  })
}

const FAMILY_LABEL = {
  objection_reversal: '已知反對意見',
  differentiator_demo: '差異點',
  audience_situation: '受眾情境',
  evidence_led: '可引用的證據',
}

/**
 * Score a signal against a product's declared angle families.
 *
 * `connects` is a gate, not a rating: either at least one product fact shares
 * real vocabulary with the event, or it does not. There is no 0–100 here —
 * the same reason the rest of the system has none.
 */
export function relevanceOf(signal, product) {
  const analysis = product?.analysis ?? null
  const haystack = `${signal.title ?? ''} ${signal.summary ?? ''}`

  const matches = (analysis?.angleFamilies ?? [])
    .map((a) => {
      const matched = overlap(tokenise(a.seed), haystack)
      return { ...a, matched }
    })
    .filter((a) => a.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length)

  const best = matches[0] ?? null

  return {
    connects: Boolean(best),
    best,
    matches: matches.slice(0, 4),
    // Said in one line, in the operator's terms.
    verdict: best
      ? `可以接：這則提到「${best.matched.slice(0, 3).join('、')}」，正好對上你登記的${FAMILY_LABEL[best.family] ?? best.family}。`
      : '接不上：這則事件跟你登記的差異點、反對意見與受眾情境沒有共同的字。硬接就是蹭熱度，會傷品牌。',
    familyLabel: best ? (FAMILY_LABEL[best.family] ?? best.family) : null,
  }
}

/**
 * Draft the three fields the experiment contract requires.
 *
 * Written so the operator's job is editing, not composing. Each draft says
 * where it came from; `needsEdit` marks the ones that are structurally
 * derived and almost certainly want a human sentence on top.
 */
export function draftFields({ signal, product, relevance, freshness }) {
  const analysis = product?.analysis ?? null
  const best = relevance?.best ?? null
  const objections = (product.knownObjections ?? [])
  const differentiators = (product.differentiators ?? [])

  // Headlines arrive with the outlet appended ("… - 動區動趨", "…| 知新聞").
  // That belongs to the source, not to the topic being tested.
  const topic = String(signal?.title ?? '')
    .replace(/\s*[|｜]\s*[^|｜]{1,40}$/, '')
    .replace(/\s*[-–—]\s*[^-–—]{1,30}$/, '')
    .trim()

  const whyNow = signal
    ? `${freshness?.label ?? ''}${signal.evidenceRefs?.length > 1 ? `，已有 ${signal.evidenceRefs.length} 個來源提及` : ''}。${
        freshness?.key === 'breaking' || freshness?.key === 'fresh'
          ? '討論還在擴散，此刻進場還有增量。'
          : '熱度已過高峰，除非有新角度，否則不要宣稱時效性。'
      }`
    : '（人工建立，沒有對應事件）這一欄要說的是受眾此刻的處境，不是我們的行銷排程。'

  // The tension is the one field a machine genuinely cannot settle, so what is
  // proposed here is a *shape* built from the product's own two sides — the
  // objection people raise, and the differentiator that answers it. The
  // operator supplies the actual argument.
  const objection = best?.family === 'objection_reversal' ? best.seed : objections[0]
  const differentiator = best?.family === 'differentiator_demo' ? best.seed : differentiators[0]
  const tension = objection && differentiator
    ? `一邊說：「${objection}」；另一邊說：「${differentiator}」。這一輪要測的就是哪一邊的說法先被接受。`
    : '這題的兩邊各是誰、各主張什麼？沒有真正的對立就沒有討論入口。'

  const productRelevance = best
    ? `這則事件提到「${best.matched.slice(0, 3).join('、')}」，正好對上產品登記的${FAMILY_LABEL[best.family]}：「${best.seed}」。${best.hint}`
    : '產品憑什麼接住這題？指出是價值主張、差異點、已知反對意見還是受眾情境。'

  /** Two hooks that differ only in entry point — ready to become arm A / arm B. */
  const hooks = []
  if (objection) hooks.push(`很多人說「${trim(objection, 28)}」——我把帳算給你看。`)
  if (differentiator) hooks.push(`${trim(differentiator, 30)}，這件事實際上長什麼樣子。`)
  if (topic) hooks.push(`${trim(topic, 24)}，跟你每個月的 AI 帳單有什麼關係。`)

  return {
    topic,
    whyNow,
    tension,
    productRelevance,
    relevanceAnchor: best ? anchorFor(best.from) : 'none',
    hooks: hooks.slice(0, 3),
    needsEdit: {
      whyNow: !signal,
      tension: !(objection && differentiator),
      productRelevance: !best,
    },
    // The suggested product role follows from which side the angle came from.
    suggestedProductRole: best?.family === 'objection_reversal'
      ? 'answer_to_debate'
      : best?.family === 'differentiator_demo'
        ? 'utility'
        : (analysis?.productRoles ?? []).find((r) => r.plausible)?.role ?? 'next_action',
    productRoleLabel: (role) => PRODUCT_ROLES[role]?.label ?? role,
  }
}

const trim = (s, n) => (String(s).length > n ? `${String(s).slice(0, n)}…` : String(s))

const anchorFor = (from) =>
  ({
    knownObjections: 'known_objection',
    differentiators: 'differentiator',
    targetAudience: 'target_audience',
    proofPoints: 'proof_point',
  })[from] ?? 'none'
