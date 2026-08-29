import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { Metric, MetricRow, Recommendation, GateList, Field, useAsyncAction, ErrorNote, usd, int, rate } from '../components.jsx'

/**
 * 00 產品狀態 — the board this dashboard was commissioned for.
 *
 * One row per product, one column per stage of the Growth OS loop. The stage
 * is derived from data (growth/pipeline.js), so a product cannot be marked
 * further along than its own records support, and the `blockedBy` cell always
 * names the one thing standing in the way.
 */
export default function ProductBoard({ meta, refresh, products }) {
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!selected) return setDetail(null)
    setDetail(null)
    growth.product(selected).then(setDetail).catch(() => setDetail(null))
  }, [selected, products])

  const stages = meta.stages

  return (
    <div className="stack">
      <Card
        title="產品在 Growth OS 的位置"
        note="階段由資料推導，不是手動標記的狀態。一個產品只有在真的有 publication 時才會顯示「已發布」，只有在 Winner 產生了 child experiment 時才會進入「複利」。"
        actions={<button className="primary" onClick={() => setCreating((v) => !v)}>{creating ? '取消' : '新增產品'}</button>}
      >
        {creating && <CreateProduct meta={meta} onDone={() => { setCreating(false); refresh() }} />}

        {products.length === 0 ? (
          <Empty>還沒有任何產品。新增一個產品並執行特性分析，就是 Growth OS 的第一步。</Empty>
        ) : (
          <div className="scroll-x">
            <table className="ghos-board">
              <thead>
                <tr>
                  <th>產品</th>
                  {stages.map((s) => (
                    <th key={s.key} className="ghos-stage-head" title={s.says}>{s.label}</th>
                  ))}
                  <th>卡在哪</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.productId} className={selected === p.productId ? 'on' : ''} onClick={() => setSelected(selected === p.productId ? null : p.productId)}>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="muted small">{p.businessModel}</div>
                    </td>
                    {stages.map((s) => {
                      const reached = p.reached.includes(s.key)
                      const current = p.stage === s.key
                      return (
                        <td key={s.key} className={`ghos-cell ${reached ? 'reached' : ''} ${current ? 'current' : ''}`}>
                          {current ? '◉' : reached ? '●' : '○'}
                        </td>
                      )
                    })}
                    <td className="small">
                      {p.blockedBy ? (
                        <>
                          <strong className="warn-text">{p.blockedBy.what}</strong>
                          <div className="muted">{p.blockedBy.how}</div>
                        </>
                      ) : (
                        <span className="muted">閉環運轉中</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {products.map((p) => (
        <Card key={p.productId} title={`${p.name}｜${p.stageLabel}`} note={p.stageSays}>
          <MetricRow>
            <Metric label="曝光" value={int(p.economics.impressions)} />
            <Metric label="點擊" value={int(p.economics.clicks)} />
            <Metric label="歸因轉換" value={int(p.economics.conversions)} />
            <Metric label="歸因價值" value={usd(p.economics.attributedValueUsd)} />
            <Metric label="總成本" value={usd(p.economics.totalCostUsd)} />
            <Metric
              label="貢獻"
              value={usd(p.economics.contributionUsd)}
              tone={p.economics.contributionUsd > 0 ? 'good' : p.economics.contributionUsd < 0 ? 'bad' : ''}
            />
            <Metric label="每轉換成本" value={usd(p.economics.costPerConversion)} hint={p.economics.costPerConversion == null ? '尚無歸因轉換' : null} />
            <Metric label="實驗" value={int(p.counts.experiments)} hint={`${p.counts.winners} 個 Winner`} />
          </MetricRow>
          <div className="row" style={{ marginTop: 10 }}>
            <Recommendation recommendation={p.recommendation} />
            {p.counts.openIncidents > 0 && <Badge tone="bad">{p.counts.openIncidents} 個未結案事故</Badge>}
            {!p.analysedAt && <Badge tone="warn">尚未做特性分析</Badge>}
          </div>
          <div className="row small muted" style={{ marginTop: 8, gap: 14 }}>
            <span>下一步：{p.exitCriterion}</span>
            <button className="ghos-link" onClick={() => setSelected(selected === p.productId ? null : p.productId)}>
              {selected === p.productId ? '收合特性分析' : '展開特性分析'}
            </button>
          </div>
          {selected === p.productId && (detail ? <ProductAnalysis product={detail} meta={meta} refresh={refresh} /> : <Loading />)}
        </Card>
      ))}
    </div>
  )
}

/* ------------------------------------------------------ 產品特性分析 view */

function ProductAnalysis({ product, meta, refresh }) {
  const { busy, error, run } = useAsyncAction()
  const a = product.analysis

  const analyse = () => run(async () => {
    await growth.analyseProduct(product.id)
    refresh()
  })

  if (!a) {
    return (
      <div className="ghos-panel">
        <p className="muted">尚未執行特性分析。分析會產出：宣稱面與受監管領域、內容可用的產品角色、各平台的 CTA 可行性與歸因方式、以及是否具備跑出可評估實驗的條件。</p>
        <button className="primary" disabled={busy} onClick={analyse}>{busy ? '分析中…' : '執行產品特性分析'}</button>
        <ErrorNote error={error} />
      </div>
    )
  }

  return (
    <div className="ghos-panel stack">
      <div className="row">
        <Badge tone={a.readiness.ready ? 'good' : 'warn'}>{a.readiness.ready ? '具備跑實驗的條件' : `${a.readiness.blockingGaps.length} 項阻擋`}</Badge>
        <Badge>分析版本 {a.analysisVersion}</Badge>
        {a.policyVersion && <Badge>policy {a.policyVersion}</Badge>}
        <div className="spacer" style={{ marginLeft: 'auto' }} />
        <button disabled={busy} onClick={analyse}>{busy ? '重新分析中…' : '重新分析'}</button>
      </div>
      <ErrorNote error={error} />

      <section>
        <h4>準備度 gate</h4>
        <GateList gates={a.readiness.gates.map((g) => ({ ...g, result: g.passed ? 'pass' : g.blocking ? 'blocking' : 'warning', label: g.gate }))} />
      </section>

      <div className="grid two">
        <section>
          <h4>宣稱面與風險</h4>
          {a.claimSurface.domains.length === 0 ? (
            <p className="muted small">產品文案未觸及任何受監管領域。</p>
          ) : (
            <ul className="ghos-list">
              {a.claimSurface.domains.map((d) => (
                <li key={d.domain}>
                  <Badge tone={d.alwaysHumanReview ? 'bad' : 'warn'}>{d.domain}</Badge>
                  <span className="small muted"> 命中詞：{d.matchedTerms.join('、')}</span>
                  {d.alwaysHumanReview && <div className="small warn-text">此領域一律需人工審查，不得自動核准。</div>}
                </li>
              ))}
            </ul>
          )}
          <div className="row small muted" style={{ marginTop: 6 }}>
            <span>最低年齡 {a.claimSurface.minAge ?? '未設'}</span>
            <span>需人工審查：{a.claimSurface.requiresHumanReview ? '是' : '否'}</span>
          </div>
        </section>

        <section>
          <h4>宣稱與證據</h4>
          {a.proofObligations.length === 0 ? <p className="muted small">未登記任何宣稱。</p> : (
            <ul className="ghos-list">
              {a.proofObligations.map((o, i) => (
                <li key={i}>
                  <Badge tone={o.status === 'evidenced' ? 'good' : o.status === 'needs_evidence' ? 'bad' : ''}>
                    {{ evidenced: '有證據', needs_evidence: '缺證據', descriptive: '描述性' }[o.status]}
                  </Badge>
                  <div>{o.claim}</div>
                  <div className="small muted">{o.note}</div>
                </li>
              ))}
            </ul>
          )}
          {a.blockedClaims.length > 0 && (
            <div className="alert warn" style={{ marginTop: 8 }}>
              以下宣稱在補上 proof point 前不得出現在內容中：{a.blockedClaims.join('、')}
            </div>
          )}
        </section>
      </div>

      <section>
        <h4>產品在內容中可扮演的角色</h4>
        <div className="ghos-roles">
          {a.productRoles.map((r) => (
            <div key={r.role} className={`ghos-role ${r.status}`}>
              <div className="row" style={{ gap: 6 }}>
                <strong>{meta.productRoles[r.role]?.label ?? r.role}</strong>
                <Badge tone={r.status === 'declared' ? 'good' : r.status === 'declared_unsupported' ? 'bad' : r.status === 'candidate' ? 'accent' : ''}>
                  {{ declared: '已指定', declared_unsupported: '已指定但缺依據', candidate: '可考慮', unlikely: '不建議' }[r.status]}
                </Badge>
              </div>
              <p className="small muted">{r.because}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4>下發平臺與歸因方式</h4>
        <div className="scroll-x">
          <table>
            <thead><tr><th>平台</th><th>可用</th><th>自動化</th><th>歸因方式</th><th>需 AI 揭露</th><th>備註</th></tr></thead>
            <tbody>
              {a.distribution.map((d) => (
                <tr key={d.platform}>
                  <td>{d.label}</td>
                  <td>{d.allowed ? <Badge tone="good">可</Badge> : <Badge tone="bad">封鎖</Badge>}</td>
                  <td className="small">{d.automation === 'api' ? '有 API' : '僅人工'}</td>
                  <td className="small">{d.attributionMode === 'direct_click' ? '可直接量測點擊' : '需 referral code / bio 連結'}</td>
                  <td>{d.disclosureRequired ? '是' : '否'}</td>
                  <td className="small muted">{d.blockedReason ?? d.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid two">
        <section>
          <h4>可用的內容切角（Opportunity 種子）</h4>
          {a.angleFamilies.length === 0 ? <p className="muted small">尚未有可衍生的切角——先補齊差異點、已知反對意見或目標受眾。</p> : (
            <ul className="ghos-list">
              {a.angleFamilies.map((f, i) => (
                <li key={i}>
                  <Badge tone="accent">{f.family}</Badge> <span>{f.seed}</span>
                  <div className="small muted">{f.hint}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h4>量測方式</h4>
          <ul className="ghos-list">
            {a.measurement.conversionEvents.map((c) => (
              <li key={c.eventName}>
                <strong>{c.eventName}</strong> {c.isPrimary && <Badge tone="good">primary</Badge>}
                <div className="small muted">類型 {c.eventType}｜最低評估樣本 {c.minSampleForEvaluation}</div>
              </li>
            ))}
            {a.measurement.conversionEvents.length === 0 && <li className="muted small">尚未定義 conversion event。</li>}
          </ul>
          <div className="small muted" style={{ marginTop: 6 }}>
            歸因優先序：{a.measurement.attributionPriority.join(' → ')}
          </div>
          <DefineConversion productId={product.id} meta={meta} refresh={refresh} />
        </section>
      </div>
    </div>
  )
}

function DefineConversion({ productId, meta, refresh }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ eventName: '', displayName: '', eventType: 'signup', isPrimary: true, minSampleForEvaluation: 30 })
  const { busy, error, run } = useAsyncAction()

  if (!open) return <button style={{ marginTop: 8 }} onClick={() => setOpen(true)}>新增 conversion event</button>

  return (
    <div className="ghos-panel" style={{ marginTop: 8 }}>
      <Field label="事件名稱（產品端送出的名稱）"><input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} placeholder="signup" /></Field>
      <Field label="顯示名稱"><input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="註冊" /></Field>
      <Field label="事件類型">
        <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
          {meta.conversionEventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="最低評估樣本" hint="低於這個數量時 evaluator 一律回傳 NEEDS_MORE_DATA，不會硬選 Winner。">
        <input type="number" value={form.minSampleForEvaluation} onChange={(e) => setForm({ ...form, minSampleForEvaluation: Number(e.target.value) })} />
      </Field>
      <label className="row small"><input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} style={{ width: 'auto' }} /> 設為 primary conversion</label>
      <ErrorNote error={error} />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="primary" disabled={busy} onClick={() => run(async () => { await growth.defineConversion(productId, form); setOpen(false); refresh() })}>儲存</button>
        <button onClick={() => setOpen(false)}>取消</button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------- create product */

function CreateProduct({ meta, onDone }) {
  const [form, setForm] = useState({
    name: '', businessModel: 'content_platform', valueProposition: '', primaryDomain: '', owner: '',
    policyProfileId: 'standard-consumer',
    targetAudience: '', differentiators: '', proofPoints: '', knownObjections: '',
  })
  const { busy, error, run } = useAsyncAction()
  const lines = (s) => String(s).split('\n').map((x) => x.trim()).filter(Boolean)

  return (
    <div className="ghos-panel stack" style={{ marginBottom: 12 }}>
      <div className="grid two">
        <Field label="產品名稱"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="負責人"><input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></Field>
        <Field label="商業模式">
          <select value={form.businessModel} onChange={(e) => setForm({ ...form, businessModel: e.target.value })}>
            {meta.businessModels.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Policy profile" hint="決定可推廣地區、年齡、受限 claim 與是否允許自動核准。未指定時系統以最嚴格的 profile 代入。">
          <select value={form.policyProfileId} onChange={(e) => setForm({ ...form, policyProfileId: e.target.value })}>
            {meta.policyProfiles.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="核心價值主張" hint="Opportunity 判斷產品相關性時會用到這一句。">
        <textarea rows={2} value={form.valueProposition} onChange={(e) => setForm({ ...form, valueProposition: e.target.value })} />
      </Field>
      <Field label="Landing / deep-link domain" hint="沒有它就無法產生 tracking link，所有轉換都會是 unattributed。">
        <input value={form.primaryDomain} onChange={(e) => setForm({ ...form, primaryDomain: e.target.value })} placeholder="https://…" />
      </Field>
      <div className="grid two">
        <Field label="目標受眾（一行一項）"><textarea rows={3} value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} /></Field>
        <Field label="差異點（一行一項）"><textarea rows={3} value={form.differentiators} onChange={(e) => setForm({ ...form, differentiators: e.target.value })} /></Field>
        <Field label="可引用的證據 proof points（一行一項）" hint="沒有 proof point 的結果型宣稱會被列為 blocked claim。">
          <textarea rows={3} value={form.proofPoints} onChange={(e) => setForm({ ...form, proofPoints: e.target.value })} />
        </Field>
        <Field label="已知反對意見（一行一項）" hint="這些是 Controversy Engine 最好用的題材來源。">
          <textarea rows={3} value={form.knownObjections} onChange={(e) => setForm({ ...form, knownObjections: e.target.value })} />
        </Field>
      </div>
      <ErrorNote error={error} />
      <div className="row">
        <button className="primary" disabled={busy} onClick={() => run(async () => {
          await growth.createProduct({
            ...form,
            targetAudience: lines(form.targetAudience),
            differentiators: lines(form.differentiators),
            proofPoints: lines(form.proofPoints),
            knownObjections: lines(form.knownObjections),
          })
          onDone()
        })}>{busy ? '建立中…' : '建立產品'}</button>
      </div>
    </div>
  )
}
