import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { Field, useAsyncAction, ErrorNote } from '../components.jsx'

/**
 * 02 議題雷達 — DASHBOARD_SPEC.md §4, plus the signal intake that feeds it.
 *
 * The UX rule from the spec, enforced here: there is no `87/100 Viral Score`.
 * Rows show evidence, freshness, explicit risk flags and status — and the
 * three judgement fields (why_now / tension / product relevance) are required
 * free text a human writes, never machine-generated.
 */
export default function OpportunityRadar({ meta, productId, products, refresh }) {
  const [signals, setSignals] = useState(null)
  const [opportunities, setOpportunities] = useState(null)
  const [draft, setDraft] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const { busy, error, run, setError } = useAsyncAction()

  const load = () => {
    growth.signals({ limit: 40 }).then((d) => setSignals(d.signals)).catch((e) => setError(e.message))
    growth.opportunities({ productId }).then((d) => setOpportunities(d.opportunities)).catch((e) => setError(e.message))
  }
  // `useEffect(() => { load() }, …)` rather than `useEffect(load, …)`:
  // React treats an effect's return value as its cleanup function, so an
  // effect that returns a promise crashes the whole tree on unmount.
  useEffect(() => { load() }, [productId])

  const scan = (region) => run(async () => {
    setScanning(true)
    try {
      const result = await growth.scanSignals({ region, sources: ['news', 'social_trend'], limit: 20 })
      setScanResult(result)
      load()
    } finally {
      setScanning(false)
    }
  })

  return (
    <div className="stack">
      <Card
        title="事件查找"
        note="新聞 RSS 與社群趨勢會被正規化成同一種 Signal，並依標題去重——同一則新聞被五家轉載時只會出現一次，但會累積來源數。"
        actions={
          <div className="row">
            {['TW', 'HK', 'SG', 'JP', 'US'].map((r) => (
              <button key={r} disabled={scanning} onClick={() => scan(r)}>{scanning ? '掃描中…' : `掃描 ${r}`}</button>
            ))}
          </div>
        }
      >
        <ErrorNote error={error} />
        {scanResult && (
          <div className="alert info">
            掃描完成：新增 {scanResult.ingested} 筆、重複 {scanResult.duplicates} 筆
            {Object.entries(scanResult.bySource ?? {}).map(([k, v]) => (
              <span key={k}>｜{k} {v.ingested}/{v.fetched}{v.source ? `（${v.source === 'fixtures' ? '範例資料' : v.source}）` : ''}</span>
            ))}
            {scanResult.failures?.length > 0 && <div className="warn-text small">{scanResult.failures.length} 個來源失敗</div>}
          </div>
        )}

        {!signals ? <Loading /> : signals.length === 0 ? (
          <Empty>還沒有任何訊號。按上面的按鈕掃描一次，或手動建立。</Empty>
        ) : (
          <div className="scroll-x">
            <table>
              <thead><tr><th>事件</th><th>來源</th><th>時效</th><th>佐證</th><th>已建題目</th><th></th></tr></thead>
              <tbody>
                {signals.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}</div>
                      {s.summary && <div className="muted small">{s.summary.slice(0, 110)}</div>}
                    </td>
                    <td className="small">{s.sourceType}<div className="muted">{s.sourceRef}</div></td>
                    <td>
                      <Badge tone={s.freshness.key === 'breaking' ? 'good' : s.freshness.key === 'fresh' ? 'accent' : s.freshness.key === 'unknown' ? 'warn' : ''}>
                        {s.freshness.label}
                      </Badge>
                      <div className="muted small">{s.freshness.hint}</div>
                    </td>
                    <td className="num">{s.corroboration}</td>
                    <td className="num">{s.opportunityCount}</td>
                    <td>
                      <button
                        disabled={!productId}
                        title={productId ? '' : '請先在上方選一個產品'}
                        onClick={() => run(async () => setDraft(await growth.draftOpportunity(s.id, productId)))}
                      >
                        建題目
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {draft && (
        <OpportunityForm
          draft={draft}
          meta={meta}
          onCancel={() => setDraft(null)}
          onDone={() => { setDraft(null); load(); refresh() }}
        />
      )}

      <Card title="Opportunity queue" note="沒有 why_now、對立與產品相關性就不是可測題目。此處不顯示任何綜合分數——在有校準資料之前，那只是虛構的精準感。">
        {!opportunities ? <Loading /> : opportunities.length === 0 ? (
          <Empty>還沒有任何 Opportunity。</Empty>
        ) : (
          <div className="stack">
            {opportunities.map((o) => <OpportunityRow key={o.id} opportunity={o} meta={meta} onChanged={load} />)}
          </div>
        )}
      </Card>
    </div>
  )
}

function OpportunityRow({ opportunity: o, meta, onChanged }) {
  const [open, setOpen] = useState(false)
  const [routed, setRouted] = useState(null)
  const { busy, error, run } = useAsyncAction()

  return (
    <div className="ghos-oppo">
      <div className="row">
        <Badge tone={{ new: 'accent', reviewed: '', experimenting: 'good', archived: '', rejected: 'bad' }[o.status]}>{o.status}</Badge>
        <strong>{o.topic}</strong>
        <Badge tone={o.freshness.key === 'breaking' ? 'good' : o.freshness.key === 'stale' ? 'warn' : ''}>{o.freshness.label}</Badge>
        {o.decayedSinceCreation && <Badge tone="warn">建立後已降級</Badge>}
        <span className="muted small">{o.experimentCount} 個實驗</span>
        <div style={{ marginLeft: 'auto' }} className="row">
          <button onClick={() => setOpen(!open)}>{open ? '收合' : '展開'}</button>
          <button disabled={busy} onClick={() => run(async () => setRouted(await growth.route(o.id)))}>選人設</button>
        </div>
      </div>

      {open && (
        <div className="ghos-panel">
          <dl className="meta-grid">
            <dt>Why now</dt><dd>{o.whyNow}</dd>
            <dt>對立</dt><dd>{o.tension}</dd>
            <dt>產品相關性</dt><dd>{o.productRelevance}<Badge>{o.relevanceAnchor}</Badge></dd>
          </dl>
          {o.riskFlagDetail?.length > 0 && (
            <div className="row" style={{ marginTop: 8 }}>
              {o.riskFlagDetail.map((f) => (
                <Badge key={f.flag} tone="warn" title={f.hint}>{f.label ?? f.flag}</Badge>
              ))}
            </div>
          )}
          {o.evidence?.length > 0 && (
            <ul className="evidence small" style={{ marginTop: 8 }}>
              {o.evidence.map((e, i) => (
                <li key={i}>{e.url ? <a href={e.url} target="_blank" rel="noreferrer">{e.outlet ?? e.type}</a> : `${e.type}：${e.outlet ?? e.tag ?? ''}`}
                  {e.measured === false && <span className="warn-text"> （範例資料，非實測）</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="row" style={{ marginTop: 8 }}>
            {meta.opportunityStatus.filter((s) => s !== o.status).map((s) => (
              <button key={s} onClick={() => run(async () => { await growth.setOpportunityStatus(o.id, s); onChanged() })}>標為 {s}</button>
            ))}
          </div>
        </div>
      )}

      <ErrorNote error={error} />
      {routed && <RouterResult routed={routed} opportunity={o} meta={meta} onDone={onChanged} />}
    </div>
  )
}

/** Persona router output — candidates with evidence and cautions, no score. */
function RouterResult({ routed, opportunity, meta, onDone }) {
  const [planning, setPlanning] = useState(null)
  return (
    <div className="ghos-panel">
      <div className="alert info small">{routed.method.says}</div>
      {routed.claimDomains.length > 0 && (
        <div className="small muted">此題涉及 claim 領域：{routed.claimDomains.join('、')}</div>
      )}
      <div className="stack" style={{ marginTop: 8 }}>
        {routed.candidates.map((c) => (
          <div key={c.personaId} className={`ghos-candidate ${c.eligible ? '' : 'blocked'}`}>
            <div className="row">
              {c.avatar && <img src={c.avatar} alt="" className="ghos-avatar" />}
              <strong>{c.name}</strong>
              <Badge>{c.credibilityMode}</Badge>
              <Badge tone={c.eligible ? 'good' : 'bad'}>{c.eligible ? '可用' : `擋下：${c.failedGates.join('、')}`}</Badge>
              {c.suggestedProductRole?.role && <Badge tone="accent">建議角色：{meta.productRoles[c.suggestedProductRole.role]?.label}</Badge>}
              <div style={{ marginLeft: 'auto' }}>
                <button disabled={!c.eligible} onClick={() => setPlanning(planning === c.personaId ? null : c.personaId)}>
                  {planning === c.personaId ? '取消' : '用這個人設建實驗'}
                </button>
              </div>
            </div>
            {c.evidence.length > 0 && (
              <ul className="ghos-list small" style={{ marginTop: 6 }}>
                {c.evidence.map((e, i) => <li key={i}><Badge tone="good">{e.type}</Badge> {e.says}</li>)}
              </ul>
            )}
            {c.cautions.length > 0 && (
              <ul className="ghos-list small" style={{ marginTop: 6 }}>
                {c.cautions.map((e, i) => <li key={i}><Badge tone="warn">{e.type}</Badge> {e.says}</li>)}
              </ul>
            )}
            {!c.eligible && (
              <div className="small muted" style={{ marginTop: 4 }}>
                {c.gates.filter((g) => !g.passed).map((g) => g.message).join('　')}
              </div>
            )}
            {planning === c.personaId && (
              <PlanExperiment opportunity={opportunity} candidate={c} meta={meta} onDone={() => { setPlanning(null); onDone() }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Create an experiment with two arms in one go — the planner's fast path. */
function PlanExperiment({ opportunity, candidate, meta, onDone }) {
  const [form, setForm] = useState({
    hypothesis: '', comparisonDimension: 'hook', primaryOutcome: 'click', observationWindowHours: 72,
    platform: candidate.platforms.find((p) => p.assigned)?.platform ?? candidate.platforms[0]?.platform ?? 'tiktok',
    format: 'short_video', cta: '', hookA: '', hookB: '',
  })
  const { busy, error, run } = useAsyncAction()
  const dim = form.comparisonDimension

  return (
    <div className="ghos-panel" style={{ marginTop: 8 }}>
      <Field label="假設" hint="必須是可證偽的一句話：改變 X 會讓 Y 上升。">
        <textarea rows={2} value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
          placeholder={`用「${'…'}」當 hook 會比「${'…'}」帶來更多${form.primaryOutcome}`} />
      </Field>
      <div className="grid two">
        <Field label="比較維度" hint="這一輪只比這一個變因，其他欄位所有 arm 必須相同。">
          <select value={form.comparisonDimension} onChange={(e) => setForm({ ...form, comparisonDimension: e.target.value })}>
            {Object.entries(meta.dimensions).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Primary outcome" hint="產品端事件需要產品已定義該 conversion event，否則系統會擋下。">
          <select value={form.primaryOutcome} onChange={(e) => setForm({ ...form, primaryOutcome: e.target.value })}>
            {meta.primaryOutcomes.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="觀測窗（小時）"><input type="number" value={form.observationWindowHours} onChange={(e) => setForm({ ...form, observationWindowHours: Number(e.target.value) })} /></Field>
        <Field label="平台">
          <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
            {candidate.platforms.map((p) => <option key={p.platform} value={p.platform}>{p.label}{p.assigned ? '' : '（未指派角色）'}</option>)}
          </select>
        </Field>
        <Field label="格式">
          <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
            {(meta.platforms[form.platform]?.formats ?? meta.formats).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="CTA（兩個 arm 相同）"><input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} /></Field>
      </div>
      <div className="grid two">
        <Field label={`Arm A 的 ${meta.dimensions[dim]?.label}`}><input value={form.hookA} onChange={(e) => setForm({ ...form, hookA: e.target.value })} /></Field>
        <Field label={`Arm B 的 ${meta.dimensions[dim]?.label}`}><input value={form.hookB} onChange={(e) => setForm({ ...form, hookB: e.target.value })} /></Field>
      </div>
      <ErrorNote error={error} />
      <button className="primary" disabled={busy} onClick={() => run(async () => {
        const exp = await growth.createExperiment({
          productId: opportunity.productId, campaignId: opportunity.campaignId, opportunityId: opportunity.id,
          hypothesis: form.hypothesis, comparisonDimension: form.comparisonDimension,
          primaryOutcome: form.primaryOutcome, observationWindowHours: form.observationWindowHours,
        })
        const base = {
          personaId: candidate.personaId, format: form.format, platform: form.platform, cta: form.cta,
          productRole: candidate.suggestedProductRole?.role ?? null,
        }
        const field = meta.dimensions[dim].field
        await growth.addArm(exp.id, { ...base, hook: form.hookA, [field]: form.hookA })
        await growth.addArm(exp.id, { ...base, hook: form.hookA, [field]: form.hookB })
        onDone()
      })}>{busy ? '建立中…' : '建立實驗與兩個 arm'}</button>
    </div>
  )
}

/** The human-written opportunity form. The three judgement fields are required. */
function OpportunityForm({ draft, meta, onCancel, onDone }) {
  const [form, setForm] = useState({
    topic: draft.topic,
    whyNow: '',
    tension: '',
    productRelevance: '',
    relevanceAnchor: draft.suggestedAnchors[0]?.anchor ?? 'none',
    riskFlags: draft.suggestedRiskFlags ?? [],
    claimDomains: draft.suggestedClaimDomains ?? [],
  })
  const { busy, error, run } = useAsyncAction()
  const toggle = (key, value) => setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }))

  return (
    <Card title="建立 Opportunity" note={draft.caveat}>
      <div className="alert info small">{draft.whyNowDraft}</div>
      {draft.suggestedAnchors.length > 0 && (
        <div className="small" style={{ marginBottom: 8 }}>
          <strong>系統找到的產品錨點：</strong>
          <ul className="ghos-list">
            {draft.suggestedAnchors.map((a, i) => (
              <li key={i}><Badge tone="accent">{a.anchor}</Badge> {a.seed}（命中：{a.matchedTokens.join('、')}）<div className="muted">{a.hint}</div></li>
            ))}
          </ul>
        </div>
      )}
      <Field label="題目"><input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></Field>
      <Field label="Why now" hint={draft.prompts.whyNow}><textarea rows={2} value={form.whyNow} onChange={(e) => setForm({ ...form, whyNow: e.target.value })} /></Field>
      <Field label="對立／張力" hint={draft.prompts.tension}><textarea rows={2} value={form.tension} onChange={(e) => setForm({ ...form, tension: e.target.value })} /></Field>
      <Field label="產品相關性" hint={draft.prompts.productRelevance}><textarea rows={2} value={form.productRelevance} onChange={(e) => setForm({ ...form, productRelevance: e.target.value })} /></Field>
      <Field label="相關性錨點">
        <select value={form.relevanceAnchor} onChange={(e) => setForm({ ...form, relevanceAnchor: e.target.value })}>
          {meta.relevanceAnchors.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Field>
      <Field label="風險旗標">
        <div className="chips">
          {Object.entries(meta.riskFlags).map(([k, v]) => (
            <span key={k} className={`chip selectable ${form.riskFlags.includes(k) ? 'on' : ''}`} title={v.hint} onClick={() => toggle('riskFlags', k)}>{v.label}</span>
          ))}
        </div>
      </Field>
      <Field label="Claim 領域" hint="標為受監管領域的題目一律需人工審查，且無法由 embodied 型人設承載。">
        <div className="chips">
          {meta.claimDomains.map((d) => (
            <span key={d} className={`chip selectable ${form.claimDomains.includes(d) ? 'on' : ''}`} onClick={() => toggle('claimDomains', d)}>{d}</span>
          ))}
        </div>
      </Field>
      <ErrorNote error={error} />
      <div className="row">
        <button className="primary" disabled={busy} onClick={() => run(async () => {
          await growth.createOpportunity({ ...form, productId: draft.productId, signalId: draft.signalId, evidence: draft.evidence })
          onDone()
        })}>{busy ? '建立中…' : '建立'}</button>
        <button onClick={onCancel}>取消</button>
      </div>
    </Card>
  )
}
