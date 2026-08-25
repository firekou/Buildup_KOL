import assert from 'node:assert/strict'
import { describeAges } from './probe-window.js'

/**
 * The probe's conclusions rest entirely on `describeAges`, so it gets tested
 * against hand-built date sets where the right answer is known in advance.
 *
 * Run: node dashboard/server/lib/scan/probe-window.test.mjs
 */

const NOW = Date.UTC(2026, 7, 25)
const ago = (days) => new Date(NOW - days * 86_400_000).toISOString()
const posts = (...days) => days.map((d) => ({ timestamp: ago(d) }))

let passed = 0
const check = (label, fn) => {
  fn()
  passed += 1
  console.log(`  ok    ${label}`)
}

console.log('\nprobe-window · describeAges\n')

check('recent-only slice: newest-first order scores descRatio 1.0', () => {
  // This is the signature the 0-4 probe is looking for. An actor that hands
  // back "the most recent N" produces a monotonically decreasing sequence.
  const r = describeAges(posts(1, 3, 5, 9, 14, 20, 28), { now: NOW })
  assert.equal(r.returnOrderDescendingRatio, 1)
  assert.equal(r.oldestAgeDays, 28)
  assert.equal(r.olderThanWindow, 0)
  assert.equal(r.withinWindow, 7)
})

check('genuine half-year spread: descRatio well below 1, reaches past the window', () => {
  const r = describeAges(posts(200, 10, 150, 45, 3, 175, 90), { now: NOW })
  assert.ok(r.returnOrderDescendingRatio < 0.5, 'shuffled order must not look newest-first')
  assert.equal(r.oldestAgeDays, 200)
  assert.equal(r.olderThanWindow, 1)
  assert.equal(r.withinWindow, 6)
  assert.equal(r.spanDays, 197)
})

check('window boundary counts by the cutoff, not by rounding', () => {
  const r = describeAges(posts(179, 181), { now: NOW })
  assert.equal(r.withinWindow, 1)
  assert.equal(r.olderThanWindow, 1)
})

check('undated posts are counted, never silently dropped', () => {
  // An actor that returns no timestamps cannot support outlier analysis at all,
  // so this has to be visible rather than showing up as an empty result.
  const r = describeAges([{ timestamp: null }, { timestamp: null }, ...posts(5)], { now: NOW })
  assert.equal(r.returned, 3)
  assert.equal(r.dated, 1)
  assert.equal(r.undated, 2)
})

check('all-undated degrades to nulls, not to zeros', () => {
  // Zero would read as "reaches back 0 days", which is a different claim from
  // "we cannot tell". Same distinction the rest of the system keeps.
  const r = describeAges([{ timestamp: null }], { now: NOW })
  assert.equal(r.oldestAt, null)
  assert.equal(r.oldestAgeDays, null)
  assert.equal(r.returnOrderDescendingRatio, null)
})

check('empty result set does not throw', () => {
  const r = describeAges([], { now: NOW })
  assert.equal(r.returned, 0)
  assert.equal(r.spanDays, 0)
  assert.equal(r.oldestAt, null)
})

check('single dated post has no span and no comparable pairs', () => {
  const r = describeAges(posts(12), { now: NOW })
  assert.equal(r.spanDays, 0)
  assert.equal(r.comparablePairs, 0)
  assert.equal(r.returnOrderDescendingRatio, null)
})

check('monthly histogram is sorted and complete', () => {
  const r = describeAges(posts(200, 10, 150, 45, 3, 175, 90), { now: NOW })
  const keys = Object.keys(r.monthlyHistogram)
  assert.deepEqual(keys, [...keys].sort())
  assert.equal(Object.values(r.monthlyHistogram).reduce((a, b) => a + b, 0), 7)
})

console.log(`\n✅ 通過 ${passed} 項\n`)
