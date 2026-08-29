import React from 'react'
import { Card, Badge, Empty } from '../../components/ui.jsx'
import { Metric, MetricRow, AttributionBar, usd, int, rate } from '../components.jsx'

/**
 * 01 指揮中心 — DASHBOARD_SPEC.md §3.
 *
 * Top cards, the acquisition funnel, and the list of experiments that need
 * someone to do something. The funnel is drawn only from what was actually
 * measured; a stage with no data reads as "尚未量到", never as zero.
 */
export default function CommandCenter({ overview, products, productId, onGoto }) {
  const scoped = productId ? products.filter((p) => p.productId === productId) : products
  const sum = (f) => scoped.reduce((a, p) => a + (Number(f(p)) || 0), 0)

  const funnel = [
    { key: 'impressions', label: '曝光', value: sum((p) => p.economics.impressions) },
    { key: 'clicks', label: '點擊', value: sum((p) => p.economics.clicks) },
    { key: 'conversions', label: '歸因轉換', value: sum((p) => p.economics.conversions) },
  ]
  const maxStage = Math.max(...funnel.map((f) => f.value), 1)

  const actions = buildActionList(overview, scoped)

  return (
    <div className="stack">
      <Card title="整體狀態" note="Winner yield 只在同一定義、同一觀測窗下才可比較；資料不足時顯示「—」而非 0%。">
        <MetricRow>
          <Metric label="進行中實驗" value={int(overview.experiments.active)} />
          <Metric label="可評估實驗" value={int(overview.experiments.evaluable)} />
          <Metric label="Winner" value={int(overview.winners.count)} hint={overview.winners.yieldBasis} />
          <Metric label="Winner yield" value={overview.winners.yield == null ? '—' : rate(overview.winners.yield, 0)} hint={overview.winners.yield == null ? '尚無可評估實驗' : null} />
          <Metric label="待審查" value={int(overview.experiments.awaitingReview)} tone={overview.experiments.awaitingReview ? 'warn' : ''} />
          <Metric label="資料不足" value={int(overview.experiments.needsMoreData)} />
          <Metric label="待複製的 Winner" value={int(overview.winners.awaitingClone)} tone={overview.winners.awaitingClone ? 'warn' : ''} />
          <Metric label="總成本" value={usd(overview.cost.totalUsd)} hint={overview.cost.estimatedPortionUsd > 0 ? `其中 ${usd(overview.cost.estimatedPortionUsd)} 為推估` : null} />
          <Metric label="歸因價值" value={usd(overview.attribution.attributedValue)} />
          <Metric label="事故" value={int(overview.incidents.total)} tone={overview.incidents.open ? 'bad' : ''} hint={`${overview.incidents.open} 件未結案`} />
          <Metric
            label="訊號→發布中位數"
            value={overview.latency.medianHours == null ? '—' : `${overview.latency.medianHours}h`}
            hint={overview.latency.sampleCount ? `n=${overview.latency.sampleCount}，p90 ${overview.latency.p90Hours}h` : '尚無已發布且可回溯到訊號的內容'}
          />
        </MetricRow>
      </Card>

      <div className="grid two">
        <Card title="獲客漏斗" note="只畫實際量到的階段。某一階段顯示「—」代表沒有資料，不代表是 0。">
          <div className="ghos-funnel">
            {funnel.map((f, i) => {
              const prev = i > 0 ? funnel[i - 1].value : null
              return (
                <div key={f.key} className="ghos-funnel-step">
                  <div className="row">
                    <span>{f.label}</span>
                    <strong className="mono" style={{ marginLeft: 'auto' }}>{f.value ? int(f.value) : '—'}</strong>
                  </div>
                  <div className="bar"><span style={{ width: `${(f.value / maxStage) * 100}%` }} /></div>
                  {prev != null && (
                    <div className="small muted">
                      轉換率 {prev ? rate(f.value / prev) : '—'}
                      {!prev && '（上一階段沒有資料，無法計算）'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="small muted" style={{ marginTop: 8 }}>
            產品端轉換來自 conversion event，社群數字來自平台回報——兩者不會互相推算。
          </div>
        </Card>

        <Card title="歸因覆蓋率" note="直接量測 / 模型歸因 / 無法歸因必須分開顯示，不得合併成一個「已歸因」數字。">
          <AttributionBar coverage={overview.attribution} />
        </Card>
      </div>

      <Card title="需要處理的事" note="每一列都指向一個具體動作。空的時候表示閉環目前沒有卡住。">
        {actions.length === 0 ? (
          <Empty>目前沒有待處理事項。</Empty>
        ) : (
          <div className="stack">
            {actions.map((a, i) => (
              <div key={i} className="list-row" onClick={() => onGoto(a.section)}>
                <Badge tone={a.tone}>{a.kind}</Badge>
                <div className="grow">
                  <div className="title">{a.what}</div>
                  <div className="sub">{a.how}</div>
                </div>
                <span className="muted small">前往 {a.sectionLabel} →</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="產品階段分布">
        <div className="row">
          {Object.entries(overview.products.byStage).filter(([, n]) => n > 0).map(([stage, n]) => (
            <Badge key={stage} tone={stage === 'compounding' ? 'good' : ''}>{stage}: {n}</Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}

/**
 * DASHBOARD_SPEC.md §3-B — the six categories of thing that needs a human.
 * Built from counters rather than a hand-maintained list so it cannot go stale.
 */
function buildActionList(overview, products) {
  const out = []

  if (overview.experiments.awaitingReview > 0) {
    out.push({ kind: '待審查', tone: 'warn', section: 'review', sectionLabel: '審查與合規',
      what: `${overview.experiments.awaitingReview} 個實驗有素材卡在審查`,
      how: '紅線語意層與 AI 揭露確認都必須由人逐條判斷，系統不會自行放行。' })
  }
  if (overview.winners.awaitingClone > 0) {
    out.push({ kind: 'Winner 待複製', tone: 'good', section: 'winners', sectionLabel: 'Winner 工廠',
      what: `${overview.winners.awaitingClone} 個 Winner 還沒有任何變體`,
      how: '選一個變異維度建立 child experiment——沒有這一步，AIGC 產能不會產生複利。' })
  }
  if (overview.experiments.needsMoreData > 0) {
    out.push({ kind: '資料不足', tone: 'accent', section: 'lab', sectionLabel: '實驗室',
      what: `${overview.experiments.needsMoreData} 個實驗判定為資料不足`,
      how: '確認觀測窗是否結束、成效是否已同步、轉換是否已回流。' })
  }
  if (overview.incidents.open > 0) {
    out.push({ kind: '事故', tone: 'bad', section: 'review', sectionLabel: '審查與合規',
      what: `${overview.incidents.open} 件未結案的政策事故`,
      how: '刪文、警告或帳號限制必須結案並記錄處置，否則同樣的錯會重複發生。' })
  }
  if (overview.cost.unknownModelRows > 0) {
    out.push({ kind: '成本待補', tone: 'warn', section: 'economics', sectionLabel: '單位經濟',
      what: `${overview.cost.unknownModelRows} 筆成本記錄的模型未登錄單價`,
      how: '在 cost-model.js 補上單價，或手動登錄實際費用——否則單位經濟會低估成本。' })
  }
  for (const p of products) {
    if (p.blockedBy && p.stage !== 'compounding') {
      out.push({ kind: '產品卡關', tone: '', section: 'products', sectionLabel: '產品狀態',
        what: `${p.name}：${p.blockedBy.what}`, how: p.blockedBy.how })
    }
  }
  return out
}
