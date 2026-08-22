import React, { useState } from 'react'
import { Badge } from './ui.jsx'

/**
 * docs/11 §3 — the note that travels with every score.
 *
 * The rule this component exists to keep: a number nobody can trace back to a
 * meaning and a source is the next invented weight. So every score on screen
 * is expandable, and the expansion always shows what it is, how much it moves
 * the decision, what happens if it is wrong, and where the claim comes from.
 */

const CAL = {
  verified: { label: '有文獻支持', tone: 'good' },
  prior: { label: '先驗，尚未校準', tone: 'warn' },
  calibrated: { label: '已校準', tone: 'ok' },
}

const ROLE = {
  gate: { label: '門檻', hint: '這一維單獨就能否決，不能被其他維度補回來。' },
  score: { label: '排序', hint: '會改變排序，但不會單獨決定做或不做。' },
  display: { label: '參考', hint: '只顯示，不進任何計算。' },
}

export function CalibrationTag({ value }) {
  const c = CAL[value] ?? { label: value, tone: '' }
  return <Badge tone={c.tone}>{c.label}</Badge>
}

export function DimensionNote({ note }) {
  if (!note) return null
  const role = ROLE[note.decisionRole] ?? {}
  return (
    <div className="note-body">
      <p className="note-plain">{note.meaning}</p>

      <dl className="note-grid">
        <dt>角色</dt>
        <dd>
          <Badge>{role.label ?? note.decisionRole}</Badge> {role.hint}
          {note.share != null && <> 佔篩選分 {Math.round(note.share * 100)}%。</>}
        </dd>

        <dt>為什麼重要</dt>
        <dd>{note.impactWhy}</dd>

        <dt>它在做什麼</dt>
        <dd>{note.function}</dd>

        <dt>弄錯會怎樣</dt>
        <dd>{note.failureMode}</dd>

        <dt>依據</dt>
        <dd>
          {(note.evidence ?? []).length === 0 ? (
            <em>沒有已查證的文獻直接支持這一項。</em>
          ) : (
            <ul className="evidence">
              {note.evidence.map((e, i) => (
                <li key={i}>
                  <span>{e.claim}</span>
                  <br />
                  <small>
                    {e.url ? (
                      <a href={e.url} target="_blank" rel="noreferrer">
                        {e.source}
                      </a>
                    ) : (
                      e.source
                    )}
                    {e.status === 'verified' && ' ✅ 已查證'}
                    {e.status === 'internal' && ' · 內部規範'}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </dd>

        <dt>校準狀態</dt>
        <dd>
          <CalibrationTag value={note.calibration} />{' '}
          {note.calibrationWhy}
        </dd>
      </dl>
    </div>
  )
}

/** A score with its note one click away. */
export function ScoreRow({ label, score, note, tone = '', suffix = null, children }) {
  const [open, setOpen] = useState(false)
  const pctWidth = Math.max(0, Math.min(100, Number(score) || 0))
  return (
    <div className={`score-row ${open ? 'open' : ''}`}>
      <button className="score-head" onClick={() => setOpen(!open)} type="button">
        <span className="score-label">
          {label}
          {note?.calibration && <CalibrationTag value={note.calibration} />}
        </span>
        <span className="score-bar">
          <i className={`fill ${tone}`} style={{ width: `${pctWidth}%` }} />
        </span>
        <span className="score-value">{score == null ? '—' : score}</span>
        <span className="score-toggle">{open ? '收合' : '為什麼？'}</span>
      </button>
      {suffix}
      {open && (
        <>
          <DimensionNote note={note} />
          {children}
        </>
      )}
    </div>
  )
}

/** docs/11 §6.2 — the expert panel beside every wizard choice. */
export function ExpertPanel({ panel }) {
  if (!panel) return null
  return (
    <aside className="expert">
      <section>
        <h4>💡 這是什麼</h4>
        {panel.plain.split('\n').map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </section>
      <section>
        <h4>📊 選錯會怎樣</h4>
        {panel.consequence.split('\n').map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </section>
      <section>
        <h4>📚 依據</h4>
        {(panel.evidence ?? []).length === 0 ? (
          <p><em>這一步沒有直接的文獻依據，是我們的判斷。</em></p>
        ) : (
          <ul className="evidence">
            {panel.evidence.map((e, i) => (
              <li key={i}>
                {e.claim}
                <br />
                <small>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noreferrer">{e.source}</a>
                  ) : (
                    e.source
                  )}
                  {e.status === 'verified' && ' ✅'}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h4>✅ 建議</h4>
        {panel.recommendation.split('\n').map((l, i) => (
          <p key={i}>{l}</p>
        ))}
        {panel.footnote && <p className="footnote">ℹ️ {panel.footnote}</p>}
      </section>
    </aside>
  )
}

/** docs/11 §5.4 — lint hits are candidates, not verdicts, and must say so. */
export function RedlinePanel({ blocks = [], warnings = [], lintHits = [], standing = [], compact = false }) {
  const [open, setOpen] = useState(!compact)
  const total = blocks.length + warnings.length + lintHits.length
  if (!total && !standing.length) return null

  return (
    <div className="redlines">
      {blocks.map((b) => (
        <div className="rl block" key={b.id}>
          <strong>⛔ {b.id} · {b.title}</strong>
          <p>{b.whyPlain}</p>
          <p className="remedy">怎麼改：{b.remedy}</p>
        </div>
      ))}
      {warnings.map((w) => (
        <div className="rl warn" key={w.id}>
          <strong>⚠️ {w.id} · {w.title}</strong>
          <p>{w.whyPlain}</p>
          <p className="remedy">怎麼改：{w.remedy}</p>
        </div>
      ))}
      {lintHits.map((h) => (
        <div className="rl review" key={h.id}>
          <strong>🔍 {h.id} · {h.title}</strong>
          <p className="hint">關鍵字命中，但這不是判定——關鍵字會誤擋也會漏抓，要人看過才算數。</p>
          <p>{h.whyPlain}</p>
        </div>
      ))}
      {standing.length > 0 && (
        <div className="rl standing">
          <button type="button" onClick={() => setOpen(!open)}>
            🔍 每則都要看的 {standing.length} 條（沒有可靠關鍵字可抓）{open ? ' ▲' : ' ▼'}
          </button>
          {open && (
            <ul>
              {standing.map((s) => (
                <li key={s.id}>
                  <strong>{s.id}</strong> {s.title} — {s.whyPlain}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
