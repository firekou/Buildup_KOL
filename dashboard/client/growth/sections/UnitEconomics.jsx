import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { Metric, MetricRow, Recommendation, useAsyncAction, ErrorNote, usd, int, rate } from '../components.jsx'

/**
 * 08 單位經濟 / AI Traffic Trader — DASHBOARD_SPEC.md §10.
 *
 * Content as a portfolio, sliced four ways, plus the AIGC cost strategy: the
 * ladder that says which tier of generation an idea has earned. A five-arm
 * video test costs ~$50 before a single view, so the ladder starts on text and
 * images and only buys video once a hook has cleared a cheaper round.
 */

const VIEWS = [
  { key: 'byPersona', label: '依人設' },
  { key: 'byTopic', label: '依題目' },
  { key: 'byPlatform', label: '依平台' },
  { key: 'byFamily', label: '依 Winner 家族' },
]

export default function UnitEconomics({ meta, productId }) {
  const [data, setData] = useState(null)
  const [view, setView] = useState('byPersona')
  const { error, setError } = useAsyncAction()

  useEffect(() => {
    setData(null)
    growth.unitEconomics(productId).then(setData).catch((e) => setError(e.message))
  }, [productId])

  if (!data) return <Loading />
  const rows = data[view] ?? []

  return (
    <div className="stack">
      <ErrorNote error={error} />

      <Card title="成本總覽" note={`目前 credit 方案：${meta.creditPlans[meta.activePlan]?.label}（每 credit $${meta.creditPlans[meta.activePlan]?.usdPerCredit}）。單價來源為 costs/video-generation-costs.md 的實際帳單記錄。`}>
        <MetricRow>
          <Metric label="總成本" value={usd(data.cost.totalUsd)} />
          <Metric label="總 credits" value={int(data.cost.totalCredits)} />
          <Metric label="成本筆數" value={int(data.cost.count)} />
          <Metric label="推估部分" value={usd(data.cost.estimatedPortionUsd)} tone={data.cost.estimatedPortionUsd > 0 ? 'warn' : ''} hint="非實際帳單，來自列表單價" />
          <Metric label="未登錄模型" value={int(data.cost.unknownModelRows)} tone={data.cost.unknownModelRows ? 'bad' : ''} hint={data.cost.unknownModelRows ? '這些成本尚未計入，單位經濟會低估' : null} />
        </MetricRow>
      </Card>

      <Card title="AIGC 成本階梯" note="這是成本策略本身：不同形式的邊際成本差 40 倍，所以先用最便宜的形式殺掉多數 Loser，再把預算集中在已經贏過一輪的想法上。">
        <div className="ghos-ladder">
          {data.ladder.map((t, i) => (
            <div key={t.tier} className="ghos-tier">
              <div className="row">
                <Badge tone={i === 0 ? 'good' : i === 1 ? 'warn' : 'bad'}>{t.label}</Badge>
                <span className="mono small">約 {t.typicalCreditsPerArm} credits / arm ≈ {usd(t.typicalCreditsPerArm * (meta.creditPlans[meta.activePlan]?.usdPerCredit ?? 0))}</span>
              </div>
              <p className="small">{t.says}</p>
              <p className="small muted">晉級條件：{t.promoteWhen}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="獲客組合"
        note="樣本不足時建議一律是「需重測」。SCALE / HOLD / REDUCE / STOP / RETEST 全部只是建議——本系統不會自動調整任何預算或產量。"
        actions={
          <div className="row">
            {VIEWS.map((v) => (
              <button key={v.key} className={view === v.key ? 'primary' : ''} onClick={() => setView(v.key)}>{v.label}</button>
            ))}
          </div>
        }
      >
        {rows.length === 0 ? <Empty>這個切面還沒有資料。</Empty> : (
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>{VIEWS.find((v) => v.key === view).label.slice(1)}</th>
                  <th className="num">實驗</th><th className="num">Winner</th>
                  <th className="num">曝光</th><th className="num">點擊</th><th className="num">CTR</th>
                  <th className="num">轉換</th><th className="num">轉換率</th>
                  <th className="num">成本</th><th className="num">每轉換成本</th>
                  <th className="num">歸因價值</th><th className="num">貢獻</th><th className="num">ROAS</th>
                  <th>建議</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td>
                      <strong>{r.label}</strong>
                      {r.generations != null && <div className="muted small">{r.generations + 1} 個世代</div>}
                      {r.fatigue?.detected && <div className="warn-text small">{r.fatigue.says}</div>}
                    </td>
                    <td className="num">{int(r.experimentCount)}</td>
                    <td className="num">{int(r.winners)}</td>
                    <td className="num">{r.impressions ? int(r.impressions) : '—'}</td>
                    <td className="num">{r.clicks ? int(r.clicks) : '—'}</td>
                    <td className="num">{r.ctr == null ? '—' : rate(r.ctr)}</td>
                    <td className="num">{int(r.conversions)}</td>
                    <td className="num">{r.conversionRate == null ? '—' : rate(r.conversionRate)}</td>
                    <td className="num">{usd(r.totalCostUsd)}</td>
                    <td className="num">{r.costPerConversion == null ? '—' : usd(r.costPerConversion)}</td>
                    <td className="num">{usd(r.attributedValueUsd)}</td>
                    <td className="num" style={{ color: r.contributionUsd > 0 ? 'var(--good)' : r.contributionUsd < 0 ? 'var(--bad)' : undefined }}>{usd(r.contributionUsd)}</td>
                    <td className="num">{r.roas == null ? '—' : `${r.roas}×`}</td>
                    <td><Recommendation recommendation={r.recommendation} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="small muted" style={{ marginTop: 8 }}>
          「—」代表分母不存在（例如平台沒有回報曝光），不代表 0。ROAS 在成本為 0 時無定義而非無限大。
        </div>
      </Card>

      <Card title="模型單價" note="observed = 由本 repo 實際帳單推得；listed = 供應商列表價，尚未對過帳。">
        <div className="scroll-x">
          <table>
            <thead><tr><th>模型</th><th>供應商</th><th>類型</th><th className="num">Credits/單位</th><th>單位</th><th>依據</th><th>備註</th></tr></thead>
            <tbody>
              {Object.entries(meta.modelCosts).map(([k, m]) => (
                <tr key={k}>
                  <td className="mono small">{k}</td>
                  <td className="small">{m.provider}</td>
                  <td className="small">{m.kind}</td>
                  <td className="num">{m.creditsPerUnit}</td>
                  <td className="small">{m.unit}</td>
                  <td><Badge tone={m.basis === 'observed' ? 'good' : 'warn'}>{m.basis}</Badge></td>
                  <td className="small muted">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
