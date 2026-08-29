import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { DecisionBadge, Caveats, Field, useAsyncAction, ErrorNote, usd, int, rate } from '../components.jsx'

/**
 * 04 Winner 工廠 — DASHBOARD_SPEC.md §6.
 *
 * Queue, lineage tree, clone builder. Every node in the tree shows what
 * changed and how it landed; the clone builder makes the operator pick exactly
 * one mutation dimension, which is what keeps the next generation's result
 * attributable.
 */

const BUCKETS = [
  { key: 'newWinners', label: '新 Winner', tone: 'good', hint: '已判定為 Winner，還沒有任何變體。' },
  { key: 'cloneQueued', label: '變體已排入', tone: 'accent', hint: 'child experiment 已建立，等待生成。' },
  { key: 'childrenCollecting', label: 'Child 收資料中', tone: '', hint: 'child 已發布，等待觀測窗結束。' },
  { key: 'provenFamily', label: '已驗證家族', tone: 'good', hint: 'child 也產生了 Winner，這一支可靠。' },
  { key: 'cloneRunning', label: '待重測或停止', tone: 'warn', hint: '所有 child 都沒贏過 parent。' },
]

export default function WinnerFactory({ meta, productId, refresh }) {
  const [queue, setQueue] = useState(null)
  const [families, setFamilies] = useState(null)
  const [cloning, setCloning] = useState(null)
  const { error, setError } = useAsyncAction()

  const load = () => {
    growth.winners(productId).then(setQueue).catch((e) => setError(e.message))
    growth.lineage(productId).then((d) => setFamilies(d.families)).catch((e) => setError(e.message))
  }
  // `useEffect(() => { load() }, …)` rather than `useEffect(load, …)`:
  // React treats an effect's return value as its cleanup function, so an
  // effect that returns a promise crashes the whole tree on unmount.
  useEffect(() => { load() }, [productId])

  if (!queue || !families) return <Loading />

  const total = BUCKETS.reduce((a, b) => a + (queue[b.key]?.length ?? 0), 0)

  return (
    <div className="stack">
      <ErrorNote error={error} />

      <Card title="Winner queue" note="Winner 不是獎盃而是工作項目——每一列都標了下一步該做什麼。">
        {total === 0 ? (
          <Empty>還沒有任何 Winner。實驗要先通過資料完整度檢查，evaluator 才會產出判定。</Empty>
        ) : (
          <div className="stack">
            {BUCKETS.map((b) => {
              const rows = queue[b.key] ?? []
              if (!rows.length) return null
              return (
                <section key={b.key}>
                  <h4><Badge tone={b.tone}>{b.label}</Badge> <span className="muted small">{b.hint}</span></h4>
                  {rows.map((w) => (
                    <div key={w.armId} className="list-row" style={{ cursor: 'default' }}>
                      <div className="grow">
                        <div className="title">Arm {w.label}｜{w.hook}</div>
                        <div className="sub">
                          {w.personaId}｜{meta.platforms[w.platform]?.label ?? w.platform}
                          {w.relativeLift != null && `｜相對提升 ${rate(w.relativeLift, 1)}`}
                          ｜成本 {usd(w.costUsd)}
                          ｜{w.childCount} 個 child（{w.childWinnerCount} 個也是 Winner）
                        </div>
                        <div className="sub warn-text">{w.nextAction?.says}</div>
                      </div>
                      {w.nextAction?.action === 'clone' && (
                        <button className="primary" onClick={() => setCloning(cloning?.armId === w.armId ? null : w)}>
                          {cloning?.armId === w.armId ? '取消' : '建立變體'}
                        </button>
                      )}
                    </div>
                  ))}
                </section>
              )
            })}
          </div>
        )}

        {queue.fatigued?.length > 0 && (
          <div className="alert warn" style={{ marginTop: 10 }}>
            <strong>疲乏偵測</strong>
            <ul className="ghos-list small">
              {queue.fatigued.map((f) => <li key={f.rootArmId}>{f.says}</li>)}
            </ul>
          </div>
        )}
      </Card>

      {cloning && <CloneBuilder winner={cloning} meta={meta} onDone={() => { setCloning(null); load(); refresh() }} />}

      <Card title="Lineage" note="每個節點顯示改了什麼、結果如何、花了多少。多因子節點會標示，其提升不得宣稱單一因果。">
        {families.length === 0 ? <Empty>還沒有任何家族——Winner 產生 child 之後這裡才會有樹。</Empty> : (
          <div className="stack">
            {families.map((f) => <LineageNode key={f.armId} node={f} meta={meta} />)}
          </div>
        )}
      </Card>
    </div>
  )
}

function LineageNode({ node, meta, depth = 0 }) {
  const [lift, setLift] = useState(null)
  const { run } = useAsyncAction()
  return (
    <div className="ghos-lineage" style={{ marginLeft: depth * 22 }}>
      <div className="row">
        <span className="ghos-gen">G{node.generation}</span>
        <strong>{node.label}</strong>
        <DecisionBadge decision={node.decision} />
        {node.multiFactor && <Badge tone="warn">多因子</Badge>}
        <span className="muted small">{node.hook?.slice(0, 46)}</span>
        <span className="muted small mono" style={{ marginLeft: 'auto' }}>
          {int(node.metrics?.clicks)} clicks · {int(node.conversions)} conv · {usd(node.costUsd)}
        </span>
        {depth > 0 && <button className="ghos-link" onClick={() => run(async () => setLift(await growth.cloneLift(node.armId)))}>lift</button>}
      </div>
      {node.mutationReason && <div className="muted small">{node.mutationReason}</div>}
      {node.decisionReason && <div className="small">{node.decisionReason}</div>}
      {lift && (
        <div className="alert info small">
          {lift.comparable ? <>{lift.context} {lift.says}</> : lift.says}
          <Caveats caveats={lift.caveats ?? []} title="比較的前提" />
        </div>
      )}
      {node.children.map((c) => <LineageNode key={c.armId} node={c} meta={meta} depth={depth + 1} />)}
    </div>
  )
}

/** Clone builder — one dimension, N variants, everything else frozen. */
function CloneBuilder({ winner, meta, onDone }) {
  const [dimension, setDimension] = useState('hook')
  const [variants, setVariants] = useState(['', ''])
  const [hypothesis, setHypothesis] = useState('')
  const { busy, error, run } = useAsyncAction()
  const spec = meta.mutationDimensions[dimension]

  return (
    <Card title={`從 Arm ${winner.label} 建立變體`} note="系統會自動建立一個 CTRL arm（parent 設定原樣重跑），用來吸收兩個觀測窗之間的環境變化——沒有它，平台分發的季節性變化會被誤讀成 clone lift。">
      <Field label="變異維度" hint={spec?.tests}>
        <select value={dimension} onChange={(e) => setDimension(e.target.value)}>
          {Object.entries(meta.mutationDimensions).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </Field>
      <Field label="凍結的維度" hint="這些欄位會從 parent 原樣複製，不允許在這一輪改動。">
        <div className="chips">
          {Object.keys(meta.mutationDimensions).filter((d) => d !== dimension).map((d) => (
            <span key={d} className="chip">{meta.mutationDimensions[d].label}</span>
          ))}
        </div>
      </Field>
      {variants.map((v, i) => (
        <Field key={i} label={`變體 V${i + 1}`}>
          <input value={v} onChange={(e) => setVariants(variants.map((x, j) => (j === i ? e.target.value : x)))} />
        </Field>
      ))}
      <div className="row">
        <button onClick={() => setVariants([...variants, ''])} disabled={variants.length >= 8}>再加一個變體</button>
        {variants.length > 1 && <button onClick={() => setVariants(variants.slice(0, -1))}>移除最後一個</button>}
      </div>
      <Field label="假設（留空則自動產生）"><textarea rows={2} value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} /></Field>
      <ErrorNote error={error} />
      <button className="primary" disabled={busy} onClick={() => run(async () => {
        await growth.clone(winner.experimentId, {
          parentArmId: winner.armId,
          mutationDimension: dimension,
          variants: variants.map((v) => v.trim()).filter(Boolean),
          hypothesis: hypothesis.trim() || undefined,
        })
        onDone()
      })}>{busy ? '建立中…' : '建立 child experiment'}</button>
    </Card>
  )
}
