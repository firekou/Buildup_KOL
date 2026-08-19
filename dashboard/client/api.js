const request = async (path, options = {}) => {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `${res.status} ${res.statusText}`)
  return body
}

const post = (path, payload) => request(path, { method: 'POST', body: JSON.stringify(payload) })

export const api = {
  meta: () => request('/meta'),
  kols: () => request('/kols'),
  kol: (id, region) => request(`/kols/${id}${region ? `?region=${region}` : ''}`),

  regions: () => request('/topics/regions'),
  topics: ({ region, platforms, limit = 10, refresh = false }) =>
    request(`/topics?region=${region}&platforms=${platforms.join(',')}&limit=${limit}&refresh=${refresh}`),
  crossQuery: (payload) => post('/topics/cross-query', payload),

  kolToTopics: ({ kolId, region, platforms, limit = 10 }) =>
    request(`/workflow/kol-to-topics?kolId=${kolId}&region=${region}&platforms=${platforms.join(',')}&limit=${limit}`),
  topicToKols: (payload) => post('/workflow/topic-to-kols', payload),
  combination: (payload) => post('/workflow/combination', payload),

  savePre: (payload) => post('/evaluations/pre', payload),
  listPre: (kolId) => request(`/evaluations/pre${kolId ? `?kolId=${kolId}` : ''}`),
  savePost: (payload) => post('/evaluations/post', payload),
  pairs: (kolId) => request(`/evaluations/pairs${kolId ? `?kolId=${kolId}` : ''}`),

  matchRecords: (kolId) => request(`/match-records${kolId ? `?kolId=${kolId}` : ''}`),
  saveMatchRecord: (payload) => post('/match-records', payload),
}
