import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { Metric, MetricRow, GateList, DecisionBadge, StatusBadge, Caveats, Field, useAsyncAction, ErrorNote, usd, int, rate } from '../components.jsx'

/**
 * 03 實驗室 — DASHBOARD_SPEC.md §5.
 *
 * List, then detail: the experiment contract, the arms side by side, the
 * timeline, and the evidence/caveats block. The contract is shown *first*
 * because an arms table with no contract above it invites reading the biggest
 * number as the winner.
 */
export default function ExperimentLab({ meta, productId, refresh }) {
  const [experiments, setExperiments] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const { error, setError } = useAsyncAction()

  const load = () => {
    growth.experiments({ productId }).then((d) => setExperiments(d.experiments)).catch((e) => setError(e.message))
  }
  // `useEffect(() => { load() }, …)` rather than `useEffect(load, …)`:
  // React treats an effect's return value as its cleanup function, so an
  // effect that returns a promise crashes the whole tree on unmount.
  useEffect(() => { load() }, [productId])

  const loadDetail = (id) => {
    setDetail(null)
    setSelected(id)
    if (id) growth.experiment(id).then(setDetail).catch((e) => setError(e.message))
  }

  return (
    <div className="stack">
      <Card title="實驗列表" note="Spend、資料完整度與判定並列——沒有資料完整度就顯示 Winner，是規格明文禁止的反樣式。">
        <ErrorNote error={error} />
        {!experiments ? <Loading /> : experiments.length === 0 ? (
          <Empty>還沒有實驗。到「議題雷達」選一個題目與人設建立第一個。</Empty>
        ) : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr><th>假設</th><th>比較維度</th><th>Primary outcome</th><th className="num">Arms</th><th>狀態</th><th>資料完整度</th><th className="num">成本</th></tr>
              </thead>
              <tbody>
                {experiments.map((e) => (
                  <tr key={e.id} className={selected === e.id ? 'on' : ''} onClick={() => loadDetail(selected === e.id ? null : e.id)} style={{ cursor: 'pointer' }}>
                    <td>{e.hypothesis}<div className="muted small mono">{e.id}</div></td>
                    <td>{e.dimensionLabel}</td>
                    <td>{e.primaryOutcome}</td>
                    <td className="num">{e.armCount}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className="small">{e.dataCompletenessStatus}</td>
                    <td className="num">{e.lastEvaluatedAt ? '' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (detail ? <ExperimentDetail detail={detail} meta={meta} onChanged={() => { loadDetail(selected); load(); refresh() }} /> : <Loading />)}
    </div>
  )
}

function ExperimentDetail({ detail: d, meta, onChanged }) {
  const { busy, error, run } = useAsyncAction()
  const [adapterId, setAdapterId] = useState('template')
  const decision = d.decisions?.[0]

  return (
    <div className="stack">
      <Card
        title={<div><h3>{d.hypothesis}</h3><div className="muted small mono">{d.id}</div></div>}
        actions={
          <div className="row">
            <select value={adapterId} onChange={(e) => setAdapterId(e.target.value)}>
              {meta.generationAdapters.map((a) => <option key={a.id} value={a.id} disabled={!a.configured}>{a.label}{a.configured ? '' : '（未設定）'}</option>)}
            </select>
            <button disabled={busy} onClick={() => run(async () => { await growth.generate(d.id, { adapterId }); onChanged() })}>生成素材</button>
            <button className="primary" disabled={busy} onClick={() => run(async () => { await growth.evaluate(d.id); onChanged() })}>執行評估</button>
          </div>
        }
      >
        <ErrorNote error={error} />
        <div className="row">
          <StatusBadge status={d.status} />
          {decision && <DecisionBadge decision={decision.decision} />}
          <Badge>{d.dimensionLabel}</Badge>
          <Badge>觀測窗 {d.observationWindowHours}h</Badge>
          {d.evaluatorVersion && <Badge>evaluator v{d.evaluatorVersion}</Badge>}
        </div>

        <section style={{ marginTop: 12 }}>
          <h4>實驗契約</h4>
          <dl className="meta-grid">
            <dt>Primary outcome</dt><dd>{d.primaryOutcome}{d.primaryConversionEvent ? `（事件 ${d.primaryConversionEvent}）` : ''}</dd>
            <dt>比較基準</dt><dd>{d.baseline?.says}</dd>
            <dt>被測維度</dt><dd>{d.testedDimensions?.map((t) => meta.dimensions[t]?.label ?? t).join('、')}</dd>
            <dt>凍結維度</dt><dd className="small muted">{d.frozenDimensions?.map((t) => meta.dimensions[t]?.label ?? t).join('、')}</dd>
            <dt>觀測窗</dt><dd>{d.observationStartedAt ? `${d.observationStartedAt} → ${d.observationEndsAt}` : '尚未開始（第一次發布時啟動）'}</dd>
          </dl>
          <GateList gates={d.contractGates.gates.map((g) => ({ ...g, result: g.passed ? 'pass' : 'blocking', label: g.gate }))} />
        </section>
      </Card>

      <Card title="資料完整度" note="這是 evaluator 的守門人。任何一項阻擋級檢查未過，就不會產生 Winner 判定。">
        <div className="row">
          <Badge tone={d.completeness.evaluable ? 'good' : 'warn'}>{d.completeness.evaluable ? '可評估' : '尚不可評估'}</Badge>
          <Badge>{d.completeness.state}</Badge>
        </div>
        <p className="small">{d.completeness.summary}</p>
        <GateList gates={d.completeness.checks.map((c) => ({ ...c, result: c.passed ? 'pass' : c.blocking ? 'blocking' : 'warning', label: c.check }))} />
      </Card>

      <Card title="Arms 比較" note="跨平台的絕對數字不可直接相比；平台不同時 evaluator 會在 caveats 明說。">
        <div className="scroll-x">
          <table>
            <thead>
              <tr><th>Arm</th><th>人設</th><th>被測值</th><th>平台</th><th className="num">曝光</th><th className="num">點擊</th><th className="num">CTR</th><th className="num">轉換</th><th className="num">成本</th><th>狀態</th></tr>
            </thead>
            <tbody>
              {d.arms.map((a) => {
                const impressions = a.metrics.impressions ?? a.metrics.views ?? null
                return (
                  <tr key={a.id}>
                    <td><strong>{a.label}</strong>{a.multiFactor && <Badge tone="warn">多因子</Badge>}</td>
                    <td className="small">{a.personaId}</td>
                    <td className="small">{a[meta.dimensions[d.comparisonDimension]?.field] ?? a.hook}</td>
                    <td className="small">{meta.platforms[a.platform]?.label ?? a.platform}</td>
                    <td className="num">{impressions == null ? '—' : int(impressions)}</td>
                    <td className="num">{a.metrics.clicks == null ? '—' : int(a.metrics.clicks)}</td>
                    <td className="num">{impressions && a.metrics.clicks != null ? rate(a.metrics.clicks / impressions) : '—'}</td>
                    <td className="num">{int(a.conversions)}</td>
                    <td className="num">{usd(a.cost.totalUsd)}</td>
                    <td>
                      <StatusBadge status={a.status} />
                      {a.decision && <DecisionBadge decision={a.decision.decision} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {d.arms.some((a) => a.platformFitWarnings?.length > 0) && (
          <div className="alert warn small" style={{ marginTop: 8 }}>
            {d.arms.flatMap((a) => (a.platformFitWarnings ?? []).map((w) => `${a.label}: ${w.message}`)).join('　')}
          </div>
        )}
        <div className="ghos-armdetail">
          {d.arms.map((a) => (
            <div key={a.id} className="ghos-panel">
              <div className="row"><strong>Arm {a.label}</strong><Badge>{a.hook}</Badge><span className="muted small">{a.cta}</span></div>
              {a.assets.map((asset) => (
                <div key={asset.id} className="ghos-asset">
                  <div className="row small">
                    <Badge tone={asset.reviewStatus === 'approved' ? 'good' : asset.reviewStatus === 'rejected' ? 'bad' : 'warn'}>{asset.reviewStatus}</Badge>
                    <span className="muted mono">{asset.assetType}</span>
                    {asset.duplicateOfArmId && <Badge tone="bad">與其他 arm 內容重複</Badge>}
                  </div>
                  {asset.text && <pre className="ghos-pre">{asset.text}</pre>}
                </div>
              ))}
              {a.assets.length === 0 && <p className="muted small">尚未生成素材。</p>}
              {a.cloneLift?.comparable && (
                <div className="alert info small">
                  <strong>Clone lift：</strong>{a.cloneLift.context} {a.cloneLift.says}
                  <Caveats caveats={a.cloneLift.caveats} title="比較的前提" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {decision && (
        <Card title="評估結果">
          <div className="row"><DecisionBadge decision={decision.decision} /><Badge>evaluator v{decision.evaluatorVersion}</Badge><span className="muted small">{decision.decidedAt}</span></div>
          <p style={{ marginTop: 8 }}>{decision.decisionReason}</p>
          {decision.comparison?.test && (
            <div className="small muted">
              檢定方法：{decision.comparison.test.method ?? '—'}
              {decision.comparison.test.z != null && `｜z = ${decision.comparison.test.z}`}
              {decision.comparison.test.usable === false && `｜${decision.comparison.test.reason}`}
            </div>
          )}
          <Caveats caveats={decision.caveats ?? []} />
        </Card>
      )}

      <div className="grid two">
        <Card title="成本">
          <MetricRow>
            <Metric label="總成本" value={usd(d.cost.totalUsd)} />
            <Metric label="Credits" value={int(d.cost.totalCredits)} />
            <Metric label="筆數" value={int(d.cost.count)} />
            <Metric label="推估部分" value={usd(d.cost.estimatedPortionUsd)} hint={d.cost.estimatedPortionUsd > 0 ? '非實際帳單金額' : null} />
          </MetricRow>
        </Card>
        <Card title="時間軸" note="planned → generated → reviewed → published → collecting → evaluable → decision">
          <ul className="ghos-timeline">
            {d.timeline.slice(-14).map((e) => (
              <li key={e.id}>
                <span className="mono small muted">{new Date(e.occurredAt).toLocaleString('zh-TW', { hour12: false })}</span>
                <span>{e.eventName}</span>
                <span className="muted small">{e.source}</span>
              </li>
            ))}
            {d.timeline.length === 0 && <li className="muted small">尚無事件。</li>}
          </ul>
        </Card>
      </div>

      <Card title="新增 arm" note="新 arm 必須在比較維度上與 arm A 不同，並在其他所有維度上相同——系統會擋下同時改多個維度的 arm。">
        <AddArm experimentId={d.id} experiment={d} meta={meta} onDone={onChanged} />
      </Card>
    </div>
  )
}

function AddArm({ experimentId, experiment, meta, onDone }) {
  const first = experiment.arms[0]
  const [form, setForm] = useState(() => ({
    personaId: first?.personaId ?? '', hook: first?.hook ?? '', format: first?.format ?? 'short_video',
    platform: first?.platform ?? 'tiktok', cta: first?.cta ?? '', productRole: first?.productRole ?? null,
    tone: first?.tone ?? '', visualSetting: first?.visualSetting ?? '',
  }))
  const { busy, error, run } = useAsyncAction()
  const field = meta.dimensions[experiment.comparisonDimension]?.field ?? 'hook'

  if (!['DRAFT', 'PLANNED'].includes(experiment.status)) {
    return <p className="muted small">實驗已進入 {experiment.status}，不能再加 arm——加了就不是同一個觀測窗下的比較。</p>
  }

  return (
    <div>
      <div className="alert info small">只需要改變「{meta.dimensions[experiment.comparisonDimension]?.label}」欄位（{field}），其餘欄位已自動對齊 arm {first?.label}。</div>
      <Field label={`${meta.dimensions[experiment.comparisonDimension]?.label}（本 arm 的值）`}>
        <input value={form[field] ?? ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
      </Field>
      <ErrorNote error={error} />
      <button className="primary" disabled={busy} onClick={() => run(async () => { await growth.addArm(experimentId, form); onDone() })}>
        {busy ? '新增中…' : '新增 arm'}
      </button>
    </div>
  )
}
