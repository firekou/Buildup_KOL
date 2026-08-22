import fs from 'node:fs'
import path from 'node:path'
import { KOLS_DIR } from '../../config.js'
import { redlineGate } from '../redlines.js'
import { containsKeyword } from '../text.js'

/**
 * docs/11 §2.1 — validation, then gates, then a score. In that order.
 *
 * What changed and why it matters: v1 computed
 *
 *     score = 0.35·fit + 0.30·pillar + 0.20·heat + 0.15·region
 *
 * which is a linear compensatory model. Under it, a mountain guide talking
 * about foundation makeup passes as long as the makeup is trending hard enough.
 * Mandler (1982) and Zuckerman (1999) are both threshold claims, not weight
 * claims — congruence that fails is not congruence that scores low.
 *
 * So: gates cannot be bought. Nothing here is a weighted term.
 */

const CONFIG_PATH = path.join(KOLS_DIR, 'scoring-config.json')

let configCache = null
export function getConfig({ refresh = false } = {}) {
  if (!configCache || refresh) configCache = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  return configCache
}

/* ------------------------------------------------------------ 階段 0 · VALIDATION */

/**
 * Not gates — form validation. Gemini's review: mixing these into the gate
 * engine muddles responsibilities; these should stop the request before any
 * scoring is attempted, and send the user back to fill something in.
 */
export function validate(kol, topic) {
  const problems = []

  for (const issue of kol.axisIssues ?? []) {
    problems.push({ code: 'V1', field: `axes.${issue.axis}`, message: issue.reason, action: 'needs_input' })
  }

  if (!kol.affinity?.credibility_mode) {
    problems.push({
      code: 'V2',
      field: 'credibility_mode',
      message: '沒有宣告可信度型態（具身經驗型 / 資料庫型）。這是判斷「這個題目能不能碰」的前提，不能省略。',
      action: 'needs_input',
    })
  }

  if (!(kol.profile?.content?.pillars ?? []).length) {
    problems.push({ code: 'V3', field: 'content.pillars', message: '沒有任何內容支柱', action: 'needs_binding' })
  }

  return { passed: problems.length === 0, problems }
}

/* ------------------------------------------------------------ 階段 1 · GATES */

/**
 * G2 — credibility-mode match.
 *
 * This was a scored dimension in the first draft of the rewrite. Gemini caught
 * that a categorical variable does not belong inside an arithmetic mean with
 * continuous ones. The deeper reason is simpler: a mismatch is not a low
 * degree of fit, it is a fact that makes the piece undoable.
 */
const EMBODIED_DEMAND = {
  zh: ['親身', '亲身', '實地', '实地', '現場', '现场', '體驗', '体验', '開箱', '开箱', '實測', '实测', '第一手', '親眼', '亲眼', '走訪', '走访', '試吃', '试吃', '挑戰', '挑战'],
  en: ['first-hand', 'firsthand', 'hands-on', 'i tried', 'field test'],
}

export function credibilityModeGate(kol, topic) {
  const mode = kol.affinity?.credibility_mode ?? null
  const hay = [topic.tag, topic.title, topic.domain, ...(topic.keywords ?? []), ...(topic.samples ?? [])]
    .filter(Boolean)
    .join(' ')

  const demandHits = [...EMBODIED_DEMAND.zh, ...EMBODIED_DEMAND.en].filter((k) => containsKeyword(hay, k))
  const requiresEmbodiment = demandHits.length > 0

  // A database-type persona cannot make first-hand claims (Sundar 2008 — the
  // machine heuristic is direct counter-evidence for "I was there").
  const veto = requiresEmbodiment && mode === 'database'

  // The other direction is not a veto but it is not a pass either. EVERY
  // persona here is AI-generated, so an `embodied` declaration is a standing
  // claim the account cannot actually back. That configuration is the risk the
  // literature identifies, not an exemption from it — so it needs a human to
  // sign off per topic rather than sailing through silently.
  const embodiedExposure = requiresEmbodiment && (mode === 'embodied' || mode === 'hybrid')

  return {
    key: 'G2',
    label: '可信度型態',
    passed: !veto,
    veto,
    mode,
    requiresEmbodiment,
    matched: demandHits,
    /** Keyword detection, so it carries the same caveat as the redline lint layer. */
    detection: 'lint',
    undecided: embodiedExposure,
    reason: veto
      ? `這個題目需要第一人稱親身經驗（命中：${demandHits.join('／')}），但這位 KOL 是資料庫型——她的可信度來自整理資料，不是來自到過現場。改寫成可查證的角度，或換一位具身型人設。`
      : embodiedExposure
        ? `這個題目需要第一人稱親身經驗（命中：${demandHits.join('／')}），而這位 KOL 宣告為${mode === 'embodied' ? '具身經驗型' : '混合型'}。但她是 AI 生成的角色——這類主張無法查證，被追問一次就會傷到整個帳號的可信度。要做的話，請逐句確認哪些是可查證的引用、哪些是無法查證的現場敘述。`
        : null,
  }
}

/**
 * G3 — the persona-fit floor, in three bands rather than two.
 *
 * The two-band version (pass / veto) had a fatal property that Gemini flagged
 * as the single most dangerous thing in the spec: vetoed pairs are never
 * produced, so they never generate outcome data, so the floor can never move
 * off wherever it was first guessed. That is survivorship bias, and it is the
 * same mistake this project criticised elsewhere (`match.score < 50 →
 * reassign` makes the inverted-U unidentifiable).
 *
 * The middle band therefore ships. It is allowed to be produced and published,
 * flagged, precisely so the line can be tested.
 */
export function fitGate(fitScore) {
  const cfg = getConfig()
  const floor = cfg.floor.value
  const width = cfg.experimentBandWidth.value

  if (!Number.isFinite(fitScore)) {
    return { key: 'G3', label: '人設契合', passed: false, veto: false, band: 'unknown', reason: 'fit 無法計算' }
  }

  if (fitScore < floor - width) {
    return {
      key: 'G3',
      label: '人設契合',
      passed: false,
      veto: true,
      band: 'veto',
      fit: fitScore,
      floor,
      reason: `人設契合 ${fitScore} 低於底線 ${floor} 超過 ${width} 分。這個落差不是靠熱度或其他維度可以補的——觀眾沒辦法理解這個人為什麼在講這件事。`,
      logVeto: true,
    }
  }

  if (fitScore <= floor + width) {
    return {
      key: 'G3',
      label: '人設契合',
      passed: true,
      veto: false,
      band: 'experiment',
      fit: fitScore,
      floor,
      experimentBand: true,
      reason: `人設契合 ${fitScore} 落在我們自己畫的底線（${floor}）附近。我們讓它上線，是為了知道這條線畫得對不對——文獻只說「有一條線」，沒說在哪裡。`,
      mustFlag: true,
    }
  }

  return { key: 'G3', label: '人設契合', passed: true, veto: false, band: 'pass', fit: fitScore, floor }
}

/** G1 — Zone C block-level redlines. Delegates to the shared rule set. */
export function redlineGateFor(kol, topic) {
  const text = [topic.tag, topic.title, ...(topic.keywords ?? []), ...(topic.samples ?? []), topic.angle]
    .filter(Boolean)
    .join(' ')
  return redlineGate({ scope: 'plan', text, persona: kol.affinity, profile: kol.profile })
}

/* ------------------------------------------------------------ 分帶 */

/** docs/11 §2.5 — a band, not 71.2. Precision the data cannot support reads as prediction. */
export function toBand(score, { experimentBand = false } = {}) {
  if (experimentBand) return { key: 'experiment', label: '實驗', hint: '落在底線附近，刻意讓它上線以檢驗底線。' }
  if (!Number.isFinite(score)) return { key: 'none', label: '—', hint: 'gate 未通過，沒有計算。' }
  const { high, mid } = getConfig().bands
  if (score >= high) return { key: 'high', label: '高', hint: '三維都在中上，沒有明顯短板。' }
  if (score >= mid) return { key: 'mid', label: '中', hint: '有短板，但沒有低於地板。' }
  return { key: 'low', label: '低', hint: '勉強過 gate。' }
}
