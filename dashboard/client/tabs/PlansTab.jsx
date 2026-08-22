import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Alert, Loading, Badge, Empty } from '../components/ui.jsx'
import { ScoreRow, RedlinePanel, CalibrationTag } from '../components/notes.jsx'

/**
 * docs/11 §8 — 5–10 screened plans for one KOL.
 *
 * The disclaimer at the top is not decoration. Bakshy et al. (2011) found that
 * which particular piece of content produces a large cascade is relatively
 * unpredictable; a screen that ranks plans without saying so invites people to
 * read the order as a forecast.
 */
export default function PlansTab({ kols, regions, notes }) {
  const [kolId, setKolId] = useState(kols[0]?.id ?? '')
  const [region, setRegion] = useState('TW')
  const [count, setCount] = useState(8)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { if (!kolId && kols.length) setKolId(kols[0].id) }, [kols])

  const run = async () => {
    setBusy(true); setError(null)
    try {
      setData(await api.generatePlans({ kolId, region, count: Number(count) }))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="plans">
      <Card title="產生內容企劃" note="每個企劃都會綁定既有支柱、宣告單一主任務，並通過紅線 gate。">
        <div className="row controls">
          <label>KOL
            <select value={kolId} onChange={(e) => setKolId(e.target.value)}>
              {kols.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </label>
          <label>地區
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {(regions ?? []).map((r) => <option key={r.key} value={r.key}>{r.label ?? r.key}</option>)}
            </select>
          </label>
          <label>數量
            <input type="number" min="5" max="10" value={count} onChange={(e) => setCount(e.target.value)} />
          </label>
          <button className="primary" onClick={run} disabled={busy || !kolId}>{busy ? '產生中…' : '產生'}</button>
        </div>
        {error && <Alert tone="bad">{error}</Alert>}
        {busy && <Loading />}
      </Card>

      {data && (
        <>
          <Alert tone="info">{data.disclaimer}</Alert>

          {data.kol.credibilityMode === 'embodied' && (
            <Alert tone="warn">
              這位 KOL 宣告為具身經驗型。凡是需要「我親身在場」的題目都會被要求逐題確認——
              因為這是一個 AI 角色，那類主張無法查證。
            </Alert>
          )}

          {!data.coverage.satisfied && <Alert tone="warn">{data.coverage.message}</Alert>}

          <div className="plan-grid">
            {data.plans.map((p) => <PlanCard key={p.id} plan={p} notes={notes} />)}
          </div>

          {data.semanticChecklist?.length > 0 && (
            <Card title={`每則都要看的 ${data.semanticChecklist.length} 條檢查`} note={data.semanticChecklistNote}>
              <ul className="standing-list">
                {data.semanticChecklist.map((s) => (
                  <li key={s.id}>
                    <strong>{s.id}</strong> · {s.title}
                    <p>{s.whyPlain}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.rejected.length > 0 && (
            <Card title={`被排除的 ${data.rejected.length} 個候選`} note="列出來是為了讓你看到系統拿掉了什麼，而不是讓清單默默變短。">
              <ul className="rejected">
                {data.rejected.slice(0, 20).map((r, i) => (
                  <li key={i}><strong>{r.topicTag}</strong> — {r.reason}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {!data && !busy && <Empty>選一位 KOL 和地區，按「產生」。</Empty>}
    </div>
  )
}

function PlanCard({ plan, notes }) {
  const noteFor = (k) => notes?.[k] ?? null
  return (
    <Card
      className="plan-card"
      title={<>{plan.topicTag} <Badge tone={plan.experimentBand ? 'warn' : ''}>{plan.band.label}</Badge></>}
      note={plan.topic}
    >
      <div className="plan-task">
        <Badge tone="ok">主任務：{plan.primaryTaskLabel}</Badge>
        <p className="why">{plan.taskWhy}</p>
        {plan.taskCaution && <Alert tone="warn">{plan.taskCaution}</Alert>}
      </div>

      <dl className="plan-shape">
        <dt>支柱</dt><dd>{plan.pillar ?? '—'}</dd>
        <dt>前 3 秒</dt><dd>{plan.hookShape}</dd>
        <dt>結尾</dt><dd>{plan.ctaShape}</dd>
        {plan.angle && (<><dt>切角</dt><dd>{plan.angle}</dd></>)}
      </dl>

      {plan.experimentBand && (
        <Alert tone="warn">
          這一則的人設契合落在我們自己畫的底線附近。我們讓它上線，是為了知道這條線畫得對不對。
        </Alert>
      )}

      <div className="dims">
        {['fit', 'pillar', 'homophily'].map((k) => {
          const d = plan.dimensions?.[k]
          if (!d) return null
          return (
            <ScoreRow
              key={k}
              label={d.noteSummary?.label ?? k}
              score={d.score}
              note={noteFor(k)}
              tone={d.score == null ? '' : d.score >= 65 ? 'good' : d.score >= 45 ? 'warn' : 'bad'}
            />
          )
        })}
      </div>

      <div className="timing">
        <span>{plan.timing?.label}：{plan.timing?.value ?? '—'}</span>
        <CalibrationTag value="prior" />
        <p className="caveat">{plan.timing?.caveat}</p>
      </div>

      {plan.weakestDimension && (
        <p className="weakest">最短板：{plan.weakestDimension.label}（{plan.weakestDimension.score}）——分帶把三維平均了，這一項不要被平均掉。</p>
      )}

      <RedlinePanel warnings={plan.warnings} lintHits={plan.lintHits} compact />
    </Card>
  )
}
