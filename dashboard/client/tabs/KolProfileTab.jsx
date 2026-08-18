import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Grade, Badge, Bar, Loading, Empty, Alert, Radar, RadarLegend, SERIES_KOL, SERIES_TOPIC, num, pct, toneFor } from '../components/ui.jsx'

const DOMAIN_LABEL = {}

export default function KolProfileTab({ meta, kols, selectedId, onSelect }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [openHook, setOpenHook] = useState(null)

  for (const d of meta.domains) DOMAIN_LABEL[d.key] = d.label_zh

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    api
      .kol(selectedId)
      .then((d) => {
        setDetail(d)
        setOpenHook(d.hooks?.[0]?.id ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedId])

  return (
    <div className="grid sidebar">
      <div>
        <Card title="KOL">
          {kols.map((k) => (
            <div
              key={k.id}
              className={`list-row ${k.id === selectedId ? 'on' : ''}`}
              onClick={() => onSelect(k.id)}
            >
              <div className="grow">
                <div className="title">{k.name}</div>
                <div className="sub">
                  {k.projectCode} · {k.handle}
                </div>
              </div>
              <Badge>{k.hookCount} 連結點</Badge>
            </div>
          ))}
        </Card>
      </div>

      <div>
        {loading && <Loading />}
        {error && <Alert tone="bad">{error}</Alert>}
        {!loading && detail && (
          <>
            <Card
              title={
                <div>
                  <h2>
                    {detail.name} <span className="muted small">{detail.handle}</span>
                  </h2>
                  <div className="muted small">{detail.flavor}</div>
                </div>
              }
              actions={
                <div className="row">
                  <Badge>{detail.projectCode}</Badge>
                  <Badge tone={detail.status === 'active' ? 'good' : ''}>{detail.status}</Badge>
                  <Badge tone={detail.completeness.identityRefs >= 3 ? 'good' : 'warn'}>
                    身分參考圖 {detail.completeness.identityRefs}
                  </Badge>
                </div>
              }
            >
              <div className="grid two">
                <dl className="kv">
                  <dt>原型</dt>
                  <dd>{detail.persona?.archetype ?? '—'}</dd>
                  <dt>語氣</dt>
                  <dd>{detail.persona?.voice_tone ?? '—'}</dd>
                  <dt>現居</dt>
                  <dd>{detail.identity?.current_location ?? '—'}</dd>
                  <dt>語言</dt>
                  <dd>{(detail.identity?.languages ?? []).join('、') || '—'}</dd>
                  <dt>覆蓋地區</dt>
                  <dd>
                    {(detail.reach?.regions ?? []).join(' › ')}｜貼文語言 {detail.reach?.language ?? '—'}
                  </dd>
                </dl>
                <dl className="kv">
                  <dt>視覺語言</dt>
                  <dd>{detail.materialAttributes?.visual_language ?? '—'}</dd>
                  <dt>色盤</dt>
                  <dd>{(detail.materialAttributes?.color_palette ?? []).join('、') || '—'}</dd>
                  <dt>生成模型</dt>
                  <dd>
                    {detail.materialAttributes?.generation_model ?? '—'}（{detail.materialAttributes?.consistency ?? '—'}）
                  </dd>
                  <dt>可用格式</dt>
                  <dd>{(detail.materialAttributes?.usable_formats ?? []).join('、') || '—'}</dd>
                </dl>
              </div>
            </Card>

            <Card
              title="建模素材"
              note={`共 ${detail.images.length} 張可用圖像；身分參考圖是每次生成時附上的一致性依據。`}
            >
              {detail.images.length === 0 ? (
                <Empty>此 KOL 目錄下沒有圖像檔案。</Empty>
              ) : (
                <div className="gallery">
                  {detail.images.map((img) => (
                    <figure key={img.file}>
                      <img src={img.url} alt={img.label} loading="lazy" />
                      <figcaption>
                        {img.role === 'identity_ref' ? '身分參考' : img.role === 'avatar' ? '頭像' : '場景'} · {img.file}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </Card>

            <div className="grid two">
              <Card title="八軸屬性向量" note="這位 KOL 可以發揮的屬性強度。Match 計算時，話題需求高的軸權重最大。">
                {detail.axes ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Radar
                        axes={meta.axes}
                        series={[
                          { label: detail.name, values: detail.axes, ...SERIES_KOL },
                          ...(openHook
                            ? [
                                {
                                  label: '所選連結點需求',
                                  values: detail.hooks.find((h) => h.id === openHook)?.axisDemand ?? {},
                                  ...SERIES_TOPIC,
                                },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                    <RadarLegend
                      series={[
                        { label: '人設可發揮屬性', ...SERIES_KOL },
                        ...(openHook ? [{ label: '所選連結點的軸需求', ...SERIES_TOPIC }] : []),
                      ]}
                    />
                  </>
                ) : (
                  <Alert tone="warn">此 KOL 缺少 topic_affinity.json，無法計算屬性向量。</Alert>
                )}
              </Card>

              <Card title="軸分數依據" note="每個分數都要能回溯到 profile.json 的哪一句（docs/09 §0 原則二）。">
                <table>
                  <tbody>
                    {meta.axes.map((axis) => (
                      <tr key={axis.key}>
                        <td style={{ width: 92 }}>{axis.label_zh}</td>
                        <td className="num" style={{ width: 44 }}>
                          {detail.axes?.[axis.key] ?? '—'}
                        </td>
                        <td style={{ width: 70 }}>
                          <Bar value={detail.axes?.[axis.key] ?? 0} tone={toneFor(detail.axes?.[axis.key] ?? 0)} />
                        </td>
                        <td className="small muted">{detail.axisEvidence?.[axis.key] ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            <Card
              title="時事與話題連結屬性"
              note="這位 KOL 與網路上時事／文化的固定連結點。分數為完整 Match（人設契合 30% ＋ 支柱覆蓋 25% ＋ 熱度 20% ＋ 地區 15% ＋ 風險 10%）。"
            >
              {detail.hooks.length === 0 ? (
                <Empty>尚未建立話題連結點。</Empty>
              ) : (
                detail.hooks.map((hook) => (
                  <div key={hook.id}>
                    <div
                      className={`list-row ${hook.id === openHook ? 'on' : ''}`}
                      onClick={() => setOpenHook(hook.id === openHook ? null : hook.id)}
                    >
                      <div className={`score sm`} style={{ width: 52 }}>
                        {hook.match.score}
                      </div>
                      <Grade grade={hook.match.grade} />
                      <div className="grow">
                        <div className="title">{hook.title}</div>
                        <div className="sub">
                          {DOMAIN_LABEL[hook.domain] ?? hook.domain} · 支柱：{hook.pillar}
                        </div>
                      </div>
                      <Badge tone={hook.evergreen ? 'good' : 'warn'}>{hook.evergreen ? '長青' : '需搭時事'}</Badge>
                    </div>
                    {hook.id === openHook && (
                      <div className="card" style={{ margin: '0 0 12px 20px' }}>
                        <p>{hook.angle}</p>
                        <div className="chips" style={{ marginBottom: 12 }}>
                          {hook.keywords.map((k) => (
                            <span key={k} className="chip">
                              {k}
                            </span>
                          ))}
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>Match 維度</th>
                              <th className="num">分數</th>
                              <th className="num">權重</th>
                              <th>說明</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>人設契合</td>
                              <td className="num">{hook.match.dimensions.personaFit.score}</td>
                              <td className="num">30%</td>
                              <td className="small muted">
                                最弱軸：{hook.match.dimensions.personaFit.weakest?.label}（缺口{' '}
                                {hook.match.dimensions.personaFit.weakest?.gap}）
                              </td>
                            </tr>
                            <tr>
                              <td>支柱覆蓋</td>
                              <td className="num">{hook.match.dimensions.pillarFit.score}</td>
                              <td className="num">25%</td>
                              <td className="small muted">
                                {hook.match.dimensions.pillarFit.pillar ?? '無支柱對應'}
                                {hook.match.dimensions.pillarFit.bound ? '（已綁定）' : ''}
                              </td>
                            </tr>
                            <tr>
                              <td>話題熱度</td>
                              <td className="num">{hook.match.dimensions.topicHeat.score}</td>
                              <td className="num">20%</td>
                              <td className="small muted">連結點以 affinity 值代替平台熱度</td>
                            </tr>
                            <tr>
                              <td>地區契合</td>
                              <td className="num">{hook.match.dimensions.regionFit.score}</td>
                              <td className="num">15%</td>
                              <td className="small muted">
                                {hook.match.dimensions.regionFit.detail.topicRegion} vs{' '}
                                {hook.match.dimensions.regionFit.detail.kolRegions.join('、')}
                              </td>
                            </tr>
                            <tr>
                              <td>紅線風險</td>
                              <td className="num">{hook.match.dimensions.risk.score}</td>
                              <td className="num">10%</td>
                              <td className="small muted">
                                {hook.match.dimensions.risk.hits.length
                                  ? hook.match.dimensions.risk.hits.map((h) => h.keywords.join('／')).join('；')
                                  : '無命中'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </Card>

            <div className="grid two">
              <Card title="內容支柱" note="pillarFit 就是比對話題落不落得進這些支柱。">
                <table>
                  <tbody>
                    {(detail.content?.pillars ?? []).map((p) => (
                      <tr key={p.name}>
                        <td style={{ width: 200 }}>{p.name}</td>
                        <td className="num" style={{ width: 48 }}>
                          {p.weight}
                        </td>
                        <td className="small muted">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card title="紅線與導流基準">
                <h4>紅線</h4>
                <div className="stack" style={{ marginBottom: 16 }}>
                  {detail.redlines.map((r) => (
                    <div key={r.rule} className="row" style={{ alignItems: 'flex-start' }}>
                      <Badge tone={r.severity === 'veto' ? 'bad' : 'warn'}>
                        {r.severity === 'veto' ? '一票否決' : r.severity}
                      </Badge>
                      <div className="grow small">
                        {r.rule}
                        <div className="muted mono" style={{ fontSize: 11 }}>
                          {r.keywords.join(' · ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <h4>導流基準值</h4>
                {detail.baselineFunnel?.assumed !== false && (
                  <Alert tone="warn">
                    目前為假設值（尚無實績）。預測數字只能當相對排序用，累積 10 筆後評估後以 docs/09 §5 回寫。
                  </Alert>
                )}
                <dl className="kv">
                  <dt>平均觀看</dt>
                  <dd className="mono">{num(detail.baselineFunnel?.avg_views)}</dd>
                  <dt>互動率</dt>
                  <dd className="mono">{pct(detail.baselineFunnel?.engagement_rate)}</dd>
                  <dt>主頁造訪率</dt>
                  <dd className="mono">{pct(detail.baselineFunnel?.profile_visit_rate)}</dd>
                  <dt>外連點擊率</dt>
                  <dd className="mono">{pct(detail.baselineFunnel?.link_ctr)}</dd>
                  <dt>轉換率</dt>
                  <dd className="mono">{pct(detail.baselineFunnel?.conversion_rate)}</dd>
                </dl>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
