/**
 * Sample topic sets used when APIFY_TOKEN is not configured.
 *
 * These are HAND-WRITTEN PLACEHOLDERS, not scraped data. They exist so the
 * whole pipeline (classify → match → workflow → evaluation) is exercisable
 * before an Apify subscription is wired up. Every API response built from them
 * carries `source: "fixtures"`, and the UI badges it — never present these
 * numbers as real platform metrics.
 *
 * Tuple: [tag, title, domain, platform, volume, growth7dPercent, engagementRate]
 */

const T = (rows) =>
  rows.map(([tag, title, domain, platform, volume, growth, engagement]) => ({
    tag,
    title,
    domain,
    platform,
    volume,
    growth7d: growth,
    engagementRate: engagement,
  }))

export const FIXTURE_TOPICS = {
  TW: T([
    ['#離職潮', '年後離職潮與「轉身不是失敗」的討論', 'pop', 'threads', 182000, 34, 0.062],
    ['#電影推薦', '串流平台補片清單與影評風潮', 'movie', 'instagram', 264000, 12, 0.041],
    ['#老屋改造', '老屋改造與街區保存爭議', 'city', 'instagram', 96000, 27, 0.055],
    ['#AI工具實測', 'AI 工具實測與生產力比較', 'tech', 'threads', 143000, 48, 0.058],
    ['#抽卡保底', '手遊抽卡保底機制爭議', 'game', 'tiktok', 121000, 21, 0.071],
    ['#世界盃資格賽', '世界盃資格賽關鍵戰討論', 'sports', 'tiktok', 208000, 39, 0.066],
    ['#城市散步', '城市散步與冷門街角紀錄', 'city', 'instagram', 77000, 18, 0.049],
    ['#歷史冷知識', '台灣日治時期建築的歷史冷知識', 'history', 'threads', 58000, 25, 0.053],
    ['#內耗', '內耗與情緒界線的自我照顧討論', 'life', 'threads', 155000, 30, 0.068],
    ['#配樂解析', '電影配樂與情緒操控解析', 'music', 'tiktok', 64000, 16, 0.047],
    ['#盲盒開箱', '盲盒開箱與期望值討論', 'pop', 'tiktok', 112000, 23, 0.074],
    ['#紀錄片推薦', '紀錄片推薦與觀看筆記', 'movie', 'threads', 43000, 14, 0.044],
  ]),

  HK: T([
    ['#舊區重建', '舊區重建與保育爭議', 'city', 'instagram', 88000, 31, 0.057],
    ['#王家衛', '王家衛電影取景地重訪', 'movie', 'instagram', 134000, 19, 0.052],
    ['#街機廳', '街機廳懷舊與遊戲史', 'game', 'tiktok', 41000, 22, 0.061],
    ['#AI創作', 'AI 創作工具與版權討論', 'tech', 'threads', 97000, 41, 0.05],
    ['#港式咖啡廳', '港式咖啡廳與城市空間', 'city', 'instagram', 72000, 15, 0.048],
    ['#足球評論', '英超與本地足球評論', 'sports', 'tiktok', 156000, 26, 0.063],
    ['#殖民建築', '殖民建築與城市記憶', 'history', 'threads', 39000, 20, 0.045],
    ['#City Pop', 'City Pop 復興與城市聲音', 'music', 'tiktok', 68000, 29, 0.058],
    ['#職場界線', '職場界線與拒絕的藝術', 'life', 'threads', 118000, 33, 0.066],
    ['#概率迷思', '生活裡的概率迷思', 'pop', 'threads', 34000, 24, 0.055],
  ]),

  SG: T([
    ['#hawkerculture', '小販文化與飲食空間的城市觀察', 'city', 'instagram', 128000, 17, 0.05],
    ['#urbanplanning', '組屋規劃與城市密度討論', 'city', 'threads', 74000, 29, 0.054],
    ['#everestnews', '珠峰商業登山與事故新聞', 'news', 'tiktok', 143000, 44, 0.069],
    ['#filmlocation', '電影取景地與城市記憶', 'movie', 'instagram', 91000, 13, 0.046],
    ['#aitools', 'AI 工具實測與工作流改造', 'tech', 'threads', 167000, 46, 0.057],
    ['#quietquitting', '安靜離職與長期主義的對話', 'pop', 'threads', 132000, 35, 0.071],
    ['#colonialarchitecture', '殖民時期建築與保育', 'history', 'instagram', 46000, 21, 0.048],
    ['#footballasia', '亞洲足球與青訓路徑', 'sports', 'tiktok', 108000, 24, 0.06],
    ['#gachaodds', '抽卡機率公示與消費者討論', 'game', 'tiktok', 87000, 28, 0.073],
    ['#slowtravel', '慢旅行與非打卡路線', 'city', 'instagram', 63000, 19, 0.052],
    ['#probability', '日常決策裡的機率誤區', 'book', 'threads', 29000, 26, 0.049],
    ['#soundtrack', '配樂如何改變一場戲', 'music', 'tiktok', 55000, 15, 0.044],
  ]),

  MY: T([
    ['#手遊氪金', '手遊氪金心理與設計機制', 'game', 'tiktok', 139000, 32, 0.075],
    ['#吉隆坡街區', '吉隆坡舊街區與新開發', 'city', 'instagram', 84000, 23, 0.051],
    ['#AI實測', 'AI 模型發布與實測比較', 'tech', 'threads', 121000, 47, 0.056],
    ['#讀書筆記', '每日閱讀與決策類書單', 'book', 'threads', 37000, 18, 0.047],
    ['#經典電影', '經典電影鏡頭語言拆解', 'movie', 'tiktok', 102000, 20, 0.058],
    ['#概率誤區', '賭徒謬誤與生活裡的概率誤區', 'pop', 'threads', 61000, 30, 0.064],
    ['#東南亞足球', '東南亞足球與球員成長路徑', 'sports', 'tiktok', 94000, 25, 0.062],
    ['#老街保存', '老街保存與士紳化爭議', 'history', 'instagram', 42000, 22, 0.046],
    ['#夜市日常', '夜市日常與街頭紀錄', 'life', 'instagram', 116000, 16, 0.053],
    ['#紀錄片', '紀錄片敘事結構拆解', 'movie', 'threads', 33000, 19, 0.043],
  ]),

  CN: T([
    ['#长期主义', '长期主义与年轻人职业选择', 'pop', 'threads', 214000, 37, 0.07],
    ['#训练日常', '职业运动员训练日常', 'sports', 'tiktok', 187000, 29, 0.068],
    ['#电影镜头语言', '电影镜头语言与情绪设计', 'movie', 'tiktok', 156000, 22, 0.059],
    ['#AI应用', 'AI 应用落地与实测', 'tech', 'threads', 243000, 51, 0.055],
    ['#概率故事', '经典概率故事与直觉误判', 'history', 'threads', 48000, 27, 0.051],
    ['#城市更新', '城市更新与老城区改造', 'city', 'instagram', 132000, 24, 0.05],
    ['#抽卡机制', '抽卡机制与保底设计讨论', 'game', 'tiktok', 168000, 33, 0.076],
    ['#躺平', '躺平与内卷的持续讨论', 'pop', 'threads', 226000, 18, 0.072],
    ['#纪录片推荐', '纪录片推荐与观看方法', 'movie', 'threads', 71000, 20, 0.046],
    ['#登山事故', '高海拔登山事故与风险判断', 'news', 'tiktok', 89000, 42, 0.065],
  ]),

  JP: T([
    ['#東京建築', '東京の建築と都市空間', 'city', 'instagram', 154000, 21, 0.049],
    ['#シティポップ', 'シティポップと夜景の記憶', 'music', 'tiktok', 118000, 27, 0.057],
    ['#ゲームデザイン', 'ゲームデザインと報酬設計', 'game', 'tiktok', 96000, 30, 0.069],
    ['#映画分析', '映画のカメラワーク分析', 'movie', 'threads', 74000, 17, 0.048],
    ['#AIツール', 'AI ツール実測レポート', 'tech', 'threads', 141000, 45, 0.054],
    ['#昭和レトロ', '昭和レトロと街の記憶', 'history', 'instagram', 87000, 19, 0.052],
    ['#登山', '高所登山と安全判断', 'sports', 'tiktok', 63000, 26, 0.058],
    ['#ホテル建築', 'ホテル建築とサービス文化', 'city', 'instagram', 58000, 14, 0.045],
    ['#ドキュメンタリー', 'ドキュメンタリーの語り方', 'movie', 'threads', 31000, 16, 0.042],
    ['#日常vlog', '日常 vlog と生活の記録', 'life', 'instagram', 172000, 12, 0.051],
  ]),

  GLOBAL: T([
    ['#freesolo', 'Climbing documentaries and staged risk', 'movie', 'tiktok', 178000, 28, 0.063],
    ['#aitools', 'AI tool releases and hands-on tests', 'tech', 'threads', 421000, 52, 0.055],
    ['#longtermism', 'Long-termism vs short-term hustle', 'pop', 'threads', 196000, 31, 0.068],
    ['#gachaodds', 'Gacha odds disclosure debate', 'game', 'tiktok', 164000, 26, 0.074],
    ['#architecturehistory', 'Buildings that witnessed an era', 'history', 'instagram', 112000, 18, 0.047],
    ['#everest', 'Everest crowding and turnaround calls', 'news', 'tiktok', 203000, 46, 0.07],
    ['#filmscore', 'How a score changes a scene', 'music', 'tiktok', 98000, 20, 0.051],
    ['#citywalk', 'City walks and non-touristy routes', 'city', 'instagram', 187000, 23, 0.053],
    ['#probability', 'Probability paradoxes explained', 'book', 'threads', 64000, 25, 0.049],
    ['#worldcup', 'World Cup qualifiers and mentality', 'sports', 'tiktok', 312000, 38, 0.066],
  ]),
}

export const FIXTURE_REGIONS = Object.keys(FIXTURE_TOPICS)

export function getFixtureTopics(region, platforms) {
  const rows = FIXTURE_TOPICS[region] ?? FIXTURE_TOPICS.GLOBAL
  if (!platforms?.length) return rows
  return rows.filter((r) => platforms.includes(r.platform))
}
