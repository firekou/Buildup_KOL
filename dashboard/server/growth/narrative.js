/**
 * 敘事結構 — the shape of the argument, independent of which product role it
 * carries.
 *
 * `rebuttal` was the only shape the beats could produce, and it is inherently
 * defensive: it takes the objection as given and argues back from inside it.
 * That wins the argument it was handed and teaches the reader nothing, so the
 * best case is a reader who agrees and leaves.
 *
 * `framework` is the shape that earns a follow: take the event, name the thing
 * most people missed, break it into two or three angles the reader can reuse,
 * and leave them with a judgement they can apply to the *next* event. The
 * product appears as one of the angles, not as the conclusion.
 *
 * A shape is a first-class experiment dimension (`narrative` in
 * experiments.js), because "does teaching beat rebutting for us" is exactly
 * the kind of question this system exists to settle with data.
 */
export const NARRATIVE_SHAPES = {
  rebuttal: {
    label: '反駁型',
    says: '接住一個反對意見，從內部回應它。守勢，適合已經有立場衝突的題目。',
    beats: () => [
      '（不要重述新聞標題）把對立的兩邊各講一句，不偏袒',
      '指出唯一能分出勝負的證據在哪',
    ],
  },
  framework: {
    label: '觀念框架型',
    says: '先幫讀者整理這則新聞裡值得知道的東西（列點），再指出背後的判準，收在一個下次也用得上的觀念。產品只在最後出現一次，當作讀者自己驗算的工具。讀者的感受是「我學到了」而不是「他在推銷」。',
    beats: () => [
      '（不要重述新聞標題，開場句已經講過了）直接進入這則新聞裡值得知道的東西，用序號列點，讓人可以直接帶走',
      '指出這些東西背後真正的判準是什麼（多數人只看到表面那一層）',
      '收在一個觀念：下次再遇到同類型的事，可以怎麼判斷',
    ],
  },
  demo: {
    label: '示範型',
    says: '直接把東西做一次給人看。適合差異點用講的講不清楚、但看一眼就懂的題目。',
    beats: () => ['（不要重述新聞標題）示範產品實際被用來解決什麼', '指出沒有它的時候會卡在哪'],
  },
  evidence: {
    label: '攤證據型',
    says: '把可查證的資料攤開，讓讀者自己判斷。適合 database 型人設。',
    beats: () => ['（不要重述新聞標題）把可查證的數據攤開', '說明這份數據怎麼查、怎麼自己驗一次'],
  },
}

export const DEFAULT_NARRATIVE = 'framework'

/** Which shape a role falls back to when the arm does not name one. */
export const ROLE_FALLBACK = {
  utility: 'demo',
  answer_to_debate: 'rebuttal',
  destination: 'demo',
  proof_source: 'evidence',
  challenge: 'demo',
  next_action: 'framework',
}
