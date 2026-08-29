import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { StatusBadge, Field, useAsyncAction, ErrorNote, int, rate } from '../components.jsx'

/**
 * 06 下發 — DASHBOARD_SPEC.md §8.
 *
 * Account health next to publish volume, deliberately: a rising publish rate
 * with rising restrictions is the pattern a volume-only dashboard hides.
 *
 * There is no bulk-scheduling or cross-account coordination UI here, and there
 * will not be — ROADMAP.md Epic 8 lists coordinated fake engagement, undisclosed
 * impersonation and ban evasion as explicit non-tasks.
 */
export default function Distribution({ meta, productId, refresh }) {
  const [accounts, setAccounts] = useState(null)
  const [publications, setPublications] = useState(null)
  const [creating, setCreating] = useState(false)
  const { error, setError } = useAsyncAction()

  const load = () => {
    growth.accounts().then((d) => setAccounts(d.accounts)).catch((e) => setError(e.message))
    growth.publications({ productId }).then((d) => setPublications(d.publications)).catch((e) => setError(e.message))
  }
  // `useEffect(() => { load() }, …)` rather than `useEffect(load, …)`:
  // React treats an effect's return value as its cleanup function, so an
  // effect that returns a promise crashes the whole tree on unmount.
  useEffect(() => { load() }, [productId])

  if (!accounts || !publications) return <Loading />

  return (
    <div className="stack">
      <ErrorNote error={error} />

      <Card
        title="帳號健康度"
        note="憑證只存環境變數名稱等「參照」，不存實際 token。角色帳號必須登記人設，否則無法通過身分揭露檢查。"
        actions={<button className="primary" onClick={() => setCreating(!creating)}>{creating ? '取消' : '登記帳號'}</button>}
      >
        {creating && <CreateAccount meta={meta} onDone={() => { setCreating(false); load() }} />}
        {accounts.length === 0 ? <Empty>還沒有登記任何帳號。</Empty> : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr><th>平台</th><th>帳號</th><th>人設</th><th>狀態</th><th className="num">發布總數</th><th className="num">近 7 天</th><th className="num">失敗率</th><th className="num">事故</th><th>速率上限壓力</th><th>最後同步</th></tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{meta.platforms[a.platform]?.label ?? a.platform}</td>
                    <td className="mono small">{a.accountRef}</td>
                    <td className="small">{a.personaId ?? <span className="muted">品牌帳號</span>}</td>
                    <td><StatusBadge status={a.status} />{a.policyState !== 'ok' && <Badge tone="warn">{a.policyState}</Badge>}</td>
                    <td className="num">{int(a.publishTotal)}</td>
                    <td className="num">{int(a.publishLast7d)}</td>
                    <td className="num">{a.failureRate == null ? '—' : rate(a.failureRate)}</td>
                    <td className="num" style={{ color: a.openIncidents ? 'var(--bad)' : undefined }}>{int(a.incidents)}</td>
                    <td>
                      {a.rateLimitPressure == null ? '—' : (
                        <div className="bar" style={{ minWidth: 70 }}>
                          <span className={a.rateLimitPressure > 0.8 ? 'bad' : ''} style={{ width: `${Math.min(100, a.rateLimitPressure * 100)}%` }} />
                        </div>
                      )}
                      <div className="muted small">上限 {a.rateLimitPerDay ?? '—'}/日</div>
                    </td>
                    <td className="small muted">{a.lastMetricSyncAt ? new Date(a.lastMetricSyncAt).toLocaleString('zh-TW', { hour12: false }) : '未同步'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="發布模式" note="目前所有平台都是「人工發布後登錄」。這是誠實的預設：假裝發文成功但實際沒有貼文的紀錄，會一路污染成效、歸因與 Winner 判定。">
        <div className="scroll-x">
          <table>
            <thead><tr><th>平台</th><th>官方 API</th><th>本系統模式</th><th>說明</th></tr></thead>
            <tbody>
              {meta.publishAdapters.map((a) => (
                <tr key={a.id}>
                  <td>{a.label}</td>
                  <td>{a.automation === 'api' ? <Badge tone="good">有</Badge> : <Badge tone="warn">無</Badge>}</td>
                  <td><Badge>{a.mode}</Badge></td>
                  <td className="small muted">{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Publication" note="Tracking code 在排程時就簽發，這樣 CTA 裡才帶得上——發布後才產生的連結是沒有人點過的連結。">
        {publications.length === 0 ? <Empty>還沒有任何 publication。</Empty> : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr><th>狀態</th><th>平台</th><th>Arm</th><th>貼文</th><th>Tracking</th><th className="num">曝光</th><th className="num">點擊</th><th>成效更新</th><th></th></tr>
              </thead>
              <tbody>
                {publications.map((p) => (
                  <PublicationRow key={p.id} publication={p} meta={meta} onChanged={() => { load(); refresh() }} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function PublicationRow({ publication: p, meta, onChanged }) {
  const [open, setOpen] = useState(null)
  const { busy, error, run } = useAsyncAction()
  const [pub, setPub] = useState({ platformPostId: '', url: '', disclosureConfirmed: false })
  const [metrics, setMetrics] = useState({})

  const platformMetrics = meta.platforms[p.platform]?.telemetry ?? []

  return (
    <>
      <tr>
        <td><StatusBadge status={p.status} /></td>
        <td className="small">{meta.platforms[p.platform]?.label ?? p.platform}</td>
        <td className="small mono">{p.armId?.slice(-6)}</td>
        <td className="small">{p.url ? <a href={p.url} target="_blank" rel="noreferrer">開啟</a> : <span className="muted">—</span>}</td>
        <td className="small mono">{p.trackingCode ?? <span className="muted warn-text">無</span>}</td>
        <td className="num">{p.metrics?.impressions ?? p.metrics?.views ? int(p.metrics.impressions ?? p.metrics.views) : '—'}</td>
        <td className="num">{p.metrics?.clicks != null ? int(p.metrics.clicks) : '—'}</td>
        <td className="small muted">{p.lastMetricSyncAt ? new Date(p.lastMetricSyncAt).toLocaleString('zh-TW', { hour12: false }) : '未同步'}</td>
        <td>
          {p.status === 'scheduled' && <button onClick={() => setOpen(open === 'publish' ? null : 'publish')}>登錄發布</button>}
          {p.status === 'published' && <button onClick={() => setOpen(open === 'metrics' ? null : 'metrics')}>登錄成效</button>}
        </td>
      </tr>
      {open === 'publish' && (
        <tr><td colSpan={9}>
          <div className="ghos-panel">
            {p.disclosureRequired && (
              <div className="alert warn small">
                {meta.platforms[p.platform]?.disclosureNote} 系統不會替你宣告已揭露——請先在平台上開啟 AI 標示。
              </div>
            )}
            <Field label="平台貼文 ID"><input value={pub.platformPostId} onChange={(e) => setPub({ ...pub, platformPostId: e.target.value })} /></Field>
            <Field label="貼文 URL"><input value={pub.url} onChange={(e) => setPub({ ...pub, url: e.target.value })} /></Field>
            {p.trackedUrl && <Field label="這則貼文的 CTA 應使用的追蹤連結"><input readOnly value={p.trackedUrl} /></Field>}
            <label className="row small">
              <input type="checkbox" style={{ width: 'auto' }} checked={pub.disclosureConfirmed} onChange={(e) => setPub({ ...pub, disclosureConfirmed: e.target.checked })} />
              我已在平台上開啟 AI 生成標示
            </label>
            <ErrorNote error={error} />
            <button className="primary" disabled={busy} onClick={() => run(async () => { await growth.publish(p.id, pub); setOpen(null); onChanged() })}>登錄</button>
          </div>
        </td></tr>
      )}
      {open === 'metrics' && (
        <tr><td colSpan={9}>
          <div className="ghos-panel">
            <div className="small muted">此平台可回報：{platformMetrics.join('、')}。沒有回報的指標請留空——留空代表「沒有這個數字」，填 0 代表「量到 0」，兩者意義不同。</div>
            <div className="grid three" style={{ marginTop: 8 }}>
              {platformMetrics.map((m) => (
                <Field key={m} label={m}>
                  <input type="number" value={metrics[m] ?? ''} onChange={(e) => setMetrics({ ...metrics, [m]: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </Field>
              ))}
            </div>
            <ErrorNote error={error} />
            <button className="primary" disabled={busy} onClick={() => run(async () => {
              const clean = Object.fromEntries(Object.entries(metrics).filter(([, v]) => v != null))
              await growth.ingestMetrics(p.id, { metrics: clean, source: 'manual' })
              setOpen(null); onChanged()
            })}>登錄成效</button>
          </div>
        </td></tr>
      )}
    </>
  )
}

function CreateAccount({ meta, onDone }) {
  const [form, setForm] = useState({ platform: 'tiktok', accountRef: '', accountType: 'persona_owned', personaId: '', credentialRef: '' })
  const [personas, setPersonas] = useState([])
  const { busy, error, run } = useAsyncAction()
  useEffect(() => { growth.personas().then((d) => setPersonas(d.personas)) }, [])

  return (
    <div className="ghos-panel" style={{ marginBottom: 12 }}>
      <div className="grid two">
        <Field label="平台">
          <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
            {meta.platformIds.map((p) => <option key={p} value={p}>{meta.platforms[p].label}</option>)}
          </select>
        </Field>
        <Field label="帳號 handle"><input value={form.accountRef} onChange={(e) => setForm({ ...form, accountRef: e.target.value })} placeholder="@handle" /></Field>
        <Field label="帳號類型">
          <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
            {meta.accountTypes.map((t) => <option key={t} value={t}>{t === 'persona_owned' ? '人設帳號' : '品牌帳號'}</option>)}
          </select>
        </Field>
        {form.accountType === 'persona_owned' && (
          <Field label="人設" hint="人設帳號必須登記對應人設——沒有登記人設的角色帳號無法通過身分揭露檢查。">
            <select value={form.personaId} onChange={(e) => setForm({ ...form, personaId: e.target.value })}>
              <option value="">（選擇）</option>
              {personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}
      </div>
      <Field label="憑證參照" hint="只填環境變數名稱，例如 TIKTOK_TOKEN_XIAOXIAO。實際 token 絕不進入本系統。">
        <input value={form.credentialRef} onChange={(e) => setForm({ ...form, credentialRef: e.target.value })} />
      </Field>
      <ErrorNote error={error} />
      <button className="primary" disabled={busy} onClick={() => run(async () => { await growth.createAccount(form); onDone() })}>登記</button>
    </div>
  )
}
