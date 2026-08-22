import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Alert, Loading, Badge } from '../components/ui.jsx'
import { ExpertPanel, RedlinePanel } from '../components/notes.jsx'

/**
 * docs/11 §6 — guided KOL creation.
 *
 * One decision per screen, with the reasoning beside it. The ordering is the
 * product: step 2 (credibility mode) sets the persona's whole risk structure
 * and is expensive to reverse once an audience exists, so it is asked early
 * and its consequences are spelled out rather than buried in a tooltip.
 */
export default function CreateTab() {
  const [steps, setSteps] = useState(null)
  const [current, setCurrent] = useState(1)
  const [draft, setDraft] = useState({ axes: {}, pillars: [], credibility_basis: [], homophily: {}, redlines: [] })
  const [check, setCheck] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.createSteps().then((r) => setSteps(r.steps)).catch((e) => setError(e.message))
  }, [])

  if (error) return <Alert tone="bad">{error}</Alert>
  if (!steps) return <Loading />

  const step = steps.find((s) => s.id === current)
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const setHomophily = (k, v) => setDraft((d) => ({ ...d, homophily: { ...d.homophily, [k]: v } }))

  const validate = async () => {
    setBusy(true)
    try {
      setCheck(await api.validateStep({ stepId: current, draft }))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const next = async () => {
    await validate()
    setCurrent((c) => Math.min(c + 1, 8))
    setCheck(null)
  }

  const finalize = async (write) => {
    setBusy(true)
    try {
      setResult(await api.finalizeDraft({ draft, write }))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="create">
      <ol className="steps">
        {steps.map((s) => (
          <li key={s.id} className={s.id === current ? 'on' : s.id < current ? 'done' : ''}>
            <button type="button" onClick={() => { setCurrent(s.id); setCheck(null) }}>
              <span className="n">{s.id}</span>
              <span className="t">{s.title}</span>
              {s.highlight && <Badge tone="warn">最重要</Badge>}
            </button>
          </li>
        ))}
      </ol>

      <div className="create-body">
        <Card title={`${step.id}. ${step.title}`} note={step.intent}>
          {step.key === 'purpose' && (
            <>
              <Field label="這個帳號主要要做什麼？">
                <Select value={draft.goal} onChange={(v) => set('goal', v)} options={step.fields[0].options} />
              </Field>
              <Field label="要怎麼交代這是 AI 生成的角色？">
                <Select value={draft.disclosure} onChange={(v) => set('disclosure', v)} options={step.fields[1].options} />
              </Field>
            </>
          )}

          {step.key === 'credibility_mode' && (
            <Field label="這個角色的可信度要靠什麼？">
              <Select value={draft.credibility_mode} onChange={(v) => set('credibility_mode', v)} options={step.fields[0].options} />
              {draft.credibility_mode === 'embodied' && (
                <Alert tone="bad">
                  你選了具身經驗型。這是一個 AI 角色，所以「我親身去過」這類主張無法查證——
                  它會在每一個需要現場經驗的題目上被標記，要求逐題人工確認。
                  能改成「這條路線的紀錄顯示」的話，選資料庫型會安全得多。
                </Alert>
              )}
            </Field>
          )}

          {step.key === 'expertise' && (
            <>
              <Field label="主要領域">
                <input value={draft.domain ?? ''} onChange={(e) => set('domain', e.target.value)} placeholder="例：高海拔登山風險判斷" />
              </Field>
              <Field label="知識來源（每一條都要能被查）">
                <ListEditor
                  rows={draft.credibility_basis}
                  onChange={(v) => set('credibility_basis', v)}
                  placeholder="例：整理自 IFMGA 公開的路線標準"
                />
              </Field>
            </>
          )}

          {step.key === 'pillars' && (
            <Field label="內容支柱（2–3 根）">
              <ListEditor
                rows={draft.pillars}
                onChange={(v) => set('pillars', v)}
                placeholder="例：轉身時刻 — 什麼時候該放棄"
              />
              {draft.pillars.length > 3 && (
                <Alert tone="warn">
                  已經 {draft.pillars.length} 根了。超過三根會出現警示——但不會擋你，
                  因為文獻只說「會被折價」，沒說折價多少。
                </Alert>
              )}
            </Field>
          )}

          {step.key === 'axes' && (
            <div className="axes-editor">
              {['analysis', 'story', 'visual', 'credibility'].map((k) => (
                <div className="axis-row" key={k}>
                  <label>{{ analysis: '理性拆解', story: '敘事情緒', visual: '視覺張力', credibility: '身分可信' }[k]}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.axes[k]?.score ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, axes: { ...d.axes, [k]: { ...d.axes[k], score: Number(e.target.value) } } }))
                    }
                  />
                  <input
                    className="why"
                    placeholder="為什麼是這個分數？（至少 10 字，寫不出來就把分數拿掉）"
                    value={draft.axes[k]?.why ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, axes: { ...d.axes, [k]: { ...d.axes[k], why: e.target.value } } }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {step.key === 'homophily' && (
            <>
              <Field label="受眾是誰">
                <input value={draft.homophily.audience_identity ?? ''} onChange={(e) => setHomophily('audience_identity', e.target.value)} />
              </Field>
              <Field label="你們共同的處境">
                <input
                  value={draft.homophily.shared_situation ?? ''}
                  onChange={(e) => setHomophily('shared_situation', e.target.value)}
                  placeholder="寫具體一點：「時間破碎、想離開又不敢離開」比「上班族」有用得多"
                />
              </Field>
              <Field label="講話的方式">
                <input value={draft.homophily.language_register ?? ''} onChange={(e) => setHomophily('language_register', e.target.value)} />
              </Field>
              <Field label="相似性自評（0–100）">
                <input type="number" min="0" max="100" value={draft.homophily.score ?? ''} onChange={(e) => setHomophily('score', Number(e.target.value))} />
              </Field>
              <Field label="為什麼是這個分數">
                <input value={draft.homophily.why ?? ''} onChange={(e) => setHomophily('why', e.target.value)} />
              </Field>
            </>
          )}

          {step.key === 'redlines' && (
            <Field label="這位 KOL 專屬的紅線">
              <ListEditor rows={draft.redlines} onChange={(v) => set('redlines', v)} placeholder="例：不得美化冒險" />
              <Alert tone="info">九條全域紅線會自動套用，不需要在這裡重複。</Alert>
            </Field>
          )}

          {step.key === 'review' && (
            <>
              <Field label="這個 KOL 的 id（小寫英數與連字號）">
                <input value={draft.id ?? ''} onChange={(e) => set('id', e.target.value)} placeholder="例：mei-lin" />
              </Field>
              <div className="row">
                <button type="button" onClick={() => finalize(false)} disabled={busy}>預覽檢核結果</button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => finalize(true)}
                  disabled={busy || !result?.canSave}
                  title={result?.canSave ? '' : '先跑一次預覽，且沒有 block 才能存檔'}
                >
                  存檔
                </button>
              </div>
              {result && (
                <div className="finalize">
                  {result.saved ? (
                    <Alert tone="good">已寫入 {result.path}</Alert>
                  ) : (
                    <Alert tone={result.canSave ? 'info' : 'warn'}>{result.reason}</Alert>
                  )}
                  {result.problems?.length > 0 && (
                    <ul className="problems">
                      {result.problems.flatMap((p) => p.problems.map((m, i) => <li key={`${p.stepId}-${i}`}>第 {p.stepId} 步：{m}</li>))}
                    </ul>
                  )}
                  <RedlinePanel
                    blocks={result.redline?.blocks}
                    warnings={result.redline?.warnings}
                    lintHits={result.redline?.needsReview}
                    standing={result.redline?.pendingSemantic}
                    compact
                  />
                </div>
              )}
            </>
          )}

          {step.key !== 'review' && (
            <div className="row">
              <button type="button" onClick={validate} disabled={busy}>檢查這一步</button>
              <button type="button" className="primary" onClick={next} disabled={busy}>下一步</button>
            </div>
          )}

          {check && (
            <div className="stepcheck">
              {check.passed ? <Alert tone="good">這一步沒問題。</Alert> : (
                <ul className="problems">{check.problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
              )}
              <RedlinePanel
                blocks={check.redline?.blocks}
                warnings={check.redline?.warnings}
                lintHits={check.redline?.needsReview}
                compact
              />
            </div>
          )}
        </Card>

        <ExpertPanel panel={step.panel} />
      </div>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div className="field">
    <label>{label}</label>
    {children}
  </div>
)

const Select = ({ value, onChange, options }) => (
  <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
    <option value="">— 請選擇 —</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
)

function ListEditor({ rows = [], onChange, placeholder }) {
  const [text, setText] = useState('')
  const add = () => {
    if (!text.trim()) return
    onChange([...rows, text.trim()])
    setText('')
  }
  return (
    <div className="list-editor">
      <ul>
        {rows.map((r, i) => (
          <li key={i}>
            {typeof r === 'string' ? r : r.name ?? r.desc ?? JSON.stringify(r)}
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))}>移除</button>
          </li>
        ))}
      </ul>
      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button type="button" onClick={add}>新增</button>
      </div>
    </div>
  )
}
