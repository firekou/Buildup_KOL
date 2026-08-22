import React from 'react'

export const Card = ({ title, actions, note, children, className = '' }) => (
  <section className={`card ${className}`}>
    {(title || actions) && (
      <div className="card-head">
        {typeof title === 'string' ? <h3>{title}</h3> : title}
        {actions && <div className="spacer" />}
        {actions}
      </div>
    )}
    {note && <div className="section-note">{note}</div>}
    {children}
  </section>
)

/**
 * docs/11 §2.5 — a band, never a precise number.
 * The old <Grade> rendered "A｜強配 / 71.2", which reads as a forecast the
 * data cannot support. This renders 高 / 中 / 低 / 實驗 with its own hint.
 */
export const Band = ({ band }) =>
  band ? <span className={`grade band-${band.key}`} title={band.hint}>{band.label}</span> : null

export const Grade = ({ grade }) =>
  grade ? <span className={`grade ${grade.key}`}>{grade.label}</span> : null

export const Badge = ({ tone = '', children }) => <span className={`badge ${tone}`}>{children}</span>

export const Bar = ({ value, max = 100, tone = '' }) => (
  <div className={`bar ${tone}`}>
    <span style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
  </div>
)

export const Loading = ({ children = '載入中…' }) => <div className="loading">{children}</div>
export const Empty = ({ children }) => <div className="empty">{children}</div>

export const Alert = ({ tone = 'info', children }) => <div className={`alert ${tone}`}>{children}</div>

export const num = (n, digits = 0) =>
  n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: digits })

export const pct = (n, digits = 1) => (n == null ? '—' : `${(n * 100).toFixed(digits)}%`)

/** Score-to-tone mapping used everywhere a 0–100 number is drawn. */
export const toneFor = (score) => (score >= 80 ? 'good' : score >= 65 ? '' : score >= 50 ? 'warn' : 'bad')

/**
 * Eight-axis radar. Drawn as inline SVG rather than pulled from a chart
 * library — one shape, two polygons, no dependency worth the weight.
 */
export function Radar({ axes, series, size = 260 }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 42
  const n = axes.length
  const point = (i, value) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const d = (Math.max(0, Math.min(100, value)) / 100) * r
    return [cx + Math.cos(angle) * d, cy + Math.sin(angle) * d]
  }
  const polygon = (values) => axes.map((a, i) => point(i, values[a.key] ?? 0).join(',')).join(' ')

  return (
    <svg width={size} height={size} role="img" aria-label="八軸屬性雷達圖">
      {[25, 50, 75, 100].map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, i) => point(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="#262d37"
          strokeWidth="1"
        />
      ))}
      {axes.map((axis, i) => {
        const [x, y] = point(i, 100)
        return <line key={axis.key} x1={cx} y1={cy} x2={x} y2={y} stroke="#262d37" strokeWidth="1" />
      })}
      {series.map((s) => (
        <polygon
          key={s.label}
          points={polygon(s.values)}
          fill={s.fill}
          stroke={s.stroke}
          strokeWidth="1.6"
          strokeDasharray={s.dashed ? '4 3' : undefined}
        />
      ))}
      {axes.map((axis, i) => {
        const [x, y] = point(i, 122)
        return (
          <text
            key={axis.key}
            x={x}
            y={y}
            fill="#9aa7b4"
            fontSize="10.5"
            textAnchor={Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end'}
            dominantBaseline="middle"
          >
            {axis.label_zh}
          </text>
        )
      })}
    </svg>
  )
}

export const RadarLegend = ({ series }) => (
  <div className="row small">
    {series.map((s) => (
      <span key={s.label} className="row" style={{ gap: 6 }}>
        <span style={{ width: 12, height: 12, background: s.fill, border: `1.5px solid ${s.stroke}`, borderRadius: 3, display: 'inline-block' }} />
        <span className="muted">{s.label}</span>
      </span>
    ))}
  </div>
)

export const SERIES_KOL = { fill: 'rgba(88,166,255,0.22)', stroke: '#58a6ff' }
export const SERIES_TOPIC = { fill: 'rgba(210,153,34,0.16)', stroke: '#d29922', dashed: true }
