import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { Recommendation, Field, useAsyncAction, ErrorNote, usd, int, rate } from '../components.jsx'

/**
 * 05 人設組合 — DASHBOARD_SPEC.md §7.
 *
 * Persona as an acquisition asset, not a character sheet. The identity half
 * is read live from `kols/` (the source of truth); only the growth overlay is
 * editable here — which is the guarantee that Growth OS never becomes a second,
 * drifting copy of the persona bible.
 */
export default function PersonaPortfolio({ meta, productId, products }) {
  const [rows, setRows] = useState(null)
  const [personas, setPersonas] = useState(null)
  const [selected, setSelected] = useState(null)
  const { error, setError } = useAsyncAction()

  const load = () => {
    growth.unitEconomics(productId).then((d) => setRows(d.byPersona)).catch((e) => setError(e.message))
    growth.personas(productId).then((d) => setPersonas(d.personas)).catch((e) => setError(e.message))
  }
  // `useEffect(() => { load() }, …)` rather than `useEffect(load, …)`:
  // React treats an effect's return value as its cleanup function, so an
  // effect that returns a promise crashes the whole tree on unmount.
  useEffect(() => { load() }, [productId])

  if (!rows || !personas) return <Loading />
  const byId = Object.fromEntries(personas.map((p) => [p.id, p]))

  return (
    <div className="stack">
      <ErrorNote error={error} />
      <Card title="組合表現" note="樣本不足時建議一律是「需重測」——單次爆款不足以把一個人設永久標成高價值。">
        {rows.length === 0 ? <Empty>還沒有任何人設跑過實驗。</Empty> : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr><th>人設</th><th>可信度</th><th className="num">實驗</th><th className="num">Winner</th><th className="num">曝光</th><th className="num">點擊</th><th className="num">轉換</th><th className="num">歸因價值</th><th className="num">成本</th><th className="num">貢獻</th><th>建議</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} onClick={() => setSelected(selected === r.key ? null : r.key)} style={{ cursor: 'pointer' }} className={selected === r.key ? 'on' : ''}>
                    <td><div className="row" style={{ gap: 6 }}>{r.avatar && <img src={r.avatar} alt="" className="ghos-avatar" />}<strong>{r.label}</strong></div></td>
                    <td className="small">{r.credibilityMode}</td>
                    <td className="num">{int(r.experimentCount)}</td>
                    <td className="num">{int(r.winners)}</td>
                    <td className="num">{r.impressions ? int(r.impressions) : '—'}</td>
                    <td className="num">{r.clicks ? int(r.clicks) : '—'}</td>
                    <td className="num">{int(r.conversions)}</td>
                    <td className="num">{usd(r.attributedValueUsd)}</td>
                    <td className="num">{usd(r.totalCostUsd)}</td>
                    <td className="num" style={{ color: r.contributionUsd > 0 ? 'var(--good)' : r.contributionUsd < 0 ? 'var(--bad)' : undefined }}>{usd(r.contributionUsd)}</td>
                    <td><Recommendation recommendation={r.recommendation} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="人設與 growth overlay" note="身分、支柱與紅線來自 kols/ 並為唯讀；此處只編輯 growth overlay（產品角色、平台角色、允許／禁止宣稱）。">
        <div className="stack">
          {personas.map((p) => (
            <PersonaRow key={p.id} persona={p} productId={productId} products={products} meta={meta} onSaved={load} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function PersonaRow({ persona: p, productId, products, meta, onSaved }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => ({
    productRole: p.overlay?.productRole ?? '',
    platformRoles: p.overlay?.platformRoles ?? {},
    allowedClaims: (p.overlay?.allowedClaims ?? []).join('\n'),
    blockedClaims: (p.overlay?.blockedClaims ?? []).join('\n'),
  }))
  const { busy, error, run } = useAsyncAction()
  const lines = (s) => String(s).split('\n').map((x) => x.trim()).filter(Boolean)

  return (
    <div className="ghos-oppo">
      <div className="row">
        {p.avatar && <img src={p.avatar} alt="" className="ghos-avatar" />}
        <strong>{p.name}</strong>
        <span className="muted small">{p.handle}</span>
        <Badge>{p.source.credibilityMode}</Badge>
        {p.source.redlineCount > 0 && <Badge tone="warn">{p.source.redlineCount} 條紅線</Badge>}
        {p.hasProductOverlay ? <Badge tone="good">已設定產品 overlay</Badge> : <Badge tone="warn">未設定產品 overlay</Badge>}
        {p.source.axisIssues?.length > 0 && <Badge tone="bad">{p.source.axisIssues.length} 個軸未定義</Badge>}
        <button style={{ marginLeft: 'auto' }} onClick={() => setOpen(!open)}>{open ? '收合' : '編輯 overlay'}</button>
      </div>

      {p.source.credibilityRisk && <div className="small warn-text">{p.source.credibilityRisk}</div>}
      {p.source.pillarNames?.length > 0 && (
        <div className="chips" style={{ marginTop: 4 }}>
          {p.source.pillarNames.map((n) => <span key={n} className="chip">{n}</span>)}
        </div>
      )}

      {open && (
        <div className="ghos-panel">
          {!productId && <div className="alert warn small">未選擇產品，將儲存為全域 overlay。要設定產品專屬角色請先在上方選擇產品。</div>}
          <Field label="產品角色">
            <select value={form.productRole} onChange={(e) => setForm({ ...form, productRole: e.target.value })}>
              <option value="">（未指定）</option>
              {Object.entries(meta.productRoles).map(([k, v]) => <option key={k} value={k}>{v.label} — {v.hint}</option>)}
            </select>
          </Field>
          <Field label="平台角色" hint="沒有指派平台角色的人設無法通過 router 的 platform_assigned gate。">
            <div className="stack">
              {meta.platformIds.map((pid) => (
                <div key={pid} className="row" style={{ gap: 8 }}>
                  <span style={{ width: 110 }} className="small">{meta.platforms[pid].label}</span>
                  <input
                    style={{ flex: 1 }}
                    placeholder="這個人設在此平台的角色，留白表示不指派"
                    value={form.platformRoles[pid] ?? ''}
                    onChange={(e) => {
                      const next = { ...form.platformRoles }
                      if (e.target.value) next[pid] = e.target.value
                      else delete next[pid]
                      setForm({ ...form, platformRoles: next })
                    }}
                  />
                </div>
              ))}
            </div>
          </Field>
          <div className="grid two">
            <Field label="允許宣稱（一行一項）"><textarea rows={3} value={form.allowedClaims} onChange={(e) => setForm({ ...form, allowedClaims: e.target.value })} /></Field>
            <Field label="禁止宣稱（一行一項）" hint="生成時會寫進 prompt，審查時會逐條比對——這是最直接的護欄。">
              <textarea rows={3} value={form.blockedClaims} onChange={(e) => setForm({ ...form, blockedClaims: e.target.value })} />
            </Field>
          </div>
          <ErrorNote error={error} />
          <button className="primary" disabled={busy} onClick={() => run(async () => {
            await growth.setOverlay(p.id, {
              productId: productId ?? null,
              productRole: form.productRole || null,
              platformRoles: form.platformRoles,
              allowedClaims: lines(form.allowedClaims),
              blockedClaims: lines(form.blockedClaims),
            })
            setOpen(false)
            onSaved()
          })}>{busy ? '儲存中…' : '儲存 overlay'}</button>
        </div>
      )}
    </div>
  )
}
