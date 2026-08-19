import { getAxes } from '../kols.js'
import { containsKeyword } from '../text.js'

/**
 * Domain classification for raw tags coming back from Apify.
 * Deliberately rule-based rather than model-based: selection has to be
 * explainable and reproducible (docs/09 §0 原則二).
 *
 * v1 also applied per-tag axis nudges (+15 analysis for 「拆解」, +18 emotion
 * for 「療癒」…). Those numbers were invented, and with zero published results
 * there is nothing to tune them against — removed in docs/10 第八刀. A topic's
 * axis demand now comes from its domain, or from an explicit override.
 */
const DOMAIN_KEYWORDS = {
  movie: ['電影', '电影', 'film', 'movie', '影評', '影评', '導演', '导演', '預告', '预告', '院線', '院线', 'cinema', '劇場版', '剧场版'],
  tv: ['影集', '剧集', '劇集', 'drama', 'series', '綜藝', '综艺', 'netflix', '追劇', '追剧'],
  history: ['歷史', '历史', 'history', '古代', '文物', '考古', '年代', '戰爭', '战争', '殖民', '遺跡', '遗迹'],
  pop: ['網紅', '网红', '爆紅', '爆红', 'meme', '迷因', '梗', '流行', 'trend', '挑戰', '挑战', 'viral', '熱議', '热议'],
  music: ['音樂', '音乐', '歌', 'song', 'music', 'bgm', '專輯', '专辑', '演唱會', '演唱会', '配樂', '配乐', 'ost'],
  news: ['新聞', '新闻', 'news', '事件', '爭議', '争议', '政策', '通膨', '選舉', '选举', '調查', '调查', '公布'],
  game: ['遊戲', '游戏', 'game', 'gaming', '手遊', '手游', '電競', '电竞', '抽卡', '主機', '主机', 'steam'],
  sports: ['足球', '籃球', '篮球', '運動', '运动', 'sport', '球賽', '球赛', '世界盃', '世界杯', '聯賽', '联赛', '馬拉松', '马拉松', '健身'],
  tech: ['科技', 'ai', '人工智慧', '人工智能', 'tech', '手機', '手机', '晶片', '芯片', '軟體', '软件', '模型', '機器人', '机器人'],
  city: ['城市', '旅行', '旅遊', '旅游', 'travel', '建築', '建筑', '街區', '街区', '咖啡廳', '咖啡厅', '飯店', '酒店', 'hotel', '景點', '景点'],
  book: ['書', '书', 'book', '閱讀', '阅读', 'reading', '文學', '文学', '作者'],
  life: ['日常', '生活', 'vlog', 'lifestyle', '穿搭', '美食', '料理', '寵物', '宠物', '育兒', '育儿', '職場', '职场'],
}

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

const haystack = (topic) =>
  [topic.tag, topic.title, ...(topic.tags ?? []), ...(topic.samples ?? [])]
    .filter(Boolean)
    .join(' ')

/** Best-guess domain for a raw topic; falls back to `pop` (the widest bucket). */
export function classifyDomain(topic) {
  if (topic.domain) return topic.domain
  const text = haystack(topic)
  let best = { domain: 'pop', hits: 0 }
  for (const [domain, words] of Object.entries(DOMAIN_KEYWORDS)) {
    const hits = words.reduce((n, w) => (containsKeyword(text, w) ? n + 1 : n), 0)
    if (hits > best.hits) best = { domain, hits }
  }
  return best.domain
}

/**
 * Resolve a topic's axis demand vector.
 * Priority: explicit axis_demand → domain default.
 */
export function resolveAxisDemand(topic) {
  const { domain_axis_demand: defaults, axes } = getAxes()
  const domain = classifyDomain(topic)
  const base = defaults[domain] ?? defaults.pop

  if (topic.axis_demand) {
    const filled = {}
    for (const axis of axes) {
      filled[axis.key] = clamp(topic.axis_demand[axis.key] ?? base[axis.key] ?? 50)
    }
    return { domain, demand: filled, derivedFrom: 'explicit override' }
  }

  return { domain, demand: { ...base }, derivedFrom: `domain:${domain}` }
}
