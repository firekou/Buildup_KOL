import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Alert, Loading, Badge, Empty, num } from '../components/ui.jsx'

/**
 * docs/11 §7 — guided topic exploration.
 *
 * Three things this screen must never do, and the reason each rule exists:
 *   · call the number "heat"           — it is sample co-occurrence density
 *   · rank across domains              — diffusion mechanics differ by topic
 *                                        (Romero et al. 2011)
 *   · say "trending" / "going viral"   — that needs a baseline we do not have
 *                                        (Kleinberg 2002)
 */
export default function ExploreTab({ regions }) {
  const [region, setRegion] = useState('TW')
  const [mode, setMode] = useState('guided')
  const [data, setData] = useState(null)
  const [cross, setCross] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setBusy(true); setError(null)
    try {
      const [topics, cd] = await Promise.all([
        api.exploreTopics({ region, limit: 40 }),
        api.crossDomain({ region }).catch(() => null),
      ])
      setData(topics); setCross(cd)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [region])

  return (
    <div className="explore">
      <Card title="① 你想找什麼？">
        <div className="row controls">
          <label>地區
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {(regions ?? []).map((r) => <option key={r.key} value={r.key}>{r.label ?? r.key}</option>)}
            </select>
          </label>
          <label>方向
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="guided">看這批樣本裡有什麼</option>
              <option value="cross">找跨類別出現的字（實驗區）</option>
            </select>
          </label>
          <button onClick={load} disabled={busy}>{busy ? '讀取中…' : '重新讀取'}</button>
        </div>
        {error && <Alert tone="bad">{error}</Alert>}
      </Card>

      {busy && <Loading />}

      {data && mode === 'guided' && (
        <>
          <Alert tone="warn">
            <strong>{data.volumeLabel}</strong>：{data.heatCaveat}
          </Alert>
          <Alert tone="info">{data.seedWarning}</Alert>

          <Card
            title="② 分類別的清單"
            note={data.crossDomainCaveat}
          >
            {data.byDomain.map((g) => (
              <div className="domain-group" key={g.domain}>
                <h4>
                  {g.domain} <Badge>{g.size} 個</Badge>
                  {!g.discriminates && <Badge tone="warn">無區辨力</Badge>}
                </h4>
                {!g.discriminates && (
                  <p className="hint">這個類別裡的數字全都一樣（或只有一項），排序沒有意義——不要照這個順序選題。</p>
                )}
                <table>
                  <thead>
                    <tr><th>標籤</th><th className="num">不重複帳號</th><th className="num">48h 佔比</th><th className="num">作者集中度</th><th>平台</th></tr>
                  </thead>
                  <tbody>
                    {g.topics.map((t) => (
                      <tr key={t.id}>
                        <td>{t.tag}</td>
                        <td className="num">{num(t.volume)}</td>
                        <td className="num">{t.recencyRatio48h == null ? '—' : `${Math.round(t.recencyRatio48h)}%`}</td>
                        <td className="num">{t.authorConcentration ?? '—'}</td>
                        <td>{(t.platforms ?? []).map((p) => p.platform).join('、')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </Card>

          <Card title="③ 這批資料的狀態">
            <dl className="meta-grid">
              <dt>來源</dt><dd>{data.source}</dd>
              <dt>抓到貼文</dt><dd>{num(data.postsScraped)}</dd>
              <dt>歷史快照</dt><dd>{data.snapshotCount ?? 0} 筆</dd>
              <dt>可信度</dt>
              <dd>
                <Badge tone={data.heatConfidence === 'none' ? 'warn' : ''}>{data.heatConfidence}</Badge>
                {data.heatConfidence === 'none' && ' — 沒有歷史可比，無法判定升溫。'}
              </dd>
            </dl>
          </Card>
        </>
      )}

      {cross && mode === 'cross' && (
        <Card title={cross.label} note={`實驗區 · 預設關閉`}>
          <Alert tone="warn">{cross.caveat}</Alert>
          <p>{cross.why}</p>
          <p className="hint">如果啟用，這批資料會有 {cross.candidateCountIfEnabled} 個候選。</p>
          <p className="hint"><strong>出實驗區的條件：</strong>{cross.exitCondition}</p>
          <Empty>目前不顯示具體數值——未達出實驗區條件前顯示數字，看到本身就會影響判斷。</Empty>
        </Card>
      )}
    </div>
  )
}
