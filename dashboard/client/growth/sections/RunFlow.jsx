import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { Field, useAsyncAction, ErrorNote, GateList, usd } from '../components.jsx'

/**
 * ▶ 開始一輪 — the operator's actual job, as one line.
 *
 *   找事件 → 確認切入點 → 選人設生素材 → 檢查 → 發布
 *
 * The other ten sections are the instrument panel; this is the steering wheel.
 * Two rules it exists to enforce:
 *
 * 1. The system drafts, the human edits. Every field arrives pre-written from
 *    the product's own declared facts. A blank box is the tool asking the
 *    operator to do its work.
 * 2. Only one step is on screen at a time, and each step ends in exactly one
 *    obvious button.
 */

const STEPS = [
  { key: 'event', n: 1, label: '找事件' },
  { key: 'angle', n: 2, label: '確認切入點' },
  { key: 'make', n: 3, label: '生素材' },
  { key: 'check', n: 4, label: '檢查' },
  { key: 'publish', n: 5, label: '發布' },
]

export default function RunFlow({ meta, productId, products, refresh, onGoto }) {
  const [step, setStep] = useState('event')
  const [draft, setDraft] = useState(null)
  const [opportunity, setOpportunity] = useState(null)
  const [experiment, setExperiment] = useState(null)

  const product = products.find((p) => p.productId === productId)

  if (!productId) {
    return (
      <Card title="先選一個產品">
        <p>右上角的「產品」下拉選單選一個，這一頁就會帶你從找事件一路走到發布。</p>
        {products.length === 0 && <Empty>還沒有任何產品。到「00 產品狀態」建一個。</Empty>}
      </Card>
    )
  }

  const reached = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="stack">
      <ol className="ghos-steps">
        {STEPS.map((s, i) => (
          <li key={s.key} className={i === reached ? 'on' : i < reached ? 'done' : ''}>
            <button onClick={() => i <= reached && setStep(s.key)} disabled={i > reached}>
              <span className="n">{s.n}</span> {s.label}
            </button>
          </li>
        ))}
      </ol>

      {step === 'event' && (
        <StepEvent
          productId={productId}
          product={product}
          onPick={(d) => { setDraft(d); setStep('angle') }}
        />
      )}
      {step === 'angle' && draft && (
        <StepAngle
          signal={draft}
          productId={productId}
          meta={meta}
          onBack={() => setStep('event')}
          onDone={(o) => { setOpportunity(o); setStep('make') }}
        />
      )}
      {step === 'make' && opportunity && (
        <StepMake
          opportunity={opportunity}
          draft={draft}
          meta={meta}
          onDone={(e) => { setExperiment(e); setStep('check'); refresh() }}
        />
      )}
      {step === 'check' && experiment && (
        <StepCheck experiment={experiment} meta={meta} onDone={() => { setStep('publish'); refresh() }} />
      )}
      {step === 'publish' && experiment && (
        <StepPublish experiment={experiment} meta={meta} onGoto={onGoto} refresh={refresh} />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────── 1 找事件 */

function StepEvent({ productId, product, onPick }) {
  const [signals, setSignals] = useState(null)
  const [query, setQuery] = useState('')
  const [scanned, setScanned] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const { busy, error, run } = useAsyncAction()

  const load = () => {
    growth.signals({ limit: 80, productId }).then((d) => setSignals(d.signals)).catch(() => setSignals([]))
  }
  useEffect(() => { load() }, [productId])

  const scan = (region) => run(async () => {
    const q = query.trim()
    const r = await growth.scanSignals({ region, sources: q ? ['news'] : ['news', 'social_trend'], limit: 20, query: q || null })
    setScanned(r)
    load()
  })

  const usable = (signals ?? []).filter((s) => s.relevance?.connects)
  const rest = (signals ?? []).filter((s) => !s.relevance?.connects)

  return (
    <Card
      title="① 找一個能接你產品的事件"
      note="清單只留下「跟你登記的差異點／反對意見有共同語彙」的事件。接不上的收在下面，不用一則一則看。"
    >
      <div className="row" style={{ marginBottom: 10 }}>
        <input
          style={{ flex: 1, minWidth: 240 }}
          placeholder="關鍵字，例如：AI API 定價 / OpenAI 漲價 / token 成本"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && scan('TW')}
        />
        {['TW', 'US', 'JP'].map((r) => (
          <button key={r} className={r === 'TW' ? 'primary' : ''} disabled={busy} onClick={() => scan(r)}>
            {busy ? '搜尋中…' : `搜 ${r} 新聞`}
          </button>
        ))}
      </div>
      <div className="muted small" style={{ marginBottom: 10 }}>
        利基型產品幾乎一定要填關鍵字——不填會抓地區熱門標籤，那些多半跟你的產品無關。
      </div>
      <ErrorNote error={error} />
      {scanned && (
        <div className="alert info small">
          新增 {scanned.ingested} 則、重複 {scanned.duplicates} 則
          {scanned.failures?.length > 0 && `，${scanned.failures.length} 個來源失敗`}
        </div>
      )}

      {!signals ? <Loading /> : usable.length === 0 ? (
        <Empty>
          目前沒有能接上這個產品的事件。<br />
          用上面的關鍵字搜一次新聞——{product?.name} 這種產品建議搜「AI API 定價」「模型 漲價」「訂閱 成本」之類的詞。
        </Empty>
      ) : (
        <div className="stack">
          {usable.map((s) => (
            <div key={s.id} className="list-row" onClick={() => onPick(s)} style={{ alignItems: 'flex-start' }}>
              <Badge tone="good">可接</Badge>
              <div className="grow">
                <div className="title">{s.title}</div>
                <div className="sub">{s.relevance.verdict}</div>
                <div className="sub muted">
                  {s.freshness.label}
                  {s.corroboration > 1 && `｜${s.corroboration} 個來源`}
                  {s.opportunityCount > 0 && `｜已建過 ${s.opportunityCount} 個題目`}
                </div>
              </div>
              <button className="primary">用這則 →</button>
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button className="ghos-link" onClick={() => setShowAll(!showAll)}>
            {showAll ? '收起' : `另有 ${rest.length} 則接不上這個產品的事件`}
          </button>
          {showAll && (
            <ul className="ghos-list small" style={{ maxHeight: 220, overflowY: 'auto', marginTop: 6 }}>
              {rest.map((s) => (
                <li key={s.id}>
                  <span className="muted">{s.title.slice(0, 60)}</span>
                  <button className="ghos-link" style={{ marginLeft: 8 }} onClick={() => onPick(s)}>還是要用</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}

/* ─────────────────────────────────────────── 2 確認切入點 */

function StepAngle({ signal, productId, meta, onBack, onDone }) {
  const [d, setD] = useState(null)
  const [form, setForm] = useState(null)
  const [failed, setFailed] = useState(null)
  const { busy, error, run } = useAsyncAction()

  useEffect(() => {
    // Signals are not product-scoped, so the product id comes from the page,
    // not from the signal row.
    growth.draftOpportunity(signal.id, productId).then((x) => {
      setD(x)
      setForm({
        topic: x.topic, whyNow: x.whyNow, tension: x.tension,
        productRelevance: x.productRelevance, relevanceAnchor: x.relevanceAnchor,
        riskFlags: x.suggestedRiskFlags, claimDomains: x.suggestedClaimDomains,
      })
    }).catch((e) => setFailed(e.message))
  }, [signal.id, productId])

  if (failed) {
    return (
      <Card title="② 確認切入點" actions={<button onClick={onBack}>← 換一則事件</button>}>
        <div className="alert bad">草擬失敗：{failed}</div>
      </Card>
    )
  }
  if (!d || !form) return <Loading>正在依你的產品事實草擬切入點…</Loading>
  const toggle = (k, v) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }))

  return (
    <Card title="② 確認切入點" note={d.caveat} actions={<button onClick={onBack}>← 換一則事件</button>}>
      <div className="alert info small">
        <strong>來源事件：</strong>
        {d.signalUrl ? <a href={d.signalUrl} target="_blank" rel="noreferrer">{d.signalTitle}</a> : d.signalTitle}
        <div>{d.relevance.verdict}</div>
      </div>

      <Field label="題目"><input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></Field>
      <Field label="為什麼是現在" hint="系統依事件時效草擬。若你有更具體的理由（受眾此刻在吵什麼），改掉它。">
        <textarea rows={2} value={form.whyNow} onChange={(e) => setForm({ ...form, whyNow: e.target.value })} />
      </Field>
      <Field
        label="對立"
        hint={d.needsEdit.tension
          ? '⚠ 產品還沒登記足夠的反對意見／差異點，這一欄機器給不出形狀，要你自己寫。'
          : '機器只能給形狀——把兩邊的說法擺出來。真正的論點要你下。'}
      >
        <textarea rows={3} value={form.tension} onChange={(e) => setForm({ ...form, tension: e.target.value })} />
      </Field>
      <Field label="產品相關性" hint="這一欄決定內容是不是硬蹭。系統已指出用哪一條產品事實去接。">
        <textarea rows={3} value={form.productRelevance} onChange={(e) => setForm({ ...form, productRelevance: e.target.value })} />
      </Field>

      <div className="row" style={{ marginBottom: 10 }}>
        <span className="small muted">風險旗標：</span>
        {Object.entries(meta.riskFlags).map(([k, v]) => (
          <span key={k} className={`chip selectable ${form.riskFlags.includes(k) ? 'on' : ''}`} title={v.hint} onClick={() => toggle('riskFlags', k)}>{v.label}</span>
        ))}
      </div>
      {form.claimDomains.length > 0 && (
        <div className="alert warn small">
          這題被標為受監管領域（{form.claimDomains.join('、')}），素材會強制人工審查。若你的內容其實不做這類主張，點掉它：
          <div className="row" style={{ marginTop: 6 }}>
            {form.claimDomains.map((c) => (
              <span key={c} className="chip on selectable" onClick={() => toggle('claimDomains', c)}>{c} ✕</span>
            ))}
          </div>
        </div>
      )}

      <ErrorNote error={error} />
      <button className="primary" disabled={busy} onClick={() => run(async () => {
        const o = await growth.createOpportunity({
          ...form, productId: d.productId, signalId: d.signalId, evidence: d.evidence,
        })
        onDone({ ...o, hooks: d.hooks, suggestedProductRole: d.suggestedProductRole })
      })}>{busy ? '建立中…' : '確認，去選人設 →'}</button>
    </Card>
  )
}

/* ────────────────────────────────────────── 3 選人設生素材 */

function StepMake({ opportunity, meta, onDone }) {
  const [routed, setRouted] = useState(null)
  const [picked, setPicked] = useState(null)
  const [hooks, setHooks] = useState(opportunity.hooks ?? ['', ''])
  const [platform, setPlatform] = useState('threads')
  const [narrative, setNarrative] = useState(meta.defaultNarrative ?? 'framework')
  const [cta, setCta] = useState('到站上用同一組 key 直接比一次')
  const { busy, error, run } = useAsyncAction()

  useEffect(() => {
    growth.route(opportunity.id).then((r) => {
      setRouted(r)
      setPicked(r.candidates.find((c) => c.eligible)?.personaId ?? null)
    })
  }, [opportunity.id])

  if (!routed) return <Loading>正在挑適合這題的人設…</Loading>
  const eligible = routed.candidates.filter((c) => c.eligible)

  return (
    <Card title="③ 選人設，生兩支不同開場的素材" note="這一輪只比「開場（hook）」，其他條件兩支完全相同——這樣贏了才知道是贏在哪。">
      {eligible.length === 0 ? (
        <Empty>沒有可用的人設。多半是這題涉及受監管領域，而人設的可信度來自親身經歷（AI 人設無法背書）。回上一步把 claim 領域點掉，或換一題。</Empty>
      ) : (
        <>
          <div className="stack" style={{ marginBottom: 12 }}>
            {eligible.slice(0, 4).map((c) => (
              <div key={c.personaId} className={`list-row ${picked === c.personaId ? 'on' : ''}`} onClick={() => setPicked(c.personaId)}>
                {c.avatar && <img src={c.avatar} alt="" className="ghos-avatar" />}
                <div className="grow">
                  <div className="title">{c.name} <Badge>{c.credibilityMode}</Badge></div>
                  <div className="sub">{c.evidence[0]?.says ?? '沒有既有證據支持這個配對，屬於探索性選擇。'}</div>
                  {c.cautions.length > 0 && <div className="sub warn-text">{c.cautions[0].says}</div>}
                </div>
              </div>
            ))}
          </div>

          <Field label="敘事結構" hint={meta.narrativeShapes?.[narrative]?.says}>
            <select value={narrative} onChange={(e) => setNarrative(e.target.value)}>
              {Object.entries(meta.narrativeShapes ?? {}).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <div className="grid two">
            <Field label="平台">
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {meta.platformIds.map((p) => <option key={p} value={p}>{meta.platforms[p].label}</option>)}
              </select>
            </Field>
            <Field label="CTA（兩支相同）"><input value={cta} onChange={(e) => setCta(e.target.value)} /></Field>
          </div>
          <Field label="開場 A" hint="系統依你的反對意見草擬"><input value={hooks[0] ?? ''} onChange={(e) => setHooks([e.target.value, hooks[1]])} /></Field>
          <Field label="開場 B" hint="系統依你的差異點草擬"><input value={hooks[1] ?? ''} onChange={(e) => setHooks([hooks[0], e.target.value])} /></Field>

          <ErrorNote error={error} />
          <button className="primary" disabled={busy || !picked || !hooks[0] || !hooks[1]} onClick={() => run(async () => {
            const exp = await growth.createExperiment({
              productId: opportunity.productId,
              campaignId: opportunity.campaignId,
              opportunityId: opportunity.id,
              hypothesis: `用「${hooks[0].slice(0, 24)}」當開場，會比用「${hooks[1].slice(0, 24)}」帶來更多點擊。`,
              comparisonDimension: 'hook',
              primaryOutcome: 'click',
              observationWindowHours: 72,
            })
            const base = {
              personaId: picked, format: meta.platforms[platform].formats[0], platform, cta,
              productRole: opportunity.suggestedProductRole ?? null,
              narrative,
            }
            await growth.addArm(exp.id, { ...base, hook: hooks[0] })
            await growth.addArm(exp.id, { ...base, hook: hooks[1] })
            await growth.generate(exp.id, { adapterId: 'template' })
            onDone(await growth.experiment(exp.id))
          })}>{busy ? '生成中…' : '建立實驗並生成素材 →'}</button>
        </>
      )}
    </Card>
  )
}

/* ─────────────────────────────────────────────── 4 檢查 */

function StepCheck({ experiment, onDone }) {
  const [rows, setRows] = useState(null)
  const { busy, error, run } = useAsyncAction()

  const load = () => {
    Promise.all(experiment.arms.flatMap((a) => a.assets.map((as) => growth.runGate(as.id))))
      .then(setRows).catch(() => setRows([]))
  }
  useEffect(() => { load() }, [experiment.id])

  if (!rows) return <Loading>正在跑檢查鏈…</Loading>
  const blocked = rows.filter((r) => r.verdict === 'blocked')
  const needHuman = rows.filter((r) => r.verdict === 'review_required')

  return (
    <Card title="④ 檢查" note="紅線第一層是關鍵字比對，不是判定。標為「需人工」的每一條都要你看過才算數。">
      <ErrorNote error={error} />
      {rows.map((r, i) => (
        <div key={i} className="ghos-panel">
          <div className="row">
            <Badge tone={r.verdict === 'blocked' ? 'bad' : r.verdict === 'review_required' ? 'warn' : 'good'}>
              {{ blocked: '被擋下', review_required: '需人工確認', auto_approvable: '可放行' }[r.verdict]}
            </Badge>
            <span className="muted small">{r.summary}</span>
          </div>
          {r.asset?.text && <pre className="ghos-pre">{r.asset.text}</pre>}
          <GateList gates={[...r.blocking, ...r.needsHuman, ...r.warnings]} />
        </div>
      ))}

      {blocked.length > 0 && (
        <div className="alert bad">有 {blocked.length} 則被擋下。回上一步改掉問題，或到「09 審查與合規」逐條處理。</div>
      )}

      <button className="primary" disabled={busy || blocked.length > 0} onClick={() => run(async () => {
        for (const r of rows) {
          await growth.decide(r.asset.id, {
            decision: 'approved', reasonCode: 'OK',
            notes: '操作者於引導流程逐條確認：無具身主張、無保證性用語、無捏造來源，發布時將開啟平台 AI 標示。',
          })
        }
        onDone()
      })}>
        {busy ? '送出中…' : `我已逐條看過，全部核准（${needHuman.length} 項需人工確認）→`}
      </button>
    </Card>
  )
}

/* ─────────────────────────────────────────────── 5 發布 */

function StepPublish({ experiment, meta, onGoto, refresh }) {
  const [accounts, setAccounts] = useState(null)
  const { busy, error, run } = useAsyncAction()

  useEffect(() => { growth.accounts().then((d) => setAccounts(d.accounts)) }, [])
  if (!accounts) return <Loading />

  const platform = experiment.arms[0]?.platform
  const usable = accounts.filter((a) => a.platform === platform && a.status === 'active')

  return (
    <Card title="⑤ 發布" note="目前所有平台都是「你去發，回來登錄」。系統不會替你發文，也不會假裝發過。">
      <ErrorNote error={error} />
      {usable.length === 0 ? (
        <div className="alert warn">
          還沒有登記 {meta.platforms[platform]?.label} 的帳號。到「06 下發」登記一個（只填 handle 與環境變數名稱，不要填實際 token），再回來這裡。
          <div style={{ marginTop: 8 }}><button onClick={() => onGoto('distribution')}>前往 06 下發 →</button></div>
        </div>
      ) : (
        <>
          <p className="small">
            兩支素材已核准。按下面的按鈕會建立 publication 並簽發追蹤碼——把追蹤碼帶進貼文的 CTA 連結，
            之後的轉換才追得回來。
          </p>
          <button className="primary" disabled={busy} onClick={() => run(async () => {
            for (const arm of experiment.arms) {
              const asset = arm.assets.find((a) => a.reviewStatus === 'approved')
              if (asset) await growth.schedulePublication({ assetId: asset.id, socialAccountId: usable[0].id })
            }
            refresh()
            onGoto('distribution')
          })}>{busy ? '建立中…' : '建立 publication 並取得追蹤連結 →'}</button>
        </>
      )}
      <div className="small muted" style={{ marginTop: 10 }}>
        發完之後：到「06 下發」登錄貼文 URL 與成效數字，資料回來後在「03 實驗室」按一次評估。
      </div>
    </Card>
  )
}
