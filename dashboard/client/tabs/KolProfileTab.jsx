import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Card, Band, Badge, Bar, Loading, Empty, Alert, Radar, RadarLegend, SERIES_KOL, SERIES_TOPIC, toneFor } from '../components/ui.jsx'

export default function KolProfileTab({ meta, kols, selectedId, onSelect }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [openHook, setOpenHook] = useState(null)

  const domainLabel = Object.fromEntries(meta.domains.map((d) => [d.key, d.label_zh]))

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

  const axisValues = detail?.axes
    ? Object.fromEntries(Object.entries(detail.axes).map(([k, v]) => [k, v.score]))
    : {}
  const activeHook = detail?.hooks?.find((h) => h.id === openHook) ?? null

  return (
    <div className="grid sidebar">
      <div>
        <Card title="KOL">
          {kols.map((k) => (
            <div key={k.id} className={`list-row ${k.id === selectedId ? 'on' : ''}`} onClick={() => onSelect(k.id)}>
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
            {/* 卡片 1／4：身分 + 建模素材 */}
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
                  <Badge tone={detail.completeness.identityRefs >= 3 ? 'good' : 'warn'}>
                    身分參考圖 {detail.completeness.identityRefs}
                  </Badge>
                  <Badge>{detail.reach?.regions?.join(' › ')}｜{detail.reach?.language}</Badge>
                </div>
              }
            >
              <dl className="kv" style={{ marginBottom: 14 }}>
                <dt>原型</dt>
                <dd>{detail.persona?.archetype ?? '—'}</dd>
                <dt>語氣</dt>
                <dd className="small">{detail.persona?.voice_tone ?? '—'}</dd>
                <dt>視覺語言</dt>
                <dd className="small">{detail.aesthetic?.editing_style ?? '—'}</dd>
                <dt>生成條件</dt>
                <dd className="small">
                  {detail.materialAttributes?.generation_model ?? '—'}（{detail.materialAttributes?.consistency ?? '—'}）
                  ｜可用格式：{(detail.materialAttributes?.usable_formats ?? []).join('、') || '—'}
                </dd>
              </dl>
              {detail.images.length === 0 ? (
                <Empty>此 KOL 目錄下沒有圖像檔案。</Empty>
              ) : (
                <div className="gallery">
                  {detail.images.map((img) => (
                    <figure key={img.file}>
                      <img src={img.url} alt={img.label} loading="lazy" />
                      <figcaption>
                        {img.role === 'identity_ref' ? '身分參考' : img.role === 'avatar' ? '頭像' : '場景'}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </Card>

            {/* 卡片 2／4：四軸雷達（依據收在 hover） */}
            <Card
              title="四軸屬性向量"
              note="這位 KOL 可以發揮的屬性強度。Match 計算時，話題需求高的軸權重最大。滑過分數可看該軸的判定依據。"
              actions={
                detail.formatFit && (
                  <Badge tone={detail.formatFit.score >= 70 ? 'good' : ''} title={detail.formatFit.why}>
                    日常適配 {detail.formatFit.score}（不計分）
                  </Badge>
                )
              }
            >
              {!detail.axes ? (
                <Alert tone="warn">此 KOL 缺少 topic_affinity.json，無法計算屬性向量。</Alert>
              ) : (
                <div className="grid two">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Radar
                        axes={meta.axes}
                        series={[
                          { label: detail.name, values: axisValues, ...SERIES_KOL },
                          ...(activeHook ? [{ label: '所選連結點需求', values: activeHook.axisDemand ?? {}, ...SERIES_TOPIC }] : []),
                        ]}
                      />
                    </div>
                    <RadarLegend
                      series={[
                        { label: '人設可發揮屬性', ...SERIES_KOL },
                        ...(activeHook ? [{ label: '所選連結點的軸需求', ...SERIES_TOPIC }] : []),
                      ]}
                    />
                  </div>
                  <table>
                    <tbody>
                      {meta.axes.map((axis) => {
                        const cell = detail.axes[axis.key]
                        return (
                          <tr key={axis.key} title={cell?.why ?? ''}>
                            <td style={{ width: 90 }}>{axis.label_zh}</td>
                            <td className="num" style={{ width: 44 }}>
                              {cell?.score ?? '—'}
                            </td>
                            <td>
                              <Bar value={cell?.score ?? 0} tone={toneFor(cell?.score ?? 0)} />
                            </td>
                          </tr>
                        )
                      })}
                      <tr title={detail.formatFit?.why ?? ''} className="muted">
                        <td>日常適配</td>
                        <td className="num">{detail.formatFit?.score ?? '—'}</td>
                        <td className="small">不進 Match，供素材企劃判斷切角</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* 卡片 3／4：時事話題連結點 */}
            <Card
              title="時事與話題連結屬性"
              note="這位 KOL 與網路時事／文化的固定連結點。分數為完整 Match（人設 35% ＋ 支柱 30% ＋ 熱度 20% ＋ 地區 15%）；紅線是 gate，不參與加權。"
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
                      <div className="score sm" style={{ width: 52 }}>
                        {hook.match.screeningScore ?? '—'}
                      </div>
                      <Band band={hook.match.band} />
                      <div className="grow">
                        <div className="title">{hook.title}</div>
                        <div className="sub">
                          {domainLabel[hook.domain] ?? hook.domain} · 支柱：{hook.pillar}
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
                        {/* docs/11 §2 — 三維等權，熱度與地區已不在總分內 */}
                        <table>
                          <tbody>
                            {[
                              ['人設契合', hook.match.dimensions?.fit?.score,
                                `最弱軸：${hook.match.dimensions?.fit?.weakest?.label ?? '—'}`],
                              ['支柱契合', hook.match.dimensions?.pillar?.score,
                                hook.match.dimensions?.pillar?.pillar ?? '無支柱對應'],
                              ['相似性', hook.match.dimensions?.homophily?.score,
                                hook.match.dimensions?.homophily?.explain ?? '尚未宣告'],
                            ].map(([label, score, note]) => (
                              <tr key={label}>
                                <td style={{ width: 80 }}>{label}</td>
                                <td className="num" style={{ width: 46 }}>{score ?? '—'}</td>
                                <td className="num muted" style={{ width: 40 }}>1/3</td>
                                <td className="small muted">{note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="small muted">
                          時機（{hook.match.timing?.label}）：{hook.match.timing?.value ?? '—'}——不進總分。
                        </p>
                        {hook.match.warnings?.length > 0 && (
                          <Alert tone="warn">
                            紅線警示（不扣分，但要看見）：
                            {hook.match.warnings.map((w) => `${w.id}｜${w.title}`).join('；')}
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </Card>

            {/* 卡片 4／4：紅線 */}
            <Card title="紅線" note="block 會讓話題不進推薦清單；warn 照常排序，但把風險擺出來。不做扣分。">
              <div className="stack">
                {detail.redlines.map((r) => (
                  <div key={r.rule} className="row" style={{ alignItems: 'flex-start' }}>
                    <Badge tone={r.severity === 'block' ? 'bad' : 'warn'}>
                      {r.severity === 'block' ? '擋下來' : '標示出來'}
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
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
