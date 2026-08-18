import React, { useEffect, useState } from 'react'
import { api } from './api.js'
import { Badge, Loading, Alert } from './components/ui.jsx'
import KolProfileTab from './tabs/KolProfileTab.jsx'
import TopicsTab from './tabs/TopicsTab.jsx'
import EvaluationTab from './tabs/EvaluationTab.jsx'

const TABS = [
  { key: 'kol', label: '① KOL 屬性與人設' },
  { key: 'topics', label: '② 地區話題與作業流程' },
  { key: 'evaluation', label: '③ 導流素材前後評估' },
]

export default function App() {
  const [meta, setMeta] = useState(null)
  const [kols, setKols] = useState([])
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('kol')
  const [selectedKolId, setSelectedKolId] = useState(null)
  const [evalRefresh, setEvalRefresh] = useState(0)

  useEffect(() => {
    Promise.all([api.meta(), api.kols()])
      .then(([m, k]) => {
        setMeta(m)
        setKols(k.kols)
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
          <Badge tone={meta.store.persistent ? 'good' : 'warn'}>
            {meta.store.persistent ? '資料已持久化' : '資料為暫存（未掛載 volume）'}
          </Badge>
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
      </main>
    </div>
  )
}
