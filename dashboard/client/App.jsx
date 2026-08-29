import React, { useEffect, useState } from 'react'
import { api } from './api.js'
import { Badge, Loading, Alert } from './components/ui.jsx'
import KolProfileTab from './tabs/KolProfileTab.jsx'
import CreateTab from './tabs/CreateTab.jsx'
import ExploreTab from './tabs/ExploreTab.jsx'
import PlansTab from './tabs/PlansTab.jsx'
import TopicsTab from './tabs/TopicsTab.jsx'
import EvaluationTab from './tabs/EvaluationTab.jsx'
import GrowthTab from './growth/GrowthTab.jsx'

const TABS = [
  { key: 'create', label: '① 引導式建立 KOL' },
  { key: 'kol', label: '② KOL 屬性與人設' },
  { key: 'explore', label: '③ 話題探索' },
  { key: 'plans', label: '④ 內容企劃' },
  { key: 'topics', label: '⑤ 交叉查詢與作業流程' },
  { key: 'evaluation', label: '⑥ 前後評估' },
  { key: 'growth', label: '⑦ Growth OS' },
]

export default function App() {
  const [meta, setMeta] = useState(null)
  const [kols, setKols] = useState([])
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('kol')
  const [notes, setNotes] = useState(null)
  const [scoring, setScoring] = useState(null)
  const [selectedKolId, setSelectedKolId] = useState(null)
  const [evalRefresh, setEvalRefresh] = useState(0)

  useEffect(() => {
    Promise.all([api.meta(), api.kols(), api.notes(), api.scoringConfig()])
      .then(([m, k, n, c]) => {
        setMeta(m)
        setKols(k.kols)
        setNotes(n.byKey)
        setScoring(c)
        setSelectedKolId(k.kols[0]?.id ?? null)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="page"><Alert tone="bad">無法載入資料：{error}</Alert></div>
  if (!meta) return <Loading />

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Buildup KOL Dashboard</h1>
          <small>KOL 屬性評估 · 地區話題交叉查詢 · 導流素材前後評估</small>
        </div>
        <div className="row">
          <Badge>{kols.length} 位 KOL</Badge>
          <Badge tone={meta.topicSource === 'apify' ? 'good' : 'warn'}>
            話題來源：{meta.topicSource === 'apify' ? 'Apify' : '範例資料'}
          </Badge>
          {/*
            DATA_DIR being set does not prove a volume is mounted there, so the
            badge reports the thing the server can actually observe. Claiming
            「已持久化」 from an env var is how a redeploy silently eats a
            week of records — see dashboard/README.md 踩過的坑（二）.
          */}
          <Badge
            tone={meta.store.dataDirConfigured ?? meta.store.persistent ? 'good' : 'warn'}
            title={
              meta.store.dataDirConfigured ?? meta.store.persistent
                ? `寫入 ${meta.store.dataDir}。這只代表 DATA_DIR 已設定——是否真的掛了 volume 要到 Railway 的 Volumes 分頁確認。`
                : '未設定 DATA_DIR，資料寫在容器內，重新部署就會清空。'
            }
          >
            {meta.store.dataDirConfigured ?? meta.store.persistent ? `DATA_DIR → ${meta.store.dataDir}` : '資料為暫存（未設 DATA_DIR）'}
          </Badge>
          {/* docs/11 §3.3 — this belongs on the front page, not buried in a doc. */}
          {scoring && (
            <Badge tone={scoring.calibrationSummary.calibrated > 0 ? 'good' : 'warn'}>
              {scoring.calibrationSummary.banner}
            </Badge>
          )}
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page">
        {tab === 'create' && <CreateTab />}
        {tab === 'explore' && <ExploreTab regions={meta.regions} />}
        {tab === 'plans' && <PlansTab kols={kols} regions={meta.regions} notes={notes} />}
        {tab === 'kol' && (
          <KolProfileTab meta={meta} kols={kols} selectedId={selectedKolId} onSelect={setSelectedKolId} />
        )}
        {tab === 'topics' && (
          <TopicsTab
            meta={meta}
            kols={kols}
            selectedKolId={selectedKolId}
            onSelectKol={setSelectedKolId}
            onPreEvaluationSaved={() => setEvalRefresh((n) => n + 1)}
          />
        )}
        {tab === 'evaluation' && <EvaluationTab kols={kols} refreshToken={evalRefresh} />}
        {tab === 'growth' && <GrowthTab />}
      </main>
    </div>
  )
}
