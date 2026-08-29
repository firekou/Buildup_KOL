import React, { useState } from 'react'
import { Badge } from '../components/ui.jsx'

/** Shared pieces for the Growth OS section. */

export const usd = (n) => (n == null || !Number.isFinite(Number(n)) ? '—' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`)
export const int = (n) => (n == null || !Number.isFinite(Number(n)) ? '—' : Number(n).toLocaleString('en-US'))
export const rate = (n, digits = 2) => (n == null || !Number.isFinite(Number(n)) ? '—' : `${(Number(n) * 100).toFixed(digits)}%`)

/**
 * The distinction the whole spec rests on: an absent number renders as "—"
 * with a reason, never as 0. `hint` is what the reader needs to know to not
 * misread the dash.
 */
export const Metric = ({ label, value, hint, tone = '' }) => (
  <div className="ghos-metric">
    <span className="ghos-metric-label">{label}</span>
    <span className={`ghos-metric-value ${tone}`}>{value ?? '—'}</span>
    {hint && <span className="ghos-metric-hint">{hint}</span>}
  </div>
)

export const MetricRow = ({ children }) => <div className="ghos-metrics">{children}</div>

/** Gate / check result pill. */
export const GateResult = ({ result }) => {
  const map = {
    pass: { tone: 'good', label: '通過' },
    warning: { tone: 'warn', label: '提醒' },
    blocking: { tone: 'bad', label: '阻擋' },
    needs_human: { tone: 'accent', label: '需人工' },
  }
  const spec = map[result] ?? { tone: '', label: result }
  return <Badge tone={spec.tone}>{spec.label}</Badge>
}

export const GateList = ({ gates = [], showPassed = false }) => {
  const [expanded, setExpanded] = useState(showPassed)
  const shown = expanded ? gates : gates.filter((g) => g.result !== 'pass' && g.passed !== true)
  const hidden = gates.length - shown.length
  return (
    <div className="ghos-gates">
      {shown.map((g) => (
        <div key={g.gate} className={`ghos-gate ${g.result ?? (g.passed ? 'pass' : 'blocking')}`}>
          <div className="row" style={{ gap: 8 }}>
            <GateResult result={g.result ?? (g.passed ? 'pass' : 'blocking')} />
            <strong>{g.label ?? g.gate}</strong>
          </div>
          <p>{g.message}</p>
        </div>
      ))}
      {hidden > 0 && (
        <button className="ghos-link" onClick={() => setExpanded(true)}>
          顯示另外 {hidden} 項已通過的檢查
        </button>
      )}
      {gates.length === 0 && <p className="muted small">尚未執行檢查。</p>}
    </div>
  )
}

/** Recommendation state with its justification — never the state alone. */
export const Recommendation = ({ recommendation }) => {
  if (!recommendation) return null
  const tone = { SCALE_CANDIDATE: 'good', HOLD: '', REDUCE: 'warn', STOP: 'bad', RETEST: 'accent' }[recommendation.state] ?? ''
  const label = { SCALE_CANDIDATE: '建議加碼', HOLD: '維持', REDUCE: '建議減少', STOP: '建議停止', RETEST: '需重測' }[recommendation.state] ?? recommendation.state
  return (
    <div className="ghos-reco">
      <Badge tone={tone}>{label}</Badge>
      <span className="small muted">{recommendation.because}</span>
    </div>
  )
}

export const DecisionBadge = ({ decision }) => {
  if (!decision) return <Badge>未判定</Badge>
  const map = {
    WINNER: { tone: 'good', label: 'WINNER' },
    LOSER: { tone: 'bad', label: 'LOSER' },
    INCONCLUSIVE: { tone: 'warn', label: '無定論' },
    NEEDS_MORE_DATA: { tone: 'accent', label: '資料不足' },
  }
  const spec = map[decision] ?? { tone: '', label: decision }
  return <Badge tone={spec.tone}>{spec.label}</Badge>
}

export const StatusBadge = ({ status }) => {
  const tone = {
    DRAFT: '', PLANNED: '', GENERATED: 'accent', REVIEW_REQUIRED: 'warn', APPROVED: 'accent',
    PUBLISHED: 'accent', COLLECTING: 'accent', EVALUABLE: 'good', WINNER: 'good',
    LOSER: 'bad', INCONCLUSIVE: 'warn', STOPPED: '',
    published: 'accent', scheduled: '', failed: 'bad', removed: 'bad',
    active: 'good', restricted: 'warn', banned: 'bad', paused: 'warn',
  }[status] ?? ''
  return <Badge tone={tone}>{status}</Badge>
}

/** Caveats are rendered as a block, not a footnote — that is the point of them. */
export const Caveats = ({ caveats = [], title = '這個數字的保留條件' }) => {
  if (!caveats.length) return null
  return (
    <div className="ghos-caveats">
      <strong>{title}</strong>
      <ul>
        {caveats.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  )
}

/** Attribution split — measured vs modeled vs unattributed, always all three. */
export const AttributionBar = ({ coverage }) => {
  if (!coverage || !coverage.total) return <p className="muted small">尚無轉換資料。</p>
  const pct = (n) => `${((n / coverage.total) * 100).toFixed(1)}%`
  return (
    <div className="ghos-attr">
      <div className="ghos-attr-bar">
        <span className="direct" style={{ width: pct(coverage.direct) }} title={`直接量測 ${coverage.direct}`} />
        <span className="modeled" style={{ width: pct(coverage.modeled) }} title={`模型歸因 ${coverage.modeled}`} />
        <span className="unknown" style={{ width: pct(coverage.unattributed) }} title={`無法歸因 ${coverage.unattributed}`} />
      </div>
      <div className="row small" style={{ gap: 14 }}>
        <span><i className="dot direct" /> 直接量測 {coverage.direct}</span>
        <span><i className="dot modeled" /> 模型歸因 {coverage.modeled}</span>
        <span><i className="dot unknown" /> 無法歸因 {coverage.unattributed}</span>
      </div>
      <p className="muted small">{coverage.says}</p>
    </div>
  )
}

/** A form field that surfaces server-side validation errors inline. */
export const Field = ({ label, hint, error, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
    {hint && <div className="muted small" style={{ marginTop: 3 }}>{hint}</div>}
    {error && <div className="small" style={{ color: 'var(--bad)', marginTop: 3 }}>{error}</div>}
  </div>
)

export function useAsyncAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

export const ErrorNote = ({ error }) =>
  error ? <div className="alert bad" style={{ marginTop: 8 }}>{error}</div> : null
