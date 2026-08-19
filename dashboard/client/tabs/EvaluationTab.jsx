import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Grade, Badge, Bar, Loading, Empty, Alert, num, pct, toneFor } from '../components/ui.jsx'

/**
 * Every field the platform gives us is stored; only the first three are the
 * ones a human is asked to read (docs/10 第五刀). The rest sit behind a
 * disclosure so they are visible when someone actually wants them.
 */
const PRIMARY_FIELDS = [
  ['views', '觀看'],
  ['likes', '按讚'],
  ['comments', '留言'],
  ['shares', '分享'],
  ['saves', '收藏'],
  ['linkClicks', '外連點擊'],
]

const SECONDARY_FIELDS = [
  ['reach', '觸及'],
  ['impressions', '曝光'],
  ['profileVisits', '主頁造訪'],
  ['conversions', '轉換'],
  ['follows', '新增追蹤'],
  ['completionRate', '完播率'],
]

const FOUR_AXIS_FIELDS = [
  ['entertaining', '娛樂性'],
  ['musicality', '音樂性'],
  ['authenticity', '真實性'],
  ['motionFluency', '動作流暢性'],
]

export default function EvaluationTab({ kols, refreshToken }) {
  const [pairs, setPairs] = useState([])
  const [records, setRecords] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.pairs(), api.matchRecords()])
      .then(([p, r]) => {
        setPairs(p.pairs)
        setRecords(r.records)
        setSelectedId((prev) => prev ?? p.pairs[0]?.pre.id ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [refreshToken])

  const selected = pairs.find((p) => p.pre.id === selectedId) ?? null

  return (
    <div className="grid sidebar">
      {/* 卡片 1／3：預評清單 */}
      <div>
        <Card title="預評記錄" note="每一筆都是一次「素材生成前」的決策快照。">
          {loading && <Loading />}
          {error && <Alert tone="bad">{error}</Alert>}
          {!loading && pairs.length === 0 && (
            <Empty>尚無記錄。到「地區話題」頁簽用方向 (c) 產出素材企劃後，按「存為預評記錄」。</Empty>
          )}
          {pairs.map(({ pre, post }) => (
            <div
              key={pre.id}
              className={`list-row ${pre.id === selectedId ? 'on' : ''}`}
              onClick={() => setSelectedId(pre.id)}
            >
              <div className="grow">
                <div className="title">{pre.kolName}</div>
                <div className="sub mono">{(pre.topicTags ?? []).join(' ')}</div>
                <div className="sub">{new Date(pre.createdAt).toLocaleString('zh-TW')}</div>
              </div>
              <Badge tone={post ? 'good' : 'warn'}>{post ? '已對照' : '待回填'}</Badge>
            </div>
          ))}
        </Card>
      </div>

      <div>
        {selected ? (
          <>
            {/* 卡片 2／3：預評摘要 + 回填（合併） */}
            <PreAndEntry
              pre={selected.pre}
              post={selected.post}
              records={records.filter((r) => r.kolId === selected.pre.kolId)}
              onSaved={load}
            />
            {/* 卡片 3／3：對照分析 */}
            {selected.post && <ComparisonView post={selected.post} comparison={selected.comparison} />}
          </>
        ) : (
          !loading && (
            <Card>
              <Empty>左側選一筆預評記錄。</Empty>
            </Card>
          )
        )}

        <MatchLibrary kols={kols} records={records} onSaved={load} />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */

function PreAndEntry({ pre, post, records, onSaved }) {
  const m = pre.matchSnapshot
  const [matchRecordId, setMatchRecordId] = useState('')
  const [manual, setManual] = useState({})
  const [showMore, setShowMore] = useState(false)
  const [fourAxisActual, setFourAxisActual] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const payload = {
        preEvaluationId: pre.id,
        fourAxisActual: Object.fromEntries(
          Object.entries(fourAxisActual).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, Number(v)]),
        ),
      }
      if (matchRecordId) payload.matchRecordId = matchRecordId
      else {
        payload.actuals = Object.fromEntries(
          Object.entries(manual).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)]),
        )
        if (!Object.keys(payload.actuals).length) throw new Error('請選一筆 Match 庫記錄，或至少填一個實測數字')
      }
      await api.savePost(payload)
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card
      title={`預先評估｜${pre.kolName}`}
      actions={
        <div className="row">
          <span className="score sm">{m.score}</span>
          <Grade grade={m.grade} />
          <Badge tone={pre.decision.key === 'go' ? 'good' : pre.decision.key === 'blocked' ? 'bad' : 'warn'}>
            {pre.decision.label}
          </Badge>
        </div>
      }
      note={`話題：${(pre.topicTags ?? []).join('、')}｜建立於 ${new Date(pre.createdAt).toLocaleString('zh-TW')}`}
    >
      <div className="grid two">
        <div>
          <h4>Match 快照</h4>
          <table>
            <tbody>
              {[
                ['人設契合', m.dimensions.personaFit.score],
                ['支柱覆蓋', m.dimensions.pillarFit.score],
                ['話題熱度', m.dimensions.topicHeat.score],
                ['地區契合', m.dimensions.regionFit.score],
              ].map(([label, score]) => (
                <tr key={label}>
                  <td style={{ width: 84 }}>{label}</td>
                  <td className="num" style={{ width: 46 }}>{score}</td>
                  <td>
                    <Bar value={score} tone={toneFor(score)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4>本次目標（企劃者填寫）</h4>
          <table>
            <tbody>
              <tr>
                <td>目標觀看</td>
                <td className="num">{pre.targets?.views == null ? '未填' : num(pre.targets.views)}</td>
              </tr>
              <tr>
                <td>目標外連點擊</td>
                <td className="num">{pre.targets?.linkClicks == null ? '未填' : num(pre.targets.linkClicks)}</td>
              </tr>
            </tbody>
          </table>
          <div className="chips" style={{ marginTop: 10 }}>
            {(pre.fourAxisChecklist?.rows ?? []).map((r) => (
              <span key={r.key} className={`chip ${r.passes ? 'on' : ''}`}>
                {r.label} {r.value ?? '—'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {post ? (
        <Alert tone="good">已回填實際成效，對照分析見下方。</Alert>
      ) : (
        <>
          <h4 style={{ marginTop: 16 }}>回填實際成效</h4>
          <div className="section-note">
            從 Match 庫挑一筆，或手動輸入。<strong>平台給得出來的欄位就填</strong>——顯示只用三個，但存下來的
            每一欄都是之後歸因用得到的事實，砍掉就補不回來。
          </div>
          {error && <Alert tone="bad">{error}</Alert>}
          <div className="field">
            <label>Match 庫記錄</label>
            <select value={matchRecordId} onChange={(e) => setMatchRecordId(e.target.value)} style={{ width: '100%' }}>
              <option value="">（不使用，改為手動輸入）</option>
              {records.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.platform ?? '—'} · {num(r.metrics.views)} views · {r.postUrl ?? r.id}
                </option>
              ))}
            </select>
          </div>

          {!matchRecordId && (
            <>
              <div className="grid three">
                {PRIMARY_FIELDS.map(([key, label]) => (
                  <div className="field" key={key}>
                    <label>{label}</label>
                    <input type="number" value={manual[key] ?? ''} onChange={(e) => setManual({ ...manual, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <button onClick={() => setShowMore(!showMore)} style={{ marginBottom: 10 }}>
                {showMore ? '收起其他欄位' : `其他欄位（${SECONDARY_FIELDS.length}）`}
              </button>
              {showMore && (
                <div className="grid three">
                  {SECONDARY_FIELDS.map(([key, label]) => (
                    <div className="field" key={key}>
                      <label>{label}</label>
                      <input type="number" value={manual[key] ?? ''} onChange={(e) => setManual({ ...manual, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <h4>四維實測（1–5）</h4>
          <div className="row" style={{ marginBottom: 12 }}>
            {FOUR_AXIS_FIELDS.map(([key, label]) => (
              <span key={key} className="row" style={{ gap: 4 }}>
                <span className="small muted">{label}</span>
                <select
                  value={fourAxisActual[key] ?? ''}
                  onChange={(e) => setFourAxisActual({ ...fourAxisActual, [key]: e.target.value })}
                  style={{ padding: '4px 6px' }}
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </span>
            ))}
          </div>

          <button className="primary" onClick={submit} disabled={busy}>
            {busy ? '儲存中…' : '儲存並產生對照分析'}
          </button>
        </>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------- */

function ComparisonView({ post, comparison }) {
  const [showStored, setShowStored] = useState(false)
  const tone = comparison.attribution.key === 'onTarget' ? 'good' : comparison.attribution.key === 'incomplete' ? 'info' : 'warn'

  return (
    <Card
      title="對照分析"
      actions={<Badge tone={tone === 'good' ? 'good' : 'warn'}>{comparison.attribution.label}</Badge>}
      note={`發布於 ${post.publishedAt ? new Date(post.publishedAt).toLocaleString('zh-TW') : '未記錄'}`}
    >
      <Alert tone={tone}>
        <strong>{comparison.attribution.label}</strong>：{comparison.attribution.detail}
      </Alert>

      <table>
        <thead>
          <tr>
            <th>指標</th>
            <th className="num">目標</th>
            <th className="num">實際</th>
            <th className="num">差距</th>
            <th style={{ width: 80 }}>判讀</th>
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td className="num">{r.target == null ? '—' : num(r.target)}</td>
              <td className="num">{num(r.actual)}</td>
              <td className="num">
                {r.variancePercent == null ? '—' : `${r.variancePercent > 0 ? '+' : ''}${r.variancePercent}%`}
              </td>
              <td>
                <Badge tone={r.verdict === '達標' ? 'good' : r.verdict === '未達標' ? 'bad' : ''}>{r.verdict}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid two" style={{ marginTop: 16 }}>
        <div>
          <h4>四維：自評 vs 實測</h4>
          <table>
            <tbody>
              {comparison.fourAxisDelta.map((r) => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="num">{r.predicted ?? '—'}</td>
                  <td className="num">→ {r.actual ?? '—'}</td>
                  <td className="num">{r.delta == null ? '—' : r.delta > 0 ? `+${r.delta}` : r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4>其他</h4>
          <dl className="kv">
            <dt>互動率</dt>
            <dd className="mono">{pct(comparison.engagementRate)}</dd>
            <dt>Match 分數</dt>
            <dd className="mono">{comparison.matchScore}</dd>
          </dl>
          <button onClick={() => setShowStored(!showStored)}>
            {showStored ? '收起' : `已儲存的其他欄位（${Object.keys(comparison.storedOnly ?? {}).length}）`}
          </button>
          {showStored && (
            <table style={{ marginTop: 8 }}>
              <tbody>
                {Object.entries(comparison.storedOnly ?? {}).map(([k, v]) => (
                  <tr key={k}>
                    <td className="mono small">{k}</td>
                    <td className="num">{v ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {post.notes && <p className="small muted">{post.notes}</p>}
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------- */

function MatchLibrary({ kols, records, onSaved }) {
  const [form, setForm] = useState({ kolId: kols[0]?.id ?? '', platform: 'tiktok', postUrl: '' })
  const [metrics, setMetrics] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.saveMatchRecord({
        ...form,
        publishedAt: new Date().toISOString(),
        ...Object.fromEntries(Object.entries(metrics).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])),
      })
      setMetrics({})
      setOpen(false)
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card
      title="Match 庫"
      actions={<button onClick={() => setOpen(!open)}>{open ? '收起' : '新增記錄'}</button>}
      note="已發布素材的成效資料表，後續評估從這裡取數。設定 APIFY_TOKEN 後可改為自動回抓。"
    >
      {error && <Alert tone="bad">{error}</Alert>}
      {open && (
        <>
          <div className="controls" style={{ marginBottom: 10 }}>
            <div>
              <label>KOL</label>
              <select value={form.kolId} onChange={(e) => setForm({ ...form, kolId: e.target.value })}>
                {kols.map((k) => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>平台</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {['tiktok', 'instagram', 'threads', 'youtube', 'facebook'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label>貼文網址</label>
              <input value={form.postUrl} onChange={(e) => setForm({ ...form, postUrl: e.target.value })} style={{ width: '100%' }} />
            </div>
          </div>
          <div className="grid three">
            {[...PRIMARY_FIELDS, ...SECONDARY_FIELDS].map(([key, label]) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input type="number" value={metrics[key] ?? ''} onChange={(e) => setMetrics({ ...metrics, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <button className="primary" onClick={submit} disabled={busy}>
            {busy ? '儲存中…' : '存入 Match 庫'}
          </button>
        </>
      )}

      {records.length === 0 ? (
        <Empty>Match 庫是空的。</Empty>
      ) : (
        <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th>KOL</th>
                <th>平台</th>
                <th className="num">觀看</th>
                <th className="num">互動</th>
                <th className="num">互動率</th>
                <th className="num">外連點擊</th>
                <th>發布時間</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.kolId}</td>
                  <td>{r.platform ?? '—'}</td>
                  <td className="num">{num(r.metrics.views)}</td>
                  <td className="num">{num(r.metrics.engagements)}</td>
                  <td className="num">{pct(r.metrics.engagementRate)}</td>
                  <td className="num">{num(r.metrics.linkClicks)}</td>
                  <td className="small muted">
                    {r.publishedAt ? new Date(r.publishedAt).toLocaleString('zh-TW') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
