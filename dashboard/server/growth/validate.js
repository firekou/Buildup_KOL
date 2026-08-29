/**
 * Field validation used by every write endpoint.
 *
 * Deliberately hand-rolled rather than a schema library: the repo has four
 * runtime dependencies and the failure mode we care about is not "malformed
 * JSON" but "a required strategy field was left blank and the experiment
 * became unevaluable" — which needs a message a strategist can act on, in the
 * same language as the UI.
 */

export class ValidationError extends Error {
  constructor(errors) {
    super(errors.map((e) => `${e.field}: ${e.message}`).join('; '))
    this.status = 400
    this.errors = errors
  }
}

export function validator(payload = {}) {
  const errors = []
  const out = {}

  const api = {
    required(field, { label = field, min = 1, max = 4000 } = {}) {
      const value = payload[field]
      const text = typeof value === 'string' ? value.trim() : value
      if (text == null || text === '') errors.push({ field, message: `${label} 為必填` })
      else if (typeof text === 'string' && text.length < min) errors.push({ field, message: `${label} 至少 ${min} 字` })
      else if (typeof text === 'string' && text.length > max) errors.push({ field, message: `${label} 超過 ${max} 字上限` })
      else out[field] = text
      return api
    },
    optional(field, fallback = null) {
      const value = payload[field]
      out[field] = value === undefined || value === '' ? fallback : typeof value === 'string' ? value.trim() : value
      return api
    },
    oneOf(field, allowed, { label = field, required = true, fallback = null } = {}) {
      const value = payload[field]
      if (value == null || value === '') {
        if (required) errors.push({ field, message: `${label} 為必填，可選：${allowed.join(' / ')}` })
        else out[field] = fallback
        return api
      }
      if (!allowed.includes(value)) errors.push({ field, message: `${label} 必須是 ${allowed.join(' / ')} 之一，收到 "${value}"` })
      else out[field] = value
      return api
    },
    list(field, { label = field, min = 0, of = null } = {}) {
      const value = payload[field] ?? []
      if (!Array.isArray(value)) {
        errors.push({ field, message: `${label} 必須是陣列` })
        return api
      }
      if (value.length < min) errors.push({ field, message: `${label} 至少需要 ${min} 項` })
      if (of) {
        const bad = value.filter((v) => !of.includes(v))
        if (bad.length) errors.push({ field, message: `${label} 含未知值：${bad.join(', ')}` })
      }
      out[field] = value
      return api
    },
    number(field, { label = field, min = null, max = null, required = false, fallback = null } = {}) {
      const raw = payload[field]
      if (raw == null || raw === '') {
        if (required) errors.push({ field, message: `${label} 為必填` })
        else out[field] = fallback
        return api
      }
      const n = Number(raw)
      if (!Number.isFinite(n)) errors.push({ field, message: `${label} 必須是數字` })
      else if (min != null && n < min) errors.push({ field, message: `${label} 不得小於 ${min}` })
      else if (max != null && n > max) errors.push({ field, message: `${label} 不得大於 ${max}` })
      else out[field] = n
      return api
    },
    iso(field, { label = field, required = false } = {}) {
      const raw = payload[field]
      if (raw == null || raw === '') {
        if (required) errors.push({ field, message: `${label} 為必填` })
        else out[field] = null
        return api
      }
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) errors.push({ field, message: `${label} 不是有效時間` })
      else out[field] = d.toISOString()
      return api
    },
    custom(field, message, ok) {
      if (!ok) errors.push({ field, message })
      return api
    },
    done() {
      if (errors.length) throw new ValidationError(errors)
      return out
    },
    errors: () => errors,
  }

  return api
}

export const notFound = (what) => Object.assign(new Error(`${what} 不存在`), { status: 404 })
export const conflict = (message) => Object.assign(new Error(message), { status: 409 })
export const badRequest = (message) => Object.assign(new Error(message), { status: 400 })
