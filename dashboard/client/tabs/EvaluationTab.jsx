import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Grade, Badge, Bar, Loading, Empty, Alert, num, pct, toneFor } from '../components/ui.jsx'

const BAND_TONE = { underestimated: 'accent', onTarget: 'good', overestimated: 'bad' }

const METRIC_FIELDS = [
  ['views', '觀看'],
  ['likes', '按讚'],
  ['comments', '留言'],
  ['shares', '分享'],
  ['saves', '收藏'],
  ['profileVisits', '主頁造訪'],
  ['linkClicks', '外連點擊'],
  ['conversions', '轉換'],
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
  const [calibration, setCalibration] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.pairs(), api.matchRecords(), api.calibration()])
      .then(([p, r, c]) => {
        setPairs(p.pairs)
        setRecords(r.records)
        setCalibration(c)
        setSelectedId((prev) => prev ?? p.pairs[0]?.pre.id ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [refreshToken])

  const selected = pairs.find((p) => p.pre.id === selectedId) ?? null

  return (
    <div className="grid sidebar">
      <div>
        <Card title="預評記錄" note="每一筆都是一次「素材生成前」的決策快照。">
          {loading && <Loading />}
          {error && <Alert tone="bad">{error}</Alert>}
          {!loading && pairs.length === 0 && (
            <Empty>
              尚無記錄。到「地區話題」頁簽用方向 (c) 產出素材企劃後，按「存為預評記錄」。
            </Empty>
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

        <Card title="校準迴圈" note="每累積 10 筆完成後評估的記錄跑一次（docs/09 §5）。">
          {calibration && (
            <>
              <div className="row" style={{ marginBottom: 8 }}>
                <Badge tone={calibration.ready ? 'good' : 'warn'}>
                  樣本 {calibration.sampleSize} / {calibration.required}
                </Badge>
                {calibration.matchVsEngagementCorrelation != null && (
                  <Badge tone={calibration.matchVsEngagementCorrelation >= 0.3 ? 'good' : 'bad'}>
                    r = {calibration.matchVsEngagementCorrelation}
                  </Badge>
                )}
              </div>
              <p className="small muted">{calibration.verdict ?? calibration.message}</p>
              {(calibration.perKol ?? []).map((k) => (
                <div key={k.kolId} className="small" style={{ marginTop: 8 }}>
                  <div className="mono">{k.kolId}（{k.sampleSize} 筆）</div>
                  <div className="muted">
                    建議 avg_views {num(k.suggestedBaseline.avg_views)}、互動率 {pct(k.suggestedBaseline.engagement_rate)}
                    {!k.enoughSamples && '（樣本不足 10，僅供參考）'}
                  </div>
                </div>
              ))}
            </>
          )}
        </Card>
      </div>

      <div>
        {selected ? (
          <>
            <PreSummary pre={selected.pre} />
            {selected.post ? (
              <ComparisonView pre={selected.pre} post={selected.post} comparison={selected.comparison} />
            ) : (
              <PostEntry
                pre={selected.pre}
                records={records.filter((r) => r.kolId === selected.pre.kolId)}
                onSaved={load}
              />
            )}
          </>
        ) : (
          !loading && <Card><Empty>左側選一筆預評記錄。</Empty></Card>
        )}

        <MatchLibrary kols={kols} records={records} onSaved={load} />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */

function PreSummary({ pre }) {
  const m = pre.matchSnapshot
  return (
    <Card
      title={`預先評估｜${pre.kolName}`}
      actions={
        <div className="row">
          <span className="score sm">{m.score}</span>
          <Grade grade={m.grade} />
          <Badge tone={pre.decision.key === 'go' ? 'good' : pre.decision.key === 'revise' ? 'warn' : 'bad'}>
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
                ['無風險度', 100 - m.dimensions.risk.score],
              ].map(([label, score]) => (
                <tr key={label}>
                  <td style={{ width: 100 }}>{label}</td>
                  <td className="num" style={{ width: 46 }}>{score}</td>
                  <td><Bar value={score} tone={toneFor(score)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4>預測漏斗</h4>
          <table>
            <tbody>
              {[
                ['觸及', pre.predictedFunnel.views],
                ['互動', pre.predictedFunnel.engagements],
                ['主頁造訪', pre.predictedFunnel.profileVisits],
                ['外連點擊', pre.predictedFunnel.linkClicks],
                ['轉換', pre.predictedFunnel.conversions],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="num">{num(value, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="chips" style={{ marginTop: 10 }}>
            {pre.fourAxis.rows.map((r) => (
              <span key={r.key} className={`chip ${r.passes ? 'on' : ''}`}>
                {r.label} {r.value ?? '—'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------- */

function PostEntry({ pre, records, onSaved }) {
  const [matchRecordId, setMatchRecordId] = useState('')
  const [manual, setManual] = useState(Object.fromEntries(METRIC_FIELDS.map(([k]) => [k, ''])))
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
      title="後續評估：回填實際成效"
      note="從 Match 庫挑一筆已發布素材的成效資料，或直接手動輸入。四維實測分數決定對照分析能不能分辨「選題問題」與「製作問題」。"
    >
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
        <div className="grid three">
          {METRIC_FIELDS.map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input
                type="number"
                value={manual[key]}
                onChange={(e) => setManual({ ...manual, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      <h4 style={{ marginTop: 8 }}>四維實測（1–5）</h4>
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
    </Card>
  )
}

/* -------------------------------------------------------------------- */

function ComparisonView({ post, comparison }) {
  return (
    <Card
      title="對照分析"
      actions={<Badge tone={comparison.attribution.key === 'onTarget' ? 'good' : 'warn'}>{comparison.attribution.label}</Badge>}
      note={`發布於 ${post.publishedAt ? new Date(post.publishedAt).toLocaleString('zh-TW') : '未記錄'}`}
    >
      <Alert tone={comparison.attribution.key === 'onTarget' ? 'good' : 'warn'}>
        <strong>{comparison.attribution.label}</strong>：{comparison.attribution.detail}
      </Alert>

      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>漏斗層</th>
              <th className="num">預測</th>
              <th className="num">實際</th>
              <th className="num">差距</th>
              <th className="num">偏差</th>
              <th style={{ width: 80 }}>判讀</th>
              <th>動作</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="num">{num(r.predicted, 1)}</td>
                <td className="num">{num(r.actual, 1)}</td>
                <td className="num">{r.delta > 0 ? `+${num(r.delta, 1)}` : num(r.delta, 1)}</td>
                <td className="num">{r.variancePercent > 0 ? `+${r.variancePercent}` : r.variancePercent}%</td>
                <td>
                  <Badge tone={BAND_TONE[r.band]}>{r.bandLabel}</Badge>
                </td>
                <td className="small muted">{r.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <div>
          <h4>四維：預估 vs 實測</h4>
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
          <h4>互動率</h4>
          <dl className="kv">
            <dt>預測</dt>
            <dd className="mono">{pct(comparison.predictedEngagementRate)}</dd>
            <dt>實際</dt>
            <dd className="mono">{pct(comparison.actualEngagementRate)}</dd>
            <dt>Match 分數</dt>
            <dd className="mono">{comparison.matchScore}</dd>
          </dl>
          {post.notes && <p className="small muted">{post.notes}</p>}
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------- */

function MatchLibrary({ kols, records, onSaved }) {
  const [form, setForm] = useState({ kolId: kols[0]?.id ?? '', platform: 'tiktok', postUrl: '' })
  const [metrics, setMetrics] = useState(Object.fromEntries(METRIC_FIELDS.map(([k]) => [k, ''])))
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
      setMetrics(Object.fromEntries(METRIC_FIELDS.map(([k]) => [k, ''])))
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
            {METRIC_FIELDS.map(([key, label]) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input type="number" value={metrics[key]} onChange={(e) => setMetrics({ ...metrics, [key]: e.target.value })} />
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
                <th className="num">轉換</th>
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
                  <td className="num">{num(r.metrics.conversions)}</td>
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
