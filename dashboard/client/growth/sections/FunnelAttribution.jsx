import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { Metric, MetricRow, AttributionBar, useAsyncAction, ErrorNote, usd, int, rate } from '../components.jsx'

/**
 * 07 漏斗與歸因 — DASHBOARD_SPEC.md §9.
 *
 * The page's whole job is to keep three things apart that every other
 * analytics tool merges: directly measured, model-attributed, and unattributed.
 * The drill-down refuses to invent a chain when there is not one.
 */
export default function FunnelAttribution({ meta, productId }) {
  const [data, setData] = useState(null)
  const [traced, setTraced] = useState(null)
  const { error, setError, run } = useAsyncAction()

  useEffect(() => {
    setData(null)
    growth.attribution({ productId }).then(setData).catch((e) => setError(e.message))
  }, [productId])

  if (!data) return <Loading />
  const c = data.coverage

  return (
    <div className="stack">
      <ErrorNote error={error} />

      <Card title="歸因覆蓋率" note={`歸因模型 ${c.modelName} v${c.modelVersion}，歸因窗 ${meta.attribution.windowHours} 小時。沒有可驗證連結的轉換不會被指派給任何內容。`}>
        <MetricRow>
          <Metric label="轉換總數" value={int(c.total)} />
          <Metric label="直接量測" value={int(c.direct)} tone="good" hint="帶本系統簽發的 tracking code" />
          <Metric label="模型歸因" value={int(c.modeled)} hint="由 session join 推得，非直接量測" />
          <Metric label="無法歸因" value={int(c.unattributed)} tone={c.unattributed ? 'warn' : ''} hint="沒有任何可驗證連結" />
          <Metric label="直接量測比例" value={c.directRate == null ? '—' : rate(c.directRate, 1)} />
          <Metric label="已歸因價值" value={usd(c.attributedValue)} />
          <Metric label="未歸因價值" value={usd(c.unattributedValue)} hint="這筆錢確實發生了，只是不知道是哪篇內容帶來的" />
        </MetricRow>
        <div style={{ marginTop: 12 }}><AttributionBar coverage={c} /></div>
      </Card>

      <Card title="歸因明細" note="點任一列可往上追溯到 publication → asset → arm → 實驗 → 題目。追不到時系統會直說，不會假裝精準。">
        {data.touches.length === 0 ? <Empty>尚無轉換資料。</Empty> : (
          <div className="scroll-x">
            <table>
              <thead><tr><th>事件</th><th>證據等級</th><th>價值</th><th>發生時間</th><th>來源</th><th></th></tr></thead>
              <tbody>
                {data.touches.map((t) => (
                  <tr key={t.id}>
                    <td className="small">{t.eventName}</td>
                    <td>
                      <Badge tone={t.evidenceType === 'direct' ? 'good' : t.evidenceType === 'modeled' ? 'warn' : 'bad'}>
                        {{ direct: '直接量測', modeled: '模型歸因', unknown: '無法歸因' }[t.evidenceType]}
                      </Badge>
                    </td>
                    <td className="num">{usd(t.attributedValue ?? t.valueAmount)}</td>
                    <td className="small muted">{new Date(t.occurredAt).toLocaleString('zh-TW', { hour12: false })}</td>
                    <td className="small muted">{t.reason?.slice(0, 70)}</td>
                    <td><button className="ghos-link" onClick={() => run(async () => setTraced(await growth.trace(t.conversionEventId)))}>追溯</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {traced && (
        <Card title="轉換追溯" actions={<button onClick={() => setTraced(null)}>關閉</button>}>
          <p>{traced.says}</p>
          {traced.chain ? (
            <ol className="ghos-chain">
              <li><strong>轉換</strong> {traced.conversion.eventName}｜{usd(traced.conversion.valueAmount)}</li>
              <li><strong>歸因</strong> {traced.attribution.reason}</li>
              <li><strong>Publication</strong> {traced.chain.publication?.platform}｜{traced.chain.publication?.url ?? '—'}</li>
              <li><strong>素材</strong> {traced.chain.asset?.assetType}｜{traced.chain.asset?.text?.slice(0, 60)}</li>
              <li><strong>Arm</strong> {traced.chain.arm?.label}｜{traced.chain.arm?.hook}</li>
              <li><strong>人設</strong> {traced.chain.personaId}</li>
              <li><strong>實驗</strong> {traced.chain.experiment?.hypothesis}</li>
              <li><strong>題目</strong> {traced.chain.opportunity?.topic ?? '（未綁定 Opportunity）'}</li>
            </ol>
          ) : (
            <div className="alert warn">這筆轉換沒有可追溯的來源鏈。它仍計入總數與未歸因價值，但不會被算到任何一篇內容頭上。</div>
          )}
        </Card>
      )}
    </div>
  )
}
