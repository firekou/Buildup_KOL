import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { Card, Band, Badge, Bar, Loading, Empty, Alert, num, toneFor } from '../components/ui.jsx'

const SOURCE_LABEL = {
  apify: { tone: 'good', text: 'Apify 即時資料' },
  apify_partial: { tone: 'warn', text: 'Apify（部分平台失敗）' },
  fixtures: { tone: 'warn', text: '範例資料（未設定 APIFY_TOKEN）' },
  fixtures_fallback: { tone: 'bad', text: '範例資料（Apify 呼叫失敗，已退回）' },
}

const DIRECTIONS = [
  { key: 'a', label: '(a) 從 KOL 找話題' },
  { key: 'b', label: '(b) 從話題找 KOL' },
  { key: 'c', label: '(c) 組合產出素材企劃' },
]

export default function TopicsTab({ meta, kols, selectedKolId, onSelectKol, onPreEvaluationSaved }) {
  const [region, setRegion] = useState('SG')
  const [platforms, setPlatforms] = useState(meta.platforms)
  const [topicSet, setTopicSet] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [runError, setRunError] = useState(null)

  const [direction, setDirection] = useState('a')
  const [selectedTopicIds, setSelectedTopicIds] = useState([])
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)

  const [crossTags, setCrossTags] = useState('')
  const [crossMode, setCrossMode] = useState('intersection')
  const [crossResult, setCrossResult] = useState(null)

  const [fourAxis, setFourAxis] = useState({ entertaining: 4, musicality: 4, authenticity: 4, motionFluency: 4 })
  const [targets, setTargets] = useState({ views: '', linkClicks: '' })
  const [saveMsg, setSaveMsg] = useState(null)

  const domainLabel = useMemo(
    () => Object.fromEntries(meta.domains.map((d) => [d.key, d.label_zh])),
    [meta.domains],
  )

  const loadTopics = (refresh = false) => {
    setLoading(true)
    setError(null)
    api
      .topics({ region, platforms, limit: 10, refresh })
      .then(setTopicSet)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTopics(false)
    setSelectedTopicIds([])
    setResult(null)
    setCrossResult(null)
  }, [region, platforms.join(',')])

  const togglePlatform = (p) =>
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const toggleTopic = (id) =>
    setSelectedTopicIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 3)))

  const runWorkflow = async () => {
    setRunning(true)
    setRunError(null)
    setResult(null)
    setSaveMsg(null)
    try {
      if (direction === 'a') {
        setResult(await api.kolToTopics({ kolId: selectedKolId, region, platforms }))
      } else if (direction === 'b') {
        const topic = topicSet?.topics.find((t) => t.id === selectedTopicIds[0])
        if (!topic) throw new Error('請先在上方話題清單勾選一個話題')
        setResult(await api.topicToKols({ region, platforms, topicId: topic.id, tag: topic.tag, title: topic.title, domain: topic.domain }))
      } else {
        if (!selectedTopicIds.length) throw new Error('請先勾選 1–3 個話題')
        setResult(
          await api.combination({
            kolId: selectedKolId,
            region,
            platforms,
            topicIds: selectedTopicIds,
            fourAxis,
            targets: { views: Number(targets.views) || null, linkClicks: Number(targets.linkClicks) || null },
          }),
        )
      }
    } catch (e) {
      setRunError(e.message)
    } finally {
      setRunning(false)
    }
  }

  const runCrossQuery = async () => {
    const tags = crossTags.split(/[\s,，]+/).filter(Boolean)
    if (!tags.length) return
    try {
      setCrossResult(await api.crossQuery({ region, tags, mode: crossMode, platforms }))
    } catch (e) {
      setError(e.message)
    }
  }

  const savePre = async () => {
    try {
      const saved = await api.savePre(result.preEvaluation)
      setSaveMsg(`已存入預評記錄 ${saved.id}——切到「前後評估」頁簽即可回填實際成效。`)
      onPreEvaluationSaved?.(saved)
    } catch (e) {
      setRunError(e.message)
    }
  }

  const src = SOURCE_LABEL[topicSet?.source] ?? { tone: '', text: topicSet?.source ?? '—' }

  /**
   * 按下去才報錯是最差的回饋——尤其錯誤訊息還可能渲染在畫面外。
   * 先算出缺什麼，直接標在按鈕旁邊。
   */
  const missing = (() => {
    if (direction === 'a') return selectedKolId ? null : '請先選一位 KOL'
    if (direction === 'b') return selectedTopicIds.length ? null : '請先在上方話題清單勾選一個話題'
    if (!selectedKolId) return '請先選一位 KOL'
    if (!selectedTopicIds.length) return '請先在上方話題清單勾選 1–3 個話題'
    return null
  })()

  return (
    <>
      <Card
        title="地區前十大話題"
        actions={
          <div className="row">
            <Badge tone={src.tone}>{src.text}</Badge>
            {topicSet?.cached && <Badge>快取</Badge>}
            <button onClick={() => loadTopics(true)} disabled={loading}>
              重新抓取
            </button>
          </div>
        }
        note={
          topicSet?.volumeMeaning === 'sample_frequency'
            ? `Apify 實抓 ${topicSet.postsScraped ?? 0} 則貼文，統計其中的 hashtag。「帳號數」是使用該 tag 的不重複帳號數（不是平台總量——三個 actor 都不回傳這種欄位）；「48h」是該 tag 的貼文有多少比例來自最近兩天。熱度 = 60% 帳號數（對數）＋ 40% 48h 佔比，皆為本批內的相對位置。搜尋用的種子字已排除。`
            : '資料來源：Apify（Threads / TikTok / Instagram）。目前顯示的是手寫範例資料，數字不是真的。熱度 = 60% 量體（對數）＋ 40% 七日成長率。'
        }
      >
        <div className="controls" style={{ marginBottom: 14 }}>
          <div>
            <label>地區</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {meta.regions.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label_zh}（{r.key}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>平台</label>
            <div className="chips">
              {meta.platforms.map((p) => (
                <span
                  key={p}
                  className={`chip selectable ${platforms.includes(p) ? 'on' : ''}`}
                  onClick={() => togglePlatform(p)}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {topicSet?.errors?.length > 0 && (
          <Alert tone="warn">
            {topicSet.errors.map((e) => `${e.platform}: ${e.message}`).join('；')}
          </Alert>
        )}

        {loading && <Loading />}
        {error && <Alert tone="bad">{error}</Alert>}
        {!loading && topicSet && (
          <div className="scroll-x">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 34 }}>#</th>
                  <th style={{ width: 34 }} />
                  <th>話題</th>
                  <th style={{ width: 90 }}>領域</th>
                  <th className="num" style={{ width: 80 }}>
                    {topicSet.volumeMeaning === 'sample_frequency' ? '帳號數' : '量體'}
                  </th>
                  <th className="num" style={{ width: 70 }}>
                    {topicSet.volumeMeaning === 'sample_frequency' ? '48h' : '7日成長'}
                  </th>
                  <th style={{ width: 120 }}>熱度</th>
                  <th style={{ width: 150 }}>平台</th>
                </tr>
              </thead>
              <tbody>
                {topicSet.topics.map((t, i) => (
                  <tr key={t.id}>
                    <td className="num muted">{i + 1}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTopicIds.includes(t.id)}
                        onChange={() => toggleTopic(t.id)}
                        style={{ width: 'auto' }}
                      />
                    </td>
                    <td>
                      <div className="mono">{t.tag}</div>
                      <div className="small muted">{t.title}</div>
                    </td>
                    <td className="small">{domainLabel[t.domain] ?? t.domain}</td>
                    <td className="num" title={t.postCount ? `${t.postCount} 則貼文` : ''}>
                      {num(t.volume)}
                      {t.postCount ? <span className="muted small"> /{t.postCount}</span> : null}
                    </td>
                    <td className="num">{t.recencyRatio48h == null ? '—' : `${Math.round(t.recencyRatio48h)}%`}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="mono small" style={{ width: 30 }}>
                          {Math.round(t.heat)}
                        </span>
                        <div style={{ flex: 1 }}>
                          <Bar value={t.heat} tone={toneFor(t.heat)} />
                        </div>
                      </div>
                    </td>
                    <td className="small muted">{t.platforms.map((p) => p.platform).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="交叉查詢"
        note="多個 Tag 之間做交集或聯集。實務上最有價值的是兩個 Tag 的交集——單一 Tag 太大，三個以上通常無資料。"
      >
        <div className="controls">
          <div style={{ flex: 1, minWidth: 240 }}>
            <label>Tag（空白或逗號分隔）</label>
            <input
              value={crossTags}
              onChange={(e) => setCrossTags(e.target.value)}
              placeholder="例：城市 建築"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>模式</label>
            <select value={crossMode} onChange={(e) => setCrossMode(e.target.value)}>
              <option value="intersection">交集</option>
              <option value="union">聯集</option>
            </select>
          </div>
          <button onClick={runCrossQuery}>查詢</button>
        </div>

        {crossResult && (
          <div style={{ marginTop: 12 }}>
            {crossResult.note && <Alert tone="warn">{crossResult.note}</Alert>}
            {crossResult.matched.length === 0 ? (
              <Empty>沒有符合的話題。</Empty>
            ) : (
              crossResult.matched.map((t) => (
                <div
                  key={t.id}
                  className={`list-row ${selectedTopicIds.includes(t.id) ? 'on' : ''}`}
                  onClick={() => toggleTopic(t.id)}
                >
                  <div className="mono" style={{ width: 40 }}>
                    {Math.round(t.heat)}
                  </div>
                  <div className="grow">
                    <div className="title mono">{t.tag}</div>
                    <div className="sub">{t.title}</div>
                  </div>
                  <Badge>{domainLabel[t.domain] ?? t.domain}</Badge>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      <Card
        title="作業流程"
        note="三個方向共用同一個 Match 引擎，差別只在什麼被固定、什麼被排序。"
        actions={
          <div className="chips">
            {DIRECTIONS.map((d) => (
              <span
                key={d.key}
                className={`chip selectable ${direction === d.key ? 'on' : ''}`}
                onClick={() => {
                  setDirection(d.key)
                  setResult(null)
                  setSaveMsg(null)
                }}
              >
                {d.label}
              </span>
            ))}
          </div>
        }
      >
        <div className="controls" style={{ marginBottom: 12 }}>
          {(direction === 'a' || direction === 'c') && (
            <div>
              <label>KOL</label>
              <select value={selectedKolId} onChange={(e) => onSelectKol(e.target.value)}>
                {kols.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {(direction === 'b' || direction === 'c') && (
            <div>
              <label>已勾選話題（上方表格）</label>
              <div className="chips">
                {selectedTopicIds.length === 0 ? (
                  <span className="muted small">尚未勾選</span>
                ) : (
                  selectedTopicIds.map((id) => (
                    <span key={id} className="chip on selectable" onClick={() => toggleTopic(id)}>
                      {id} ✕
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
          {direction === 'c' && (
            <>
              <div>
                <label>目標觀看</label>
                <input
                  type="number"
                  value={targets.views}
                  onChange={(e) => setTargets({ ...targets, views: e.target.value })}
                  placeholder="這支要達到多少"
                  style={{ width: 130 }}
                />
              </div>
              <div>
                <label>目標外連點擊</label>
                <input
                  type="number"
                  value={targets.linkClicks}
                  onChange={(e) => setTargets({ ...targets, linkClicks: e.target.value })}
                  placeholder="導流目標"
                  style={{ width: 120 }}
                />
              </div>
              <div>
                <label>四維自評（檢查清單，不擋開工）</label>
                <div className="row">
                  {[
                    ['entertaining', '娛樂'],
                    ['musicality', '音樂'],
                    ['authenticity', '真實'],
                    ['motionFluency', '流暢'],
                  ].map(([key, label]) => (
                    <span key={key} className="row" style={{ gap: 4 }}>
                      <span className="small muted">{label}</span>
                      <select
                        value={fourAxis[key]}
                        onChange={(e) => setFourAxis({ ...fourAxis, [key]: Number(e.target.value) })}
                        style={{ padding: '4px 6px' }}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
            <button className="primary" onClick={runWorkflow} disabled={running || Boolean(missing)}>
              {running ? '計算中…' : '執行'}
            </button>
            {missing && (
              <div className="small warn-text" style={{ marginTop: 4 }}>
                {missing}
              </div>
            )}
          </div>
        </div>

        {runError && <Alert tone="bad">執行失敗：{runError}</Alert>}
        {saveMsg && <Alert tone="good">{saveMsg}</Alert>}
        {running && <Loading>計算中…第一次抓某個地區要跑三個 actor，約 40–90 秒。</Loading>}

        {result?.direction === 'kol_to_topics' && (
          <KolToTopics result={result} domainLabel={domainLabel} />
        )}
        {result?.direction === 'topic_to_kols' && <TopicToKols result={result} />}
        {result?.direction === 'combination_to_brief' && (
          <Combination result={result} onSave={savePre} />
        )}
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ (a) */

function KolToTopics({ result, domainLabel }) {
  return (
    <>
      <h4>推薦話題（{result.kol.name}）</h4>
      {result.recommended.length === 0 && <Empty>此地區沒有可用話題。</Empty>}
      {result.recommended.map(({ topic, match }) => (
        <div key={topic.id} className="list-row" style={{ cursor: 'default' }}>
          <div className="score sm" style={{ width: 52 }}>
            {match.screeningScore ?? '—'}
          </div>
          <Band band={match.band} />
          <div className="grow">
            <div className="title mono">{topic.tag}</div>
            <div className="sub">{match.rationale}</div>
          </div>
          <Badge>{domainLabel[topic.domain] ?? topic.domain}</Badge>
        </div>
      ))}

      {result.excluded.length > 0 && (
        <>
          <h4 style={{ marginTop: 16 }}>已排除（紅線命中）</h4>
          {result.excluded.map(({ topic, match }) => (
            <div key={topic.id} className="list-row" style={{ cursor: 'default', borderColor: '#6b2020' }}>
              <Band band={match.band} />
              <div className="grow">
                <div className="title mono">{topic.tag}</div>
                <div className="sub">{match.rationale}</div>
              </div>
            </div>
          ))}
        </>
      )}

      <h4 style={{ marginTop: 16 }}>自有連結點（不吃當期時效的底盤）</h4>
      {result.hooks.map(({ hook, match }) => (
        <div key={hook.id} className="list-row" style={{ cursor: 'default' }}>
          <div className="score sm" style={{ width: 52 }}>
            {match.screeningScore ?? '—'}
          </div>
          <Band band={match.band} />
          <div className="grow">
            <div className="title">{hook.title}</div>
            <div className="sub">{hook.angle}</div>
          </div>
          <Badge tone={hook.evergreen ? 'good' : 'warn'}>{hook.evergreen ? '長青' : '需搭時事'}</Badge>
        </div>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ (b) */

function TopicToKols({ result }) {
  return (
    <>
      <h4>
        話題 <span className="mono">{result.topic.tag}</span> — {result.topic.title}
      </h4>
      {result.recommended.map(({ kol, match }) => (
        <div key={kol.id} className="list-row" style={{ cursor: 'default' }}>
          <div className="score sm" style={{ width: 52 }}>
            {match.screeningScore ?? '—'}
          </div>
          <Band band={match.band} />
          <div className="grow">
            <div className="title">{kol.name}</div>
            <div className="sub">{match.rationale}</div>
          </div>
        </div>
      ))}
      {result.excluded.length > 0 && (
        <>
          <h4 style={{ marginTop: 16 }}>已排除（紅線命中）</h4>
          {result.excluded.map(({ kol, match }) => (
            <div key={kol.id} className="list-row" style={{ cursor: 'default', borderColor: '#6b2020' }}>
              <Band band={match.band} />
              <div className="grow">
                <div className="title">{kol.name}</div>
                <div className="sub">{match.rationale}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ (c) */

function Combination({ result, onSave }) {
  const { brief, match, preEvaluation } = result
  const d = preEvaluation.decision
  const tone = d.key === 'go' ? 'good' : d.key === 'needs_target' || d.key === 'unbound' ? 'warn' : 'bad'

  return (
    <>
      <Alert tone={tone}>
        <strong>{d.label}</strong>：{d.reason}
      </Alert>

      <div className="grid two">
        <div>
          <h4>素材企劃骨架</h4>
          <dl className="kv">
            <dt>綁定支柱</dt>
            <dd>
              {brief.boundPillar ? `${brief.boundPillar.name}（${brief.boundPillar.weight}）` : '無支柱對應——需人工綁定'}
            </dd>
            <dt>建議格式</dt>
            <dd className="small">{brief.suggestedFormats.join('；') || '—'}</dd>
            <dt>可用場景</dt>
            <dd className="small">{brief.availableScenes.map((sc) => sc.label).join('、') || '—'}</dd>
            <dt>視覺語言</dt>
            <dd className="small">{brief.visualLanguage ?? '—'}</dd>
            <dt>待填</dt>
            <dd className="small muted">開場鉤子、結尾 CTA——引擎不寫文案</dd>
          </dl>

          <h4 style={{ marginTop: 14 }}>可執行性提示</h4>
          {brief.feasibility.length === 0 ? (
            <div className="muted small">無提示。</div>
          ) : (
            brief.feasibility.map((f, i) => (
              <Alert key={i} tone={f.level === 'block' ? 'bad' : f.level === 'warn' ? 'warn' : 'info'}>
                {f.message}
              </Alert>
            ))
          )}
        </div>

        <div>
          <h4>Match 分數卡</h4>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="score">{match.screeningScore ?? '—'}</span>
            <Band band={match.band} />
          </div>
          <table>
            <tbody>
              {[
                ['人設契合', match.dimensions?.fit?.score, '1/3'],
                ['支柱契合', match.dimensions?.pillar?.score, '1/3'],
                ['相似性', match.dimensions?.homophily?.score, '1/3'],
              ].map(([label, score, weight]) => (
                <tr key={label}>
                  <td style={{ width: 84 }}>{label}</td>
                  <td className="num" style={{ width: 46 }}>{score}</td>
                  <td className="num muted" style={{ width: 42 }}>{weight}</td>
                  <td>
                    <Bar value={score} tone={toneFor(score)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {match.warnings?.length > 0 && (
            <Alert tone="warn">
              紅線警示（不扣分）：{match.warnings.map((w) => `${w.id}｜${w.title}`).join('；')}
            </Alert>
          )}

          <h4 style={{ marginTop: 14 }}>本次目標</h4>
          <table>
            <tbody>
              <tr>
                <td>目標觀看</td>
                <td className="num">{preEvaluation.targets.views == null ? '未填' : num(preEvaluation.targets.views)}</td>
              </tr>
              <tr>
                <td>目標外連點擊</td>
                <td className="num">{preEvaluation.targets.linkClicks == null ? '未填' : num(preEvaluation.targets.linkClicks)}</td>
              </tr>
            </tbody>
          </table>
          <div className="small muted" style={{ marginTop: 6 }}>
            這兩個數字由企劃者填寫，不是系統預測——事後對照的是一個人做過的判斷。
          </div>

          <h4 style={{ marginTop: 14 }}>四維檢查清單</h4>
          <div className="chips">
            {preEvaluation.fourAxisChecklist.rows.map((r) => (
              <span key={r.key} className={`chip ${r.passes ? 'on' : ''}`}>
                {r.label} {r.value ?? '—'}
              </span>
            ))}
          </div>
          <div className="small muted" style={{ marginTop: 4 }}>
            成片品質判準（docs/06 Part D），發片前要跑，但不擋開工。
          </div>

          <button className="primary" style={{ marginTop: 14 }} onClick={onSave} disabled={match.blocked}>
            存為預評記錄
          </button>
        </div>
      </div>
    </>
  )
}
