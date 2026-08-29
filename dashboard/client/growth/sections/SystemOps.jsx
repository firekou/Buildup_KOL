import React, { useEffect, useState } from 'react'
import { growth } from '../api.js'
import { Card, Badge, Loading, Empty } from '../../components/ui.jsx'
import { useAsyncAction, ErrorNote, int, rate } from '../components.jsx'

/**
 * 10 系統維運 — DASHBOARD_SPEC.md §12.
 *
 * For the production operator, not the strategist. Job health, adapter
 * configuration, data freshness per collection, and the raw event / audit
 * tails — the four things you need when the numbers look wrong and you have to
 * decide whether the pipeline or the content is at fault.
 */
export default function SystemOps() {
  const [ops, setOps] = useState(null)
  const { error, setError } = useAsyncAction()

  useEffect(() => { growth.ops().then(setOps).catch((e) => setError(e.message)) }, [])
  if (!ops) return <Loading />

  const stale = Object.entries(ops.freshness).filter(([, f]) => f.count > 0)

  return (
    <div className="stack">
      <ErrorNote error={error} />

      <Card title="Job 健康度" note="每個非同步動作都有 status / attempts / lastError。用盡重試次數的 job 會停在 dead_letter 等人處理，而不是靜靜消失。">
        {Object.keys(ops.jobs).length === 0 ? <Empty>還沒有跑過任何 job。</Empty> : (
          <div className="scroll-x">
            <table>
              <thead><tr><th>類型</th><th className="num">總數</th><th className="num">成功</th><th className="num">失敗</th><th className="num">Dead letter</th><th className="num">成功率</th><th className="num">平均耗時</th><th>最後錯誤</th></tr></thead>
              <tbody>
                {Object.entries(ops.jobs).map(([type, j]) => (
                  <tr key={type}>
                    <td className="mono small">{type}</td>
                    <td className="num">{int(j.total)}</td>
                    <td className="num">{int(j.succeeded)}</td>
                    <td className="num" style={{ color: j.failed ? 'var(--warn)' : undefined }}>{int(j.failed)}</td>
                    <td className="num" style={{ color: j.deadLetter ? 'var(--bad)' : undefined }}>{int(j.deadLetter)}</td>
                    <td className="num">{j.successRate == null ? '—' : rate(j.successRate, 0)}</td>
                    <td className="num">{j.avgDurationMs == null ? '—' : `${j.avgDurationMs}ms`}</td>
                    <td className="small warn-text">{j.lastError?.slice(0, 80) ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ops.deadLetters.length > 0 && (
          <div className="alert bad" style={{ marginTop: 10 }}>
            <strong>{ops.deadLetters.length} 個 job 已停在 dead letter</strong>
            <ul className="ghos-list small">
              {ops.deadLetters.slice(0, 6).map((j) => <li key={j.id}><span className="mono">{j.jobType}</span> — {j.lastError}</li>)}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid two">
        <Card title="生成 adapter">
          <div className="stack">
            {ops.adapters.generation.map((a) => (
              <div key={a.id} className="row">
                <Badge tone={a.configured ? 'good' : 'warn'}>{a.configured ? '已設定' : '未設定'}</Badge>
                <strong>{a.label}</strong>
                <span className="muted small">{a.kinds.join('/')}</span>
                <div className="muted small" style={{ flexBasis: '100%' }}>{a.note}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="發布 adapter">
          <div className="stack">
            {ops.adapters.publish.map((a) => (
              <div key={a.id} className="row">
                <Badge tone={a.automation === 'api' ? 'accent' : 'warn'}>{a.mode}</Badge>
                <strong>{a.label}</strong>
                <div className="muted small" style={{ flexBasis: '100%' }}>{a.note}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="資料新鮮度" note="control = 策略與規則；data = 觀測值。規則改版不應該影響歷史觀測資料，兩者分開存放就是為了這件事。">
        <div className="scroll-x">
          <table>
            <thead><tr><th>集合</th><th>平面</th><th className="num">筆數</th><th>最後寫入</th></tr></thead>
            <tbody>
              {stale.map(([name, f]) => (
                <tr key={name}>
                  <td className="mono small">{name}</td>
                  <td><Badge tone={f.plane === 'control' ? 'accent' : ''}>{f.plane}</Badge></td>
                  <td className="num">{int(f.count)}</td>
                  <td className="small muted">{f.lastWriteAt ? new Date(f.lastWriteAt).toLocaleString('zh-TW', { hour12: false }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid two">
        <Card title="最近事件">
          <ul className="ghos-timeline">
            {ops.events.slice(0, 20).map((e) => (
              <li key={e.id}>
                <span className="mono small muted">{new Date(e.occurredAt).toLocaleTimeString('zh-TW', { hour12: false })}</span>
                <span className="small">{e.eventName}</span>
                <span className="muted small">{e.source}</span>
              </li>
            ))}
            {ops.events.length === 0 && <li className="muted small">尚無事件。</li>}
          </ul>
        </Card>
        <Card title="稽核紀錄" note="每個自動決策與人工 override 都留下 actor / reason / timestamp。">
          <ul className="ghos-timeline">
            {ops.audit.slice(0, 20).map((a) => (
              <li key={a.id}>
                <span className="mono small muted">{new Date(a.createdAt).toLocaleTimeString('zh-TW', { hour12: false })}</span>
                <Badge tone={a.actorType === 'human' ? 'accent' : ''}>{a.actorType}</Badge>
                <span className="small">{a.action}</span>
                {a.reason && <span className="muted small">{a.reason.slice(0, 50)}</span>}
              </li>
            ))}
            {ops.audit.length === 0 && <li className="muted small">尚無紀錄。</li>}
          </ul>
        </Card>
      </div>
    </div>
  )
}
