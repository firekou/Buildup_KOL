// 由 results.json 產生 kols/BENCHMARK_ACCOUNTS.md 裡 B01 / B02 兩節的內容。
// 用法：node research/benchmark-accounts-b01-b02/render_md.js > /tmp/b01-b02-sections.md
// 這個檔案讓文件可以隨時從原始 JSON 重新產生，不用手工排版。

const fs = require('fs')
const path = require('path')

const results = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'results.json'), 'utf8')
)

const PLATFORM_ORDER = ['youtube', 'tiktok', 'instagram', 'x', 'threads', 'facebook']

const PERSONA_HEADER = {
  'rachel-ong': {
    num: 4,
    title: 'Rachel Ong（王瑞秋）— 邊界感型高海拔登山向導（B01）',
    core: '**不是**征服敘事的冒險家，而是風險管理與節制的敘事。核心命題是「允許人說今天不上」、在登頂前轉身，並相信那不是失敗。四支柱：轉身時刻／山徑日誌／給平地人的山間道理／深夜筆記本。語氣慢、平、簡省，從不說「這絕對安全」。',
    redline: '不對標為流量擺拍危險動作、誇大難度、表演極限的帳號；不對標「零事故傳奇」式個人英雄敘事；不對標會給絕對安全保證的帳號。',
    lang: '英文母語級＋中文流利，發文語言尚未鎖定，故英文與中文帳號都納入。',
  },
  'rafael-costa': {
    num: 5,
    title: 'Rafael Costa / Captain（拉斐爾·科斯塔）— 現役運動員 × 長期主義成長陪伴（B02）',
    core: '**不是**講台上說教的導師，也不是表演成功的偶像，而是「早走十年的隊友」。五支柱：訓練結束以後／球場之外／冠軍思維／如果我是20歲的你／今天我學到了什麼。語氣平靜簡潔，常用足球經驗解釋人生，偏好「如果我是你，我會先考慮…」而不是「你必須…」。',
    redline: '**不可妥協**：不對標任何販賣焦慮、保證收益、製造稀缺、教人快速致富的帳號；不對標炫富／假豪宅／擺拍公益；不對標捏造榮譽、蹭災難流量、性別或世代對立引戰。',
    lang: '葡語母語＋中文流利＋英文工作級，發文語言尚未鎖定，故中／英／葡語帳號都納入。',
  },
}

const STYLE_LABEL = {
  caption_style: { 'short-fragments': '短碎片', medium: '中等長度', 'long-form': '長篇', 'n/a': '—' },
  concreteness: { 'names-specifics': '具體點名', 'mostly-abstract': '偏抽象', 'n/a': '—' },
  question_ending_habit: { rarely: '問句少', sometimes: '問句普通', 'almost-always': '幾乎都問句', 'n/a': '—' },
}

function tierMark(t) {
  if (t === 'direct-fetch') return '✔直接抓取'
  if (t === 'cross-reference') return '◇交叉比對'
  return '?'
}

function styleBadge(a) {
  const parts = [
    STYLE_LABEL.caption_style[a.caption_style] || a.caption_style,
    STYLE_LABEL.concreteness[a.concreteness] || a.concreteness,
    STYLE_LABEL.question_ending_habit[a.question_ending_habit] || a.question_ending_habit,
  ].filter(function (x) { return x && x !== '—' })
  if (!parts.length) return ''
  return '`' + parts.join('` + `') + '`'
}

function shortFollowers(f) {
  if (!f) return '—'
  // followers 欄位常帶一長串查證說明，只取前面的數字部分
  const s = String(f)
  const cut = s.split(/[（(]/)[0].trim()
  return cut || s.slice(0, 30)
}

const lines = []

for (const pkey of ['rachel-ong', 'rafael-costa']) {
  const h = PERSONA_HEADER[pkey]
  const units = results.units.filter(function (u) { return u.persona_key === pkey })
  const total = units.reduce(function (n, u) { return n + u.confirmed.length }, 0)
  const critic = (results.critics || []).find(function (c) { return c.personaKey === pkey }) || { added: [], gaps: '' }

  lines.push('## ' + h.num + '. ' + h.title)
  lines.push('')
  lines.push('**定位核心：** ' + h.core)
  lines.push('')
  lines.push('**合規紅線：** ' + h.redline)
  lines.push('')
  lines.push('**語言範圍：** ' + h.lang)
  lines.push('')
  lines.push('> 本節共 ' + (total + critic.added.length) + ' 個帳號（主研究 ' + total + ' ＋ 審查員補充 ' + critic.added.length + '），全部通過雙重獨立查證。查證標記：✔＝實際抓取該平台個人頁讀到資料；◇＝改以創作者官網／Linktree／搜尋索引＋跨平台同 handle 互證。')
  lines.push('')

  for (const pk of PLATFORM_ORDER) {
    const u = units.find(function (x) { return x.platform_key === pk })
    if (!u || !u.confirmed.length) continue
    lines.push('### ' + u.platform_name + '（' + u.confirmed.length + ' 個）')
    lines.push('')
    for (const a of u.confirmed) {
      const badge = u.platform_daily_feel ? styleBadge(a) : ''
      const head = ['**[' + a.name + '](' + a.url + ')**', shortFollowers(a.observed_followers || a.followers), a.primary_language, tierMark(a.verify_tier)]
      if (badge) head.push(badge)
      if (a.is_org_account) head.push('（機構帳號）')
      lines.push(head.join(' ・ '))
      lines.push('')
      lines.push('> **對得上的理由：** ' + a.niche_match)
      lines.push('>')
      lines.push('> **可直接抄的做法：** ' + a.imitation_points)
      if (a.image_approach) {
        lines.push('>')
        lines.push('> **' + (u.platform_daily_feel ? '配圖手法' : '畫面／縮圖手法') + '：** ' + a.image_approach)
      }
      lines.push('')
    }
    if (u.dropped && u.dropped.length) {
      lines.push('查證中淘汰：' + u.dropped.map(function (d) {
        return '`' + d.handle + '`（' + String(d.reason).slice(0, 120) + '）'
      }).join('；'))
      lines.push('')
    }
    if (u.notes && u.notes.trim()) {
      lines.push('研究員備註：' + u.notes.trim())
      lines.push('')
    }
  }

  if (critic.added.length) {
    lines.push('### 審查員補充（' + critic.added.length + ' 個，經獨立查證）')
    lines.push('')
    for (const a of critic.added) {
      lines.push('**[' + a.name + '](' + a.url + ')** ・ ' + (a.platform_key || '?') + ' ・ ' + shortFollowers(a.observed_followers || a.followers) + ' ・ ' + tierMark(a.verify_tier))
      lines.push('')
      lines.push('> ' + a.why)
      lines.push('')
    }
  }

  if (critic.gaps && critic.gaps.trim()) {
    lines.push('### 審查員指出的缺口')
    lines.push('')
    // 審查員回傳的文字裡自己帶了 markdown 標題，會撞到本文件的層級，統一降階到 ####
    const demoted = critic.gaps.trim().split('\n').map(function (ln) {
      return ln.replace(/^#{1,3}\s+/, '#### ')
    }).join('\n')
    lines.push(demoted)
    lines.push('')
  }

  lines.push('---')
  lines.push('')
}

process.stdout.write(lines.join('\n'))
