import React, { useEffect, useState, useCallback } from 'react'
import { growth } from './api.js'
import { Loading, Alert, Badge } from '../components/ui.jsx'
import CommandCenter from './sections/CommandCenter.jsx'
import ProductBoard from './sections/ProductBoard.jsx'
import OpportunityRadar from './sections/OpportunityRadar.jsx'
import ExperimentLab from './sections/ExperimentLab.jsx'
import WinnerFactory from './sections/WinnerFactory.jsx'
import PersonaPortfolio from './sections/PersonaPortfolio.jsx'
import Distribution from './sections/Distribution.jsx'
import FunnelAttribution from './sections/FunnelAttribution.jsx'
import UnitEconomics from './sections/UnitEconomics.jsx'
import ReviewCompliance from './sections/ReviewCompliance.jsx'
import SystemOps from './sections/SystemOps.jsx'

/**
 * Growth OS — DASHBOARD_SPEC.md §2 information architecture.
 *
 * The nav is the acquisition loop, in order, not a list of content types. The
 * one addition to the spec's ten is `00 產品`, because the question this
 * dashboard was commissioned to answer — 每一個產品進入 Growth OS 的狀態 — is a
 * product-level question and belongs at the front.
 */

const SECTIONS = [
  { key: 'products', label: '00 產品狀態', hint: '每個產品走到 Growth OS 的哪一格' },
  { key: 'command', label: '01 指揮中心', hint: '整體狀態與待處理事項' },
  { key: 'radar', label: '02 議題雷達', hint: '事件、訊號與可測題目' },
  { key: 'lab', label: '03 實驗室', hint: '實驗契約、arms 與生成' },
  { key: 'winners', label: '04 Winner 工廠', hint: '判定、變異與 lineage' },
  { key: 'personas', label: '05 人設組合', hint: '人設作為獲客資產' },
  { key: 'distribution', label: '06 下發', hint: '帳號、發布與平台健康' },
  { key: 'funnel', label: '07 漏斗與歸因', hint: '從曝光到產品轉換' },
  { key: 'economics', label: '08 單位經濟', hint: '成本、貢獻與資源配置' },
  { key: 'review', label: '09 審查與合規', hint: '檢查機制與事故' },
  { key: 'ops', label: '10 系統維運', hint: 'Job、adapter 與資料新鮮度' },
]

export default function GrowthTab() {
  const [meta, setMeta] = useState(null)
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState(null)
  const [section, setSection] = useState('products')
  const [productId, setProductId] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), [])

  useEffect(() => {
    Promise.all([growth.meta(), growth.overview()])
      .then(([m, o]) => {
        setMeta(m)
        setOverview(o)
      })
      .catch((e) => setError(e.message))
  }, [refreshToken])

  if (error) return <Alert tone="bad">無法載入 Growth OS：{error}</Alert>
  if (!meta || !overview) return <Loading>載入 Growth OS…</Loading>

  const products = overview.board ?? []
  const scoped = productId || null
  const shared = { meta, overview, productId: scoped, refresh, products }

  return (
    <div className="ghos">
      <div className="ghos-head">
        <div className="row" style={{ gap: 8 }}>
          <h2>Growth Hack OS</h2>
          <Badge tone={overview.products.compounding > 0 ? 'good' : 'warn'}>
            {overview.products.compounding}/{overview.products.total} 產品已進入複利
          </Badge>
          <Badge tone={overview.incidents.open > 0 ? 'bad' : 'good'}>
            {overview.incidents.open} 個未結案事故
          </Badge>
          <Badge>evaluator v{meta.evaluator.version}</Badge>
          <Badge>歸因 {meta.attribution.model}</Badge>
        </div>
        {/* Global product filter — DASHBOARD_SPEC.md §2 全站 filter. */}
        <label className="row small" style={{ gap: 6, marginLeft: 'auto' }}>
          <span className="muted">產品</span>
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">全部產品</option>
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>{p.name}</option>
            ))}
          </select>
        </label>
        <button onClick={refresh}>重新整理</button>
      </div>

      <nav className="ghos-nav">
        {SECTIONS.map((s) => (
          <button key={s.key} className={`ghos-navitem ${section === s.key ? 'on' : ''}`} onClick={() => setSection(s.key)} title={s.hint}>
            {s.label}
          </button>
        ))}
      </nav>

      <div className="ghos-body">
        {section === 'products' && <ProductBoard {...shared} />}
        {section === 'command' && <CommandCenter {...shared} onGoto={setSection} />}
        {section === 'radar' && <OpportunityRadar {...shared} />}
        {section === 'lab' && <ExperimentLab {...shared} />}
        {section === 'winners' && <WinnerFactory {...shared} />}
        {section === 'personas' && <PersonaPortfolio {...shared} />}
        {section === 'distribution' && <Distribution {...shared} />}
        {section === 'funnel' && <FunnelAttribution {...shared} />}
        {section === 'economics' && <UnitEconomics {...shared} />}
        {section === 'review' && <ReviewCompliance {...shared} />}
        {section === 'ops' && <SystemOps {...shared} />}
      </div>
    </div>
  )
}
