/**
 * Seed a demo product through the whole Growth OS loop.
 *
 * Purpose: a freshly deployed instance with an empty store shows an empty
 * dashboard, and an empty dashboard cannot be evaluated. This walks one
 * product from registration to a cloned Winner so every page has something
 * real — real in the sense that it went through the actual code paths, gates
 * and evaluator, not hand-written rows.
 *
 * Everything it creates is tagged `demo: true` so it can be told apart from
 * production data, and it refuses to run twice.
 *
 * Usage: `npm run seed:growth` (respects DATA_DIR).
 */
import { ensureSeeded } from './policy.js'
import { ensureTemplatesSeeded } from './generation.js'
import * as personas from './personas.js'
import * as products from './products.js'
import * as signals from './signals.js'
import * as opportunities from './opportunities.js'
import * as experiments from './experiments.js'
import * as generation from './generation.js'
import * as review from './review.js'
import * as publish from './publish.js'
import * as telemetry from './telemetry.js'
import * as conversions from './conversions.js'
import * as evaluator from './evaluator.js'
import * as evolution from './evolution.js'
import { db } from './store.js'

const ACTOR = 'seed'
const log = (...a) => console.log('[seed]', ...a)

if (db.find('products', (p) => p.demo)) {
  console.log('[seed] 已有 demo 產品，不重複建立。要重跑請先刪除 DATA_DIR/growth 下的檔案。')
  process.exit(0)
}

ensureSeeded()
ensureTemplatesSeeded()
personas.syncRegistry()

const product = products.createProduct({
  name: 'Showgame（示範）',
  businessModel: 'content_platform',
  valueProposition: '把每一局的過程變成可回放、可逐步拆解的內容體驗',
  primaryDomain: 'https://showgame.example/join',
  owner: 'growth',
  targetAudience: ['22–35 歲、會看賽事回放與拆解的線上娛樂玩家'],
  differentiators: ['每一局都可回放並逐步拆解', '完整過程紀錄公開可查'],
  proofPoints: ['站上公開每一局的完整過程紀錄'],
  knownObjections: ['線上平台的結果都是喬好的', '看不到過程就沒辦法相信'],
  productRoles: ['destination', 'answer_to_debate', 'proof_source'],
  policyProfileId: 'standard-consumer',
  status: 'active',
}, ACTOR)
db.update('products', product.id, { demo: true })
products.defineConversion(product.id, { eventName: 'signup', displayName: '註冊', eventType: 'signup', isPrimary: true, minSampleForEvaluation: 30 }, ACTOR)
products.defineConversion(product.id, { eventName: 'first_session', displayName: '首次完整觀看', eventType: 'activation', minSampleForEvaluation: 50 }, ACTOR)
const campaign = products.createCampaign({ productId: product.id, name: '2026 Q3 拉新', objective: 'signup', budgetCapUsd: 500 }, ACTOR)
const { analysis } = products.analyse(product.id, ACTOR)
log(`產品建立完成，readiness=${analysis.readiness.ready}，可用切角 ${analysis.angleFamilies.length} 個`)

// Pick a persona whose credibility rests on verifiable material — the seed
// topic is an evidence argument, and an `embodied` persona would be gated out.
const persona = personas.listPersonas().find((p) => p.source.credibilityMode === 'database')
personas.setOverlay(persona.id, product.id, {
  productRole: 'proof_source',
  platformRoles: { tiktok: '主力短影音', threads: '議題延伸討論' },
  allowedClaims: ['站上每一局的過程紀錄都可回放'],
  blockedClaims: ['保證獲利', '穩賺', '必勝'],
  audienceHypotheses: ['會自己去查證、不接受單方說法的玩家'],
}, ACTOR)
log(`人設 overlay 完成：${persona.name}（${persona.source.credibilityMode}）`)

const { signal } = signals.createManualSignal({
  title: '玩家社群再度爭論線上平台的結果能不能被查證',
  summary: '某論壇長串討論引發轉貼，兩派對「可查證」的定義不同。',
  sourceType: 'social_trend',
  evidence: [{ type: 'thread', outlet: '論壇', url: 'https://example.com/thread/1' }],
})

const opportunity = opportunities.createOpportunity({
  productId: product.id,
  campaignId: campaign.id,
  signalId: signal.id,
  topic: '線上平台的每一局到底能不能被查證',
  whyNow: '社群這幾天又吵起來，而且吵的是「怎樣才算可查證」——這正好是產品可以直接回答的問題，不是空泛的信任爭論。',
  tension: '一邊主張線上結果一律不可信，一邊主張只要過程紀錄完整公開就可以自己驗；兩邊都沒有真的把紀錄打開來看過。',
  productRelevance: '產品的差異點就是每一局可回放與逐步拆解，正好正面接住「看不到過程就沒辦法相信」這個已登記的反對意見。',
  relevanceAnchor: 'known_objection',
  riskFlags: ['controversial_framing'],
  competingViewpoints: ['線上結果一律不可信', '過程紀錄公開就能自行驗證'],
  evidence: [{ type: 'thread', outlet: '論壇', url: 'https://example.com/thread/1' }],
}, ACTOR)
log(`Opportunity 建立：${opportunity.topic}`)

const experiment = experiments.createExperiment({
  productId: product.id,
  campaignId: campaign.id,
  opportunityId: opportunity.id,
  hypothesis: '用「直接把紀錄攤開」當 hook，會比用「反駁作弊指控」當 hook 帶來更多註冊——因為前者給的是可自己驗的東西，後者只是加入吵架。',
  comparisonDimension: 'hook',
  primaryOutcome: 'signup',
  observationWindowHours: 72,
}, ACTOR)

const base = {
  personaId: persona.id, format: 'short_video', platform: 'tiktok',
  cta: '到站上把這一局自己對一次', productRole: 'proof_source', tone: '平靜、不辯論',
  visualSetting: '桌前、螢幕上是完整過程紀錄', duration: 30,
}
const armA = experiments.addArm(experiment.id, { ...base, hook: '我把這一局的完整紀錄整個攤開，你自己看' }, ACTOR)
const armB = experiments.addArm(experiment.id, { ...base, hook: '都說線上一定是喬好的，那我們今天來對一次帳' }, ACTOR)
log(`實驗與 2 個 arm 建立完成（只變動 hook）`)

await generation.generateExperiment(experiment.id, { adapterId: 'template', actor: ACTOR })

const account = publish.registerAccount({
  platform: 'tiktok', accountRef: `@${persona.id}`, accountType: 'persona_owned',
  personaId: persona.id, credentialRef: 'TIKTOK_TOKEN_DEMO', displayName: persona.name,
}, ACTOR)

const pubs = []
for (const arm of [armA, armB]) {
  const asset = generation.listAssets({ armId: arm.id })[0]
  review.evaluateAsset(asset.id, ACTOR)
  review.decide(asset.id, {
    decision: 'approved', reasonCode: 'OK',
    notes: '語意層逐條確認：無具身主張、無保證性用語、無捏造來源；發布時已開啟平台 AI 標示。',
  }, ACTOR)
  const { publication } = publish.schedulePublication({ assetId: asset.id, socialAccountId: account.id }, ACTOR)
  await publish.publish(publication.id, {
    platformPostId: `demo_${arm.label}`, url: `https://www.tiktok.com/@demo/video/${arm.label}`,
    disclosureConfirmed: true, actor: ACTOR,
  })
  pubs.push({ arm, publication })
}
log(`2 則內容已審查並登錄發布，tracking code: ${pubs.map((p) => p.publication.trackingCode).join(', ')}`)

// Telemetry and conversions, shaped so arm A wins clearly enough to be
// statistically significant — the point is to exercise the evaluator, and a
// tie would leave every downstream page empty.
telemetry.ingestSnapshot(pubs[0].publication.id, { play_count: 128_400, likes: 7_920, comments: 634, shares: 1_180, link_clicks: 3_540 }, { source: 'seed' })
telemetry.ingestSnapshot(pubs[1].publication.id, { play_count: 121_900, likes: 5_310, comments: 902, shares: 640, link_clicks: 3_310 }, { source: 'seed' })

const mint = (publication, n, prefix) => {
  for (let i = 0; i < n; i += 1) {
    conversions.ingest({
      productId: product.id, eventName: 'signup', eventExternalId: `${prefix}-${i}`,
      trackingCode: publication.trackingCode, sessionRef: `sess-${prefix}-${i}`, valueAmount: 14,
      occurredAt: new Date(Date.now() - Math.random() * 36e5 * 48).toISOString(),
    })
  }
}
mint(pubs[0].publication, 214, 'a')
mint(pubs[1].publication, 138, 'b')
// A handful with no tracking code at all — attribution coverage should never
// read 100% on a demo, because it never does in reality.
for (let i = 0; i < 23; i += 1) {
  conversions.ingest({ productId: product.id, eventName: 'signup', eventExternalId: `orphan-${i}`, valueAmount: 14 })
}
log('成效與轉換已登錄（含 23 筆無法歸因的轉換）')

// Close the window so the evaluator has something to decide.
db.update('experiments', experiment.id, {
  observationStartedAt: new Date(Date.now() - 80 * 36e5).toISOString(),
  observationEndsAt: new Date(Date.now() - 8 * 36e5).toISOString(),
})
const decision = evaluator.evaluate(experiment.id, { actor: ACTOR })
log(`評估結果：${decision.decision} — ${decision.decisionReason}`)

if (decision.decision === 'WINNER') {
  const { childExperiment, arms } = evolution.cloneWinner({
    parentArmId: decision.armId,
    mutationDimension: 'cta',
    variants: ['到站上把這一局自己對一次（免登入試看）', '留言「對帳」，我把這一局的紀錄連結貼給你'],
  }, ACTOR)
  log(`已從 Winner 建立 child experiment ${childExperiment.id}，含 ${arms.length} 個 arm（1 CTRL + 2 變體）`)
}

console.log('\n[seed] 完成。開啟 Dashboard 的「⑦ Growth OS」分頁即可看到完整閉環。')
