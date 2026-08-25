import assert from 'node:assert/strict'
import { compareRuns, projectCost } from './probe-actor.js'

/**
 * 0-9's verdict is `compareRuns`' output, so the arithmetic gets checked
 * against sets whose answer is known by hand.
 *
 * Run: node dashboard/server/lib/scan/probe-actor.test.mjs
 */

let passed = 0
const check = (label, fn) => { fn(); passed += 1; console.log(`  ok    ${label}`) }

console.log('\nprobe-actor · compareRuns / projectCost\n')

check('identical runs are jaccard 1.0 and full recall', () => {
  const r = compareRuns(['a', 'b', 'c'], ['c', 'b', 'a'])
  assert.equal(r.jaccard, 1)
  assert.equal(r.recallOfA, 1)
})

check('disjoint runs are jaccard 0 — the signal that week-over-week is broken', () => {
  const r = compareRuns(['a', 'b'], ['c', 'd'])
  assert.equal(r.jaccard, 0)
  assert.equal(r.recallOfA, 0)
})

check('half overlap reports recall separately from jaccard', () => {
  // A={a,b,c,d} B={c,d,e,f}: intersection 2, union 6.
  const r = compareRuns(['a', 'b', 'c', 'd'], ['c', 'd', 'e', 'f'])
  assert.equal(r.overlap, 2)
  assert.equal(r.jaccard, 0.333)
  // Recall of A is the number that answers "can I compare two weeks": half of
  // run A came back. Jaccard alone would understate it when B is much bigger.
  assert.equal(r.recallOfA, 0.5)
})

check('duplicate ids within a run are counted once', () => {
  const r = compareRuns(['a', 'a', 'b'], ['a', 'b'])
  assert.equal(r.sizeA, 2)
  assert.equal(r.jaccard, 1)
})

check('empty runs degrade to null, not to a confident zero', () => {
  const r = compareRuns([], [])
  assert.equal(r.jaccard, null)
  assert.equal(r.recallOfA, null)
})

check('undefined inputs do not throw', () => {
  const r = compareRuns(undefined, undefined)
  assert.equal(r.sizeA, 0)
})

check('cost projection scales linearly and says what it does not measure', () => {
  const p = projectCost({ authorsFetched: 5, totalElapsedMs: 50_000, target: 100 })
  assert.equal(p.perAuthorMs, 10_000)
  assert.equal(p.projectedMinutesFor, 16.7)
  assert.match(p.note, /計費/)
})

check('cost projection on zero authors returns null rather than dividing by zero', () => {
  assert.equal(projectCost({ authorsFetched: 0, totalElapsedMs: 1000 }), null)
})

console.log(`\n✅ 通過 ${passed} 項\n`)
