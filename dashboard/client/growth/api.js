const request = async (path, options = {}) => {
  const res = await fetch(`/api/growth${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', 'x-ghos-actor': 'dashboard', ...(options.headers ?? {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body.error ?? `${res.status} ${res.statusText}`)
    err.fieldErrors = body.errors ?? null
    throw err
  }
  return body
}

const post = (path, payload) => request(path, { method: 'POST', body: JSON.stringify(payload ?? {}) })
const patch = (path, payload) => request(path, { method: 'PATCH', body: JSON.stringify(payload ?? {}) })
const put = (path, payload) => request(path, { method: 'PUT', body: JSON.stringify(payload ?? {}) })
const qs = (params) => {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v != null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries)}` : ''
}

export const growth = {
  meta: () => request('/meta'),

  // 產品特性分析
  products: () => request('/products'),
  product: (id) => request(`/products/${id}`),
  createProduct: (payload) => post('/products', payload),
  updateProduct: (id, payload) => patch(`/products/${id}`, payload),
  analyseProduct: (id) => post(`/products/${id}/analyse`),
  defineConversion: (id, payload) => post(`/products/${id}/conversions`, payload),
  campaigns: (productId) => request(`/campaigns${qs({ productId })}`),
  createCampaign: (payload) => post('/campaigns', payload),

  // 事件查找
  signals: (params) => request(`/signals${qs(params)}`),
  scanSignals: (payload) => post('/signals/scan', payload),
  createSignal: (payload) => post('/signals', payload),

  // 議題
  opportunities: (params) => request(`/opportunities${qs(params)}`),
  opportunity: (id) => request(`/opportunities/${id}`),
  createOpportunity: (payload) => post('/opportunities', payload),
  // signalId omitted → a manual draft built from the product analysis alone.
  draftOpportunity: (signalId, productId) => request(`/opportunities/draft${qs({ signalId, productId })}`),
  setOpportunityStatus: (id, status, reason) => patch(`/opportunities/${id}/status`, { status, reason }),
  route: (id) => request(`/opportunities/${id}/route`),

  // 人設
  personas: (productId) => request(`/personas${qs({ productId })}`),
  persona: (id, productId) => request(`/personas/${id}${qs({ productId })}`),
  setOverlay: (id, payload) => put(`/personas/${id}/overlay`, payload),
  personaPerformance: (id, productId) => request(`/personas/${id}/performance${qs({ productId })}`),

  // 實驗
  experiments: (params) => request(`/experiments${qs(params)}`),
  experiment: (id) => request(`/experiments/${id}`),
  createExperiment: (payload) => post('/experiments', payload),
  addArm: (id, payload) => post(`/experiments/${id}/arms`, payload),
  generate: (id, payload) => post(`/experiments/${id}/generate`, payload),
  evaluate: (id) => post(`/experiments/${id}/evaluate`),
  clone: (id, payload) => post(`/experiments/${id}/clone`, payload),

  // AIGC
  adapters: () => request('/adapters'),
  templates: () => request('/prompt-templates'),
  brief: (armId, payload) => post(`/arms/${armId}/brief`, payload),
  generateArm: (armId, payload) => post(`/arms/${armId}/generate`, payload),
  registerAsset: (armId, payload) => post(`/arms/${armId}/assets`, payload),

  // 檢查
  reviewQueue: (productId) => request(`/reviews/queue${qs({ productId })}`),
  runGate: (assetId) => post(`/assets/${assetId}/gate`),
  decide: (assetId, payload) => post(`/assets/${assetId}/review`, payload),
  reviews: (params) => request(`/reviews${qs(params)}`),
  incidents: (params) => request(`/incidents${qs(params)}`),
  recordIncident: (pubId, payload) => post(`/publications/${pubId}/incident`, payload),

  // 下發
  accounts: () => request('/accounts'),
  createAccount: (payload) => post('/accounts', payload),
  setAccountStatus: (id, status, reason) => patch(`/accounts/${id}/status`, { status, reason }),
  publications: (params) => request(`/publications${qs(params)}`),
  schedulePublication: (payload) => post('/publications', payload),
  publish: (id, payload) => post(`/publications/${id}/publish`, payload),
  ingestMetrics: (id, payload) => post(`/publications/${id}/metrics`, payload),

  // 轉換與歸因
  ingestConversion: (payload) => post('/conversions', payload),
  attribution: (params) => request(`/attribution${qs(params)}`),
  trace: (id) => request(`/conversions/${id}/trace`),
  trackingLinks: (params) => request(`/tracking-links${qs(params)}`),

  // Winner
  winners: (productId) => request(`/winners${qs({ productId })}`),
  lineage: (productId) => request(`/lineage${qs({ productId })}`),
  cloneLift: (armId) => request(`/arms/${armId}/clone-lift`),
  mutations: (params) => request(`/mutations${qs(params)}`),

  // 成本與組合
  unitEconomics: (productId) => request(`/unit-economics${qs({ productId })}`),
  costs: (params) => request(`/costs${qs(params)}`),

  // Dashboard
  overview: () => request('/dashboard/overview'),
  board: () => request('/dashboard/board'),
  ops: () => request('/ops'),
}
