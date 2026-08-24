/**
 * docs/14 §1.1.1 — the single implementation of "how much history do we have".
 *
 * This file exists because the same arithmetic was being maintained in two
 * places: once in `topics/index.js` (correctly, in code) and once in prose in
 * the spec (incorrectly). The spec claimed "twice a week × 3 weeks = 6
 * snapshots = 21 days = 3 whole weekly cycles". It is not:
 *
 *     Mon W1  day  0        Thu W2  day 10
 *     Thu W1  day  3        Mon W3  day 14
 *     Mon W2  day  7        Thu W3  day 17  ← the 6th, floor(17/7) = 2
 *                           Mon W4  day 21  ← the 7th, 3 cycles
 *
 * N scans span N−1 intervals, not N. Both endpoints are scan days.
 *
 * So the rule is: **never count snapshots, always measure the span**, and do it
 * in exactly one place. Track A (hashtag co-occurrence history) and Track B
 * (news coverage history) both call in here rather than each carrying a copy.
 */

const DAY_MS = 86_400_000

/**
 * Whole weekly cycles covered by a set of timestamped snapshots.
 *
 * Whole cycles rather than elapsed days is Gemini's finding from the spec
 * review: social traffic has a strong weekday/weekend rhythm, so a 7-day
 * baseline reads every ordinary weekend peak as a burst.
 *
 * @param {Array<{capturedAt?: string}>|Array<string>} snapshots
 * @returns {{count:number, firstCapturedAt:string|null, lastCapturedAt:string|null, spanDays:number, weeklyCycles:number}}
 */
export function measureSpan(snapshots = []) {
  const times = snapshots
    .map((s) => Date.parse(typeof s === 'string' ? s : s?.capturedAt))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)

  if (times.length < 2) {
    return {
      count: times.length,
      firstCapturedAt: times.length ? new Date(times[0]).toISOString() : null,
      lastCapturedAt: times.length ? new Date(times[0]).toISOString() : null,
      spanDays: 0,
      weeklyCycles: 0,
    }
  }

  const spanDays = (times.at(-1) - times[0]) / DAY_MS
  return {
    count: times.length,
    firstCapturedAt: new Date(times[0]).toISOString(),
    lastCapturedAt: new Date(times.at(-1)).toISOString(),
    spanDays: Math.round(spanDays * 10) / 10,
    weeklyCycles: Math.floor(spanDays / 7),
  }
}

/**
 * Has this series accumulated enough history to be compared against itself?
 *
 * Returns the measurement alongside the verdict so callers render the numbers
 * rather than recomputing them — docs/14 §10.1: the UI must not derive
 * `weeklyCycles` on its own, because that is precisely where the "6th scan"
 * error was introduced.
 *
 * `approved` is deliberately a separate argument, not read from config in here:
 * the weekly-cycle threshold is shared between the two tracks, but the human
 * sign-off is NOT (docs/14 §4.3). Approving "hashtag co-occurrence history may
 * leave the sandbox" is not approving "news coverage baselines are reliable".
 */
export function baselineStatus(snapshots, { requiredWeeklyCycles = 3, approved = false, label = '這個數列' } = {}) {
  const span = measureSpan(snapshots)

  if (span.count < 2) {
    return { ...span, requiredWeeklyCycles, ready: false, approved, reason: `${label}還沒有可以互相比較的歷史快照。` }
  }

  if (span.weeklyCycles < requiredWeeklyCycles) {
    return {
      ...span,
      requiredWeeklyCycles,
      ready: false,
      approved,
      reason: `快照只涵蓋 ${Math.round(span.spanDays)} 天（${span.weeklyCycles} 個完整週週期）。社群與媒體流量都有很強的平日／週末週期，週期數不足時，週末的正常高峰會被誤判成突發——需要 ${requiredWeeklyCycles} 個完整週週期。`,
    }
  }

  if (!approved) {
    return {
      ...span,
      requiredWeeklyCycles,
      ready: false,
      approved,
      reason: `快照已涵蓋 ${span.weeklyCycles} 個完整週週期，達到門檻——但出實驗區需要人工批准。`,
    }
  }

  return {
    ...span,
    requiredWeeklyCycles,
    ready: true,
    approved,
    reason: `已有 ${span.weeklyCycles} 個完整週週期可比較，且經人工批准。`,
  }
}
