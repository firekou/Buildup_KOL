import path from 'node:path'
import { REPO_ROOT } from '../config.js'

/**
 * Zone C · docs/11 §5.
 *
 * The rules live in `.claude/skills/kol-redline-check/rules.json` and the
 * checker in that same directory. The backend imports them rather than keeping
 * a second copy, because two copies of a rule set drift — and a redline that
 * drifts is worse than no redline, since it looks enforced.
 *
 * The skill is the primary consumer (most KOL content is written in
 * conversation, not in the web UI); this module is the secondary one.
 */

const SKILL_DIR = path.join(REPO_ROOT, '.claude', 'skills', 'kol-redline-check')

const mod = await import(path.join(SKILL_DIR, 'check.mjs'))

export const RULES = mod.RULES
export const lint = mod.check

/** Rules that can only ever be settled by the semantic layer. */
export const semanticOnlyRules = RULES.rules.filter((r) => r.semantic_prompt)

/**
 * docs/11 §5.4 — the first layer never decides on its own for `lint` rules.
 *
 * Keyword matching has both failure directions, and both were demonstrated in
 * the spec review: it flags "我親身比對了三份報告" (a database-type KOL doing
 * ordinary work) and misses "那晚我手指凍到沒感覺" (an embodiment claim with no
 * keyword in it). So a lint hit is a candidate, not a verdict.
 */
export function checkContent({ scope = 'script', text = '', persona = null, profile = null } = {}) {
  const result = lint({ scope, text, persona, profile })

  // `pendingSemantic` lists every semantic rule in scope, so combining several
  // check results (match + plan text) multiplies the same rule ids. Deduping
  // here keeps "3 things to look at" from rendering as 19.
  const seen = new Set()
  const dedupe = (rows) => rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
  const needsReview = dedupe(result.needsReview)
  const pendingSemantic = dedupe(result.pendingSemantic)

  return {
    ...result,
    needsReview,
    pendingSemantic,
    /**
     * The single field callers should branch on. `passed` only reports the
     * first layer; `resolved` says whether anything is still outstanding.
     */
    resolved: result.complete,
    layer: 'lint',
    guidance:
      result.complete
        ? null
        : '第一層是關鍵字比對，不是判定。needsReview 與 pendingSemantic 的每一條都要由語意層依 semanticPrompt 逐一判斷後才算檢查完成。',
  }
}

/**
 * docs/11 §2.1 G1 — the gate form. Only settled `block` findings gate; anything
 * awaiting the semantic layer is reported as `pending`, never silently passed.
 */
export function redlineGate(input) {
  const r = checkContent(input)

  // Two different things, deliberately not merged:
  //   lintHits  — this content tripped a keyword; specific, actionable
  //   standing  — rules with no reliable keyword, so they need a semantic read
  //               on EVERY piece of content, identical every time
  // Merging them made a plan with one real hit look like it had eleven.
  const lintHits = r.needsReview.filter((x) => x.severity === 'block')
  const standing = r.pendingSemantic.filter((x) => x.severity === 'block')

  return {
    key: 'G1',
    label: '紅線',
    passed: !r.blocked,
    veto: r.blocked,
    blocks: r.blocks,
    warnings: r.warnings,
    lintHits,
    standing,
    /** true when this content's own answer is not yet knowable without the semantic layer. */
    undecided: lintHits.length > 0,
  }
}
