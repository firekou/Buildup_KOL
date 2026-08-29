import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { GateList, GateResult, Field, useAsyncAction, ErrorNote } from '../components.jsx'

/**
 * 09 審查與合規 — DASHBOARD_SPEC.md §11.
 *
 * The queue, the gate chain behind each item, and the incident log. The
 * override path is deliberately friction-heavy: approving past a blocking gate
 * needs an explicit flag plus a written reason, and lands in the audit log as
 * a human override — because an evaluator's track record is only meaningful if
 * operator intervention stays separable from it.
 */
export default function ReviewCompliance({ meta, productId, refresh }) {
  const [queue, setQueue] = useState(null)
  const [incidents, setIncidents] = useState(null)
  const [reviews, setReviews] = useState(null)
  const { error, setError } = useAsyncAction()

  const load = () => {
    growth.reviewQueue(productId).then((d) => setQueue(d.queue)).catch((e) => setError(e.message))
    growth.incidents({ productId }).then((d) => setIncidents(d.incidents)).catch((e) => setError(e.message))
    growth.reviews({}).then(setReviews).catch(() => {})
  }
  // `useEffect(() => { load() }, …)` rather than `useEffect(load, …)`:
  // React treats an effect's return value as its cleanup function, so an
  // effect that returns a promise crashes the whole tree on unmount.
  useEffect(() => { load() }, [productId])

  if (!queue || !incidents) return <Loading />

  return (
    <div className="stack">
      <ErrorNote error={error} />

      <Card title="審查佇列" note="紅線第一層只是關鍵字比對，不是判定。標為「需人工」的每一條都必須由人依 semantic_prompt 逐條判斷後才算檢查完成。">
        {queue.length === 0 ? <Empty>佇列是空的。</Empty> : (
          <div className="stack">
            {queue.map((item) => <QueueItem key={item.asset.id} item={item} meta={meta} onDone={() => { load(); refresh() }} />)}
          </div>
        )}
      </Card>

      {reviews?.overrides?.length > 0 && (
        <Card title="人工 override 紀錄" note="這些是有人在阻擋級 gate 未解除的情況下放行的素材。合規稽核從這張表開始看。">
          <div className="scroll-x">
            <table>
              <thead><tr><th>時間</th><th>審查者</th><th>原因代碼</th><th>理由</th><th>policy 版本</th></tr></thead>
              <tbody>
                {reviews.overrides.map((r) => (
                  <tr key={r.id}>
                    <td className="small muted">{new Date(r.createdAt).toLocaleString('zh-TW', { hour12: false })}</td>
                    <td className="small">{r.reviewer}</td>
                    <td><Badge tone="bad">{r.reasonCode}</Badge></td>
                    <td className="small">{r.notes}</td>
                    <td className="small mono muted">{r.policyVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="政策事故" note="成長指標與事故率必須並列——只追流量會產生錯誤的激勵。">
        {incidents.length === 0 ? <Empty>目前沒有事故記錄。</Empty> : (
          <div className="scroll-x">
            <table>
              <thead><tr><th>類型</th><th>嚴重度</th><th>平台</th><th>人設</th><th>說明</th><th>處置</th><th>狀態</th><th>時間</th></tr></thead>
              <tbody>
                {incidents.map((i) => (
                  <tr key={i.id}>
                    <td className="small">{i.incidentType}</td>
                    <td><Badge tone={{ low: '', medium: 'warn', high: 'bad', critical: 'bad' }[i.severity]}>{i.severity}</Badge></td>
                    <td className="small">{i.platform ?? '—'}</td>
                    <td className="small">{i.personaId ?? '—'}</td>
                    <td className="small">{i.description}</td>
                    <td className="small muted">{i.resolution ?? '—'}</td>
                    <td><Badge tone={i.status === 'open' ? 'bad' : 'good'}>{i.status}</Badge></td>
                    <td className="small muted">{new Date(i.occurredAt).toLocaleDateString('zh-TW')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Policy profiles" note="Policy 是有版本的控制平面資料，不是文件裡的一段提醒。每筆審查決定都記錄它是在哪個版本下做的。">
        <div className="stack">
          {meta.policyProfiles.map((p) => (
            <div key={p.key} className="ghos-panel">
              <div className="row">
                <strong>{p.name}</strong>
                <Badge className="mono">{p.key}@{p.version}</Badge>
                <Badge tone={p.autoApproveAllowed ? 'warn' : 'good'}>{p.autoApproveAllowed ? '允許自動核准' : '一律人工核准'}</Badge>
                <Badge>最低年齡 {p.minAge}</Badge>
              </div>
              <p className="small muted">{p.description}</p>
              {p.restrictedClaimDomains?.length > 0 && (
                <div className="small">受限 claim 領域：{p.restrictedClaimDomains.join('、')}</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function QueueItem({ item, meta, onDone }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ decision: 'approved', reasonCode: 'OK', notes: '', overrideBlocking: false })
  const { busy, error, run } = useAsyncAction()
  const hasBlocking = item.blocking.length > 0

  return (
    <div className="ghos-oppo">
      <div className="row">
        <Badge tone={item.verdict === 'blocked' ? 'bad' : item.verdict === 'review_required' ? 'warn' : item.verdict === 'auto_approvable' ? 'good' : ''}>
          {{ blocked: '被擋下', review_required: '需人工審查', auto_approvable: '可自動核准', not_run: '尚未檢查' }[item.verdict]}
        </Badge>
        <strong>{item.experiment?.hypothesis?.slice(0, 50) ?? '—'}</strong>
        <span className="muted small">Arm {item.arm?.label}｜{meta.platforms[item.arm?.platform]?.label}</span>
        <span className="muted small">等待 {item.waitingSinceHours}h</span>
        <div className="row" style={{ marginLeft: 'auto' }}>
          <button onClick={() => run(async () => { await growth.runGate(item.asset.id); onDone() })} disabled={busy}>重跑檢查</button>
          <button onClick={() => setOpen(!open)}>{open ? '收合' : '審查'}</button>
        </div>
      </div>

      {item.asset.text && <pre className="ghos-pre">{item.asset.text}</pre>}

      <div className="row small" style={{ gap: 8 }}>
        {item.blocking.map((g) => <span key={g.gate}><GateResult result="blocking" /> {g.label}</span>)}
        {item.needsHuman.map((g) => <span key={g.gate}><GateResult result="needs_human" /> {g.label}</span>)}
        {item.warnings.map((g) => <span key={g.gate}><GateResult result="warning" /> {g.label}</span>)}
      </div>

      {open && (
        <div className="ghos-panel">
          <GateList gates={[...item.blocking, ...item.needsHuman, ...item.warnings]} />
          {item.policyVersion && <div className="small muted">依 policy {item.policyVersion} 判定。</div>}

          <div className="grid two" style={{ marginTop: 10 }}>
            <Field label="決定">
              <select value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })}>
                <option value="approved">核准</option>
                <option value="revision_requested">要求修改</option>
                <option value="rejected">退回</option>
              </select>
            </Field>
            <Field label="原因代碼">
              <select value={form.reasonCode} onChange={(e) => setForm({ ...form, reasonCode: e.target.value })}>
                {meta.reviewReasonCodes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="說明" hint={hasBlocking && form.decision === 'approved' ? 'override 阻擋級 gate 時為必填，且會記入稽核。' : '選填，但建議寫下語意層逐條確認的結果。'}>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {hasBlocking && form.decision === 'approved' && (
            <label className="row small alert bad">
              <input type="checkbox" style={{ width: 'auto' }} checked={form.overrideBlocking} onChange={(e) => setForm({ ...form, overrideBlocking: e.target.checked })} />
              我確認要 override {item.blocking.length} 項阻擋級檢查（此動作會被記為人工 override 並進入稽核紀錄）
            </label>
          )}
          <ErrorNote error={error} />
          <button className="primary" disabled={busy} onClick={() => run(async () => { await growth.decide(item.asset.id, form); onDone() })}>
            {busy ? '送出中…' : '送出審查結果'}
          </button>
        </div>
      )}
    </div>
  )
}
