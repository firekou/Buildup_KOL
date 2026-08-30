/**
 * Growth OS test suite — GHOS-X08 (closed-loop fixture) plus unit tests for
 * the four pure functions whose correctness the whole system rests on:
 * the evaluator's statistics, attribution evidence levels, data completeness,
 * and cost derivation.
 *
 * Run: `npm run test:growth`. Uses a throwaway DATA_DIR so it never touches
 * the real store.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ghos-test-'))
process.env.DATA_DIR = DIR
// Deterministic prices regardless of what the operator's plan is set to.
process.env.GHOS_CREDIT_PLAN = 'ultra-3000-monthly'

const results = []
const test = async (name, fn) => {
  try {
    await fn()
    results.push({ name, ok: true })
  } catch (err) {
    results.push({ name, ok: false, error: err.message })
  }
}

const [
  policy, products, personas, signals, opportunities, router, experiments,
  generation, review, publish, telemetry, conversions, evaluator, evolution,
  completeness, cost, costModel, portfolio, pipeline, gates, store, archive,
] = await Promise.all([
  import('./policy.js'), import('./products.js'), import('./personas.js'),
  import('./signals.js'), import('./opportunities.js'), import('./router.js'),
  import('./experiments.js'), import('./generation.js'), import('./review.js'),
  import('./publish.js'), import('./telemetry.js'), import('./conversions.js'),
  import('./evaluator.js'), import('./evolution.js'), import('./completeness.js'),
  import('./cost.js'), import('./cost-model.js'), import('./portfolio.js'),
  import('./pipeline.js'), import('./gates.js'), import('./store.js'),
  import('./archive.js'),
])

/* ------------------------------------------------------------ unit tests */

await test('cost: 13 秒影片的 credit 數與 cost doc 記錄一致', () => {
  // costs/video-generation-costs.md: 「段1（13秒，正式生成）| 58.5」
  const est = costModel.estimateCost({ model: 'seedance-2.0', kind: 'video', seconds: 13 })
  assert.equal(est.credits, 58.5)
  assert.equal(est.basis, 'observed')
  assert.ok(est.sourceRef.includes('costs/'), 'cost 必須帶 sourceRef 才能對帳')
})

await test('cost: 未登錄的模型回傳 null 而非猜測的價格', () => {
  const est = costModel.estimateCost({ model: 'some-unreleased-model', kind: 'video', seconds: 10 })
  assert.equal(est.credits, null)
  assert.equal(est.basis, 'unknown_model')
})

await test('cost: 預算上限會擋下超額的生成', () => {
  assert.equal(costModel.checkBudget({ spentUsd: 40, capUsd: 50, incomingUsd: 15 }).allowed, false)
  assert.equal(costModel.checkBudget({ spentUsd: 40, capUsd: 50, incomingUsd: 5 }).allowed, true)
  // 沒有設上限時不擋，但必須說出來
  const none = costModel.checkBudget({ spentUsd: 999, capUsd: null, incomingUsd: 100 })
  assert.equal(none.allowed, true)
  assert.match(none.reason, /未設定預算上限/)
})

await test('evaluator: 樣本太小時不做顯著性宣稱', () => {
  const small = evaluator.twoProportionTest(3, 40, 1, 40)
  assert.equal(small.usable, false)
  assert.ok(!('significant' in small), '樣本不足時不得回傳 significant')
})

await test('evaluator: 明顯差異達顯著、微小差異不達顯著', () => {
  const big = evaluator.twoProportionTest(120, 2000, 80, 2000)
  assert.equal(big.usable, true)
  assert.equal(big.significant, true)
  const tiny = evaluator.twoProportionTest(52, 1000, 50, 1000)
  assert.equal(tiny.significant, false)
})

await test('signals: 同一則新聞在不同來源只會建立一筆', () => {
  const a = signals.ingest({ sourceType: 'news', title: '某某事件引發討論 - A報', summary: '', evidence: [{ type: 'article', outlet: 'A' }] })
  const b = signals.ingest({ sourceType: 'news', title: '某某事件引發討論 - B報', summary: '', evidence: [{ type: 'article', outlet: 'B' }] })
  assert.equal(a.duplicate, false)
  assert.equal(b.duplicate, true, '標題尾綴的媒體名不同時仍應視為同一則')
  assert.equal(b.signal.id, a.signal.id)
})

await test('signals: 時效分帶，未知時間不得宣稱時效', () => {
  assert.equal(signals.freshnessOf(new Date().toISOString()).key, 'breaking')
  assert.equal(signals.freshnessOf(new Date(Date.now() - 40 * 3600e3).toISOString()).key, 'recent')
  assert.equal(signals.freshnessOf(null).key, 'unknown')
})

/* ------------------------------------------------- closed-loop fixture */

let fixture = null

await test('closed loop: 產品 → 題目 → 實驗 → 生成 → 審查 → 發布 → 成效 → 轉換 → 判定', async () => {
  policy.ensureSeeded()
  generation.ensureTemplatesSeeded()
  personas.syncRegistry()

  const product = products.createProduct({
    name: 'Test Product',
    businessModel: 'content_platform',
    valueProposition: '把每一局變成可回放、可拆解的內容體驗',
    primaryDomain: 'https://example.test/join',
    targetAudience: ['測試受眾'],
    differentiators: ['可回放'],
    proofPoints: ['站上公開完整紀錄'],
    knownObjections: ['大家都說是假的'],
    policyProfileId: 'standard-consumer',
  }, 'test')
  products.defineConversion(product.id, { eventName: 'signup', displayName: '註冊', eventType: 'signup', isPrimary: true, minSampleForEvaluation: 20 })
  const campaign = products.createCampaign({ productId: product.id, name: 'test campaign', objective: 'signup' }, 'test')
  const { analysis } = products.analyse(product.id, 'test')
  assert.equal(analysis.readiness.ready, true, `readiness 應通過，缺：${analysis.readiness.blockingGaps}`)

  const personaId = personas.listPersonas().find((p) => p.source.credibilityMode === 'database').id
  personas.setOverlay(personaId, product.id, { productRole: 'destination', platformRoles: { tiktok: '主力' }, allowedClaims: [], blockedClaims: ['保證獲利'] }, 'test')

  const { signal } = signals.createManualSignal({ title: '測試事件：某論壇再度爭論', summary: '測試用', sourceType: 'social_trend' })
  const opportunity = opportunities.createOpportunity({
    productId: product.id, campaignId: campaign.id, signalId: signal.id,
    topic: '這件事到底能不能查證',
    whyNow: '社群爭論仍在擴散，使用者正在找一個能驗證的方法',
    tension: '一邊主張全都是假的，一邊主張可查證紀錄就是答案',
    productRelevance: '產品差異點就是可回放，正面接住這個反對意見',
    relevanceAnchor: 'known_objection',
    evidence: [{ type: 'thread', url: 'https://example.test/t/1' }],
  }, 'test')

  const routed = router.route(opportunity.id)
  assert.ok(routed.candidates.length > 0, 'router 應產出候選')
  assert.ok(routed.candidates.some((c) => c.eligible), '至少一個候選應可用')
  assert.ok(!('score' in routed.candidates[0]), 'router 不得輸出黑箱總分')

  const experiment = experiments.createExperiment({
    productId: product.id, campaignId: campaign.id, opportunityId: opportunity.id,
    hypothesis: '用「攤開紀錄」當 hook 會比用「反駁指控」當 hook 帶來更多註冊',
    comparisonDimension: 'hook', primaryOutcome: 'signup', observationWindowHours: 1,
  }, 'test')

  const base = { personaId, format: 'short_video', platform: 'tiktok', cta: '到站上自己對一次', productRole: 'destination', tone: '冷靜' }
  const armA = experiments.addArm(experiment.id, { ...base, hook: 'Hook A：我把紀錄整個攤開' }, 'test')
  const armB = experiments.addArm(experiment.id, { ...base, hook: 'Hook B：都說是假的，那我們來對帳' }, 'test')
  assert.equal(armB.multiFactor, false)
  assert.deepEqual(armB.differsOn, ['hook'], '只應在 hook 上不同')

  const gen = await generation.generateExperiment(experiment.id, { adapterId: 'template' })
  assert.equal(gen.succeeded, 2)

  const account = publish.registerAccount({ platform: 'tiktok', accountRef: '@test', accountType: 'persona_owned', personaId, credentialRef: 'TEST_TOKEN' }, 'test')

  const pubs = []
  for (const arm of [armA, armB]) {
    const asset = generation.listAssets({ armId: arm.id })[0]
    const gate = review.evaluateAsset(asset.id, 'test')
    assert.notEqual(gate.verdict, 'auto_approvable', 'TikTok 的 AI 揭露檢查應強制人工確認')
    review.decide(asset.id, { decision: 'approved', reasonCode: 'OK', notes: '語意層逐條確認完畢' }, 'test')
    const { publication } = publish.schedulePublication({ assetId: asset.id, socialAccountId: account.id }, 'test')
    assert.ok(publication.trackingCode, '排程時就必須簽發 tracking code')
    await publish.publish(publication.id, { platformPostId: `t_${arm.label}`, url: `https://tiktok.test/${arm.label}`, disclosureConfirmed: true }, 'test')
    pubs.push(publication)
  }

  telemetry.ingestSnapshot(pubs[0].id, { views: 50000, likes: 3000, link_clicks: 1400 })
  telemetry.ingestSnapshot(pubs[1].id, { views: 50000, likes: 2500, link_clicks: 1400 })

  for (let i = 0; i < 90; i += 1) conversions.ingest({ productId: product.id, eventName: 'signup', eventExternalId: `A${i}`, trackingCode: pubs[0].trackingCode, valueAmount: 10 })
  for (let i = 0; i < 45; i += 1) conversions.ingest({ productId: product.id, eventName: 'signup', eventExternalId: `B${i}`, trackingCode: pubs[1].trackingCode, valueAmount: 10 })

  // Close the observation window so the completeness gate can pass.
  store.db.update('experiments', experiment.id, { observationEndsAt: new Date(Date.now() - 1000).toISOString() })

  const decision = evaluator.evaluate(experiment.id, { actor: 'test' })
  assert.equal(decision.decision, 'WINNER', `應判為 WINNER，實得 ${decision.decision}：${decision.decisionReason}`)
  assert.equal(decision.armId, armA.id, 'Winner 應是轉換率較高的 arm A')
  assert.ok(decision.comparison.test.significant)
  assert.ok(decision.decisionReason.includes('%'), '判定理由必須包含實際數字')

  fixture = { product, experiment, armA, armB, account, personaId, pubs }
})

await test('產品特性分析: 受眾所屬產業不會被當成產品的 claim', async () => {
  const { analyseProduct } = await import('./product-analysis.js')
  const profile = { key: 'standard-consumer', version: '1.0.0', autoApproveAllowed: true, minAge: 13, disclosure: {} }

  // Who uses it is not what it claims. An API gateway whose users include
  // doctors, lawyers and quants makes no medical, legal or financial claim.
  const gateway = analyseProduct({
    name: 'API 閘道',
    businessModel: 'subscription',
    valueProposition: '一站式 API，跨模型使用並統一計費',
    differentiators: ['統一 Token 計費'],
    knownObjections: ['多一層中介會更貴'],
    targetAudience: ['金融交易演算法分析師', '醫療診斷輔助系統使用者', '法律與合規文件審閱人員'],
  }, { conversions: [], profile })
  assert.deepEqual(gateway.claimSurface.domains.map((d) => d.domain), [],
    '受眾清單裡的產業名稱不得產生 claim 領域——否則每一則素材都會被強制人工審查')
  assert.equal(gateway.claimSurface.requiresHumanReview, false)

  // A product that genuinely operates in a regulated domain is still caught.
  const casino = analyseProduct({
    name: '博弈平台',
    businessModel: 'content_platform',
    valueProposition: '把每一局博弈變成可回放的內容',
    targetAudience: [],
  }, { conversions: [], profile })
  assert.deepEqual(casino.claimSurface.domains.map((d) => d.domain), ['gambling'],
    '真的做博弈的產品仍必須被標出來')
  assert.equal(casino.claimSurface.requiresHumanReview, true)
})

await test('closed loop: 從 Winner 建立 child experiment 且 lineage 不遺失', () => {
  assert.ok(fixture, '前一個測試未通過，無法繼續')
  const { childExperiment, arms } = evolution.cloneWinner({
    parentArmId: fixture.armA.id, mutationDimension: 'cta', variants: ['變體 CTA 一', '變體 CTA 二'],
  }, 'test')

  assert.equal(arms.length, 3, '應有 1 個 CTRL 加 2 個變體')
  assert.equal(arms[0].label, 'CTRL')
  assert.ok(arms.every((a) => a.parentArmId === fixture.armA.id), '每個 child 都必須保留 parent')
  assert.equal(childExperiment.baseline.kind, 'parent_arm')
  assert.equal(childExperiment.baseline.parentArmId, fixture.armA.id)
  // Frozen dimensions really are copied, not merely declared.
  assert.equal(arms[1].hook, fixture.armA.hook, 'hook 屬凍結維度，必須與 parent 相同')
  assert.notEqual(arms[1].cta, fixture.armA.cta, 'cta 是變異維度，必須不同')

  const tree = evolution.lineage(fixture.armA.id)
  assert.equal(tree.children.length, 3)
  assert.equal(tree.decision, 'WINNER')
})

await test('opportunity: 沒有 signal 也能建題目（FR-P0-03 人工建立）', () => {
  const draft = opportunities.draftFromSignal(null, fixture.product.id)
  assert.equal(draft.signalId, null)
  assert.ok(draft.allAnchors.length > 0, '手動草稿應列出產品分析算出的所有切角')
  assert.equal(draft.freshness.key, 'unknown', '沒有事件就不得宣稱時效性')
  assert.ok(draft.whyNow.includes('行銷排程'), '沒有事件時，whyNow 草稿要擋掉「我們現在想推」這種答案')
  assert.equal(draft.needsEdit.whyNow, true, '沒有事件的 whyNow 必須標記成需要人工改寫')

  const created = opportunities.createOpportunity({
    productId: fixture.product.id,
    topic: '手動建立的題目',
    whyNow: '受眾這個月正在重新評估要不要續訂，這是他們自己會問的問題',
    tension: '一邊認為整合平台省事，一邊認為多一層中介就是多一層風險',
    productRelevance: '正面回應已登記的反對意見，用可回放的紀錄當證據',
    relevanceAnchor: 'known_objection',
  }, 'test')
  assert.equal(created.signalId, null)
  assert.equal(created.status, 'new')
})

await test('prompt template: 生成一定用最新版本，且指示裡真的帶著段落結構', async () => {
  const { latestTemplate } = generation
  const t = latestTemplate({ taskType: 'caption' })
  assert.ok(t, '必須找得到 caption 模板')
  assert.ok(t.template.includes('{{beats}}'), '模板必須把段落指示交給模型，否則敘事結構等於沒設定')
  assert.ok(t.template.includes('敘事結構'), '模板必須說明這一輪的敘事結構')

  // A stale row must not win. This is the failure that shipped: an edited
  // template never reached a store that already held the old version, and the
  // only symptom was output that did not change.
  store.db.insert('promptTemplates', { name: t.name, version: '0.9.0', taskType: 'caption', template: '舊版模板', builtin: true })
  assert.equal(latestTemplate({ taskType: 'caption' }).version, t.version, '舊版本不得蓋過新版本')

  store.db.insert('promptTemplates', { name: t.name, version: '1.10.0', taskType: 'caption', template: '更新版', builtin: true })
  assert.equal(latestTemplate({ taskType: 'caption' }).version, '1.10.0', '版本比較要照數字，1.10.0 應大於 1.9.0')
})

await test('draft: 有事件時，三欄由系統草擬且指出用哪一條產品事實去接', () => {
  const { signal } = signals.createManualSignal({
    title: 'DeepSeek 宣布 API 定價全面調漲，開發者social上炸鍋',
    summary: '多家媒體報導，開發者社群開始重算成本',
    sourceType: 'news',
  })
  const draft = opportunities.draftFromSignal(signal.id, fixture.product.id)

  // The three contract fields must arrive written, not blank.
  for (const f of ['whyNow', 'tension', 'productRelevance']) {
    assert.ok(draft[f] && draft[f].length > 20, `${f} 必須是草擬好的句子，不是空白欄位`)
  }
  assert.ok(draft.hooks.length >= 1, '應提供可直接當 arm 的開場草稿')
  assert.ok(draft.caveat.includes('草擬'), '必須明說這是草稿而非結論')
  // And it must never claim to have settled the argument for the operator.
  assert.ok(draft.caveat.includes('對立'), 'caveat 要點名「對立」這一欄仍需人工下判斷')
})

await test('relevance: 詞邊界比對，不得用子字串誤判', async () => {
  const { relevanceOf } = await import('./relevance.js')
  const product = products.requireProduct(fixture.product.id)

  // "ai" must not match inside "taiwan" — the false positive that reported
  // Taipei travel clips as relevant to an AI API product.
  const irrelevant = relevanceOf({ title: 'TAIPEI #taiwan travel #jiufen', summary: '' }, product)
  assert.equal(irrelevant.connects, false, '拉丁字必須以詞邊界比對，ai 不得命中 taiwan')

  const relevant = relevanceOf({ title: '線上平台的紀錄到底能不能查證，玩家吵翻', summary: '' }, product)
  assert.equal(typeof relevant.verdict, 'string')
  assert.ok(relevant.verdict.length > 10, 'verdict 必須是一句人看得懂的話')
})

await test('router: 未指派平台角色不阻擋實驗規劃，但會列為注意事項', () => {
  const opportunity = opportunities.listOpportunities({ productId: fixture.product.id })[0]
  const routed = router.route(opportunity.id)
  assert.ok(routed.candidates.some((c) => c.eligible), '全新安裝時至少要有一個人設可用，否則第一個實驗永遠建不起來')
  const unassigned = routed.candidates.find((c) => !Object.keys(c.overlay?.platformRoles ?? {}).length)
  if (unassigned) {
    assert.ok(!unassigned.failedGates.includes('platform_assigned'), 'platform_assigned 不得是硬 gate')
    assert.ok(unassigned.cautions.some((c) => c.type === 'no_platform_role'), '但必須列為注意事項')
  }
})

await test('completeness: 觀測窗未結束時實驗不可評估', () => {
  const exp = experiments.requireExperiment(fixture.experiment.id)
  const future = { ...exp, observationEndsAt: new Date(Date.now() + 3600e3).toISOString() }
  const result = completeness.assess(future)
  assert.equal(result.evaluable, false)
  assert.ok(result.blockingFailures.includes('observation_window'))
})

await test('evaluator: 樣本不足時回傳 NEEDS_MORE_DATA 而非硬選 Winner', () => {
  const experiment = experiments.createExperiment({
    productId: fixture.product.id,
    hypothesis: '這是一個樣本會不足的實驗，用來確認 evaluator 不會硬選 Winner',
    comparisonDimension: 'hook', primaryOutcome: 'signup', observationWindowHours: 1,
  }, 'test')
  const base = { personaId: fixture.personaId, format: 'short_video', platform: 'tiktok', cta: 'x', productRole: 'destination' }
  experiments.addArm(experiment.id, { ...base, hook: 'A' }, 'test')
  experiments.addArm(experiment.id, { ...base, hook: 'B' }, 'test')
  const result = evaluator.evaluate(experiment.id, { actor: 'test' })
  assert.equal(result.decision, 'NEEDS_MORE_DATA')
  assert.equal(result.armId, null, '資料不足時不得指定 Winner arm')
})

await test('attribution: 無 tracking code 的轉換維持 unattributed', () => {
  const before = conversions.coverage({ productId: fixture.product.id })
  conversions.ingest({ productId: fixture.product.id, eventName: 'signup', eventExternalId: 'orphan-1', valueAmount: 10 })
  const after = conversions.coverage({ productId: fixture.product.id })
  assert.equal(after.unattributed, before.unattributed + 1)
  assert.equal(after.total, before.total + 1)
  assert.ok(after.directRate < 1, '未歸因的轉換必須拉低直接量測比例，不得被丟棄')
})

await test('attribution: 重送同一筆轉換不會重複計數', () => {
  const before = conversions.coverage({ productId: fixture.product.id })
  const again = conversions.ingest({ productId: fixture.product.id, eventName: 'signup', eventExternalId: 'orphan-1', valueAmount: 10 })
  assert.equal(again.duplicate, true)
  assert.equal(conversions.coverage({ productId: fixture.product.id }).total, before.total)
})

await test('telemetry: 重送同一份成效快照不會重複計數', () => {
  const payload = { views: 50000, likes: 3000, link_clicks: 1400 }
  const at = new Date().toISOString()
  const first = telemetry.ingestSnapshot(fixture.pubs[0].id, payload, { capturedAt: at })
  const second = telemetry.ingestSnapshot(fixture.pubs[0].id, payload, { capturedAt: at })
  assert.equal(first.duplicate, false)
  assert.equal(second.duplicate, true)
})

await test('telemetry: 平台沒回報的指標不得變成 0', () => {
  const { metrics } = telemetry.normalise({ views: 100, unknown_metric: 5 })
  assert.equal(metrics.views, 100)
  assert.ok(!('clicks' in metrics), '沒回報的指標必須缺席，不能是 0')
})

/* ---------------------------------------------------------------- gates */

await test('gate: 單因子守則會擋下同時改多個維度的 arm', () => {
  assert.throws(
    () => experiments.addArm(fixture.experiment.id, { personaId: fixture.personaId, hook: '完全不同', format: 'image', platform: 'threads', cta: '不同', productRole: 'utility' }, 'test'),
    /只測|已進入/,
  )
})

await test('gate: 未核准的素材不得排入發布', () => {
  const arm = evolution.lineage(fixture.armA.id).children[0]
  const asset = generation.registerAsset({ armId: arm.armId, assetType: 'text', text: '尚未審查的內容' }, 'test')
  assert.throws(
    () => publish.schedulePublication({ assetId: asset.id, socialAccountId: fixture.account.id }, 'test'),
    /尚未核准/,
  )
})

await test('gate: 覆蓋阻擋級 gate 需要明確的 override 與理由', () => {
  const arm = evolution.lineage(fixture.armA.id).children[1]
  // A caption far over the X limit is a blocking platform-format failure.
  const long = 'x'.repeat(600)
  store.db.update('arms', arm.armId, { platform: 'x', format: 'text' })
  const asset = generation.registerAsset({ armId: arm.armId, assetType: 'text', text: long }, 'test')
  const gate = review.evaluateAsset(asset.id, 'test')
  assert.equal(gate.verdict, 'blocked', '超過平台字數上限應被擋下')
  assert.throws(() => review.decide(asset.id, { decision: 'approved', reasonCode: 'OK' }, 'test'), /overrideBlocking/)
  const ok = review.decide(asset.id, { decision: 'approved', reasonCode: 'PLATFORM_FORMAT', notes: '已確認會在發布前截短', overrideBlocking: true }, 'test')
  assert.equal(ok.overrodeBlocking, true, 'override 必須被標記以供稽核')
})

await test('gate: 人設禁止宣稱會被攔下', () => {
  const product = products.requireProduct(fixture.product.id)
  const arm = experiments.requireArm(fixture.armA.id)
  const experiment = experiments.requireExperiment(fixture.experiment.id)
  const result = gates.runGates({
    asset: { assetType: 'text', text: '這套方法保證獲利，我親自試過三個月。' },
    arm, experiment, product,
  })
  const personaGate = result.gates.find((g) => g.gate === 'persona_claims')
  assert.equal(personaGate.result, 'blocking', `應攔下「保證獲利」，實得 ${personaGate.result}`)
})

await test('gate: 紅線第一層永遠不會單獨宣告通過', () => {
  const product = products.requireProduct(fixture.product.id)
  const arm = experiments.requireArm(fixture.armB.id)
  const experiment = experiments.requireExperiment(fixture.experiment.id)
  const result = gates.runGates({ asset: { assetType: 'text', text: '這是一段完全普通的文字。' }, arm, experiment, product })
  assert.ok(result.gates.some((g) => g.gate === 'redline_semantic' && g.result === 'needs_human'),
    '關鍵字比對未命中時仍必須把語意層列為待判定')
})

/* ------------------------------------------------------------ read model */

await test('pipeline: 完成閉環的產品進入 compounding', () => {
  const stage = pipeline.stageOf(fixture.product.id)
  assert.equal(stage.stage, 'compounding')
  assert.equal(stage.counts.winners >= 1, true)
})

await test('portfolio: 樣本不足時建議一律是 RETEST，不得是 SCALE', () => {
  const thin = portfolio.recommend({ experimentCount: 1, sampleSufficient: false, conversions: 3, impressions: 100, winners: 1, contributionUsd: 5, roas: 10, totalCostUsd: 1, attributedValueUsd: 10 })
  assert.equal(thin.state, 'RETEST')
  const vanity = portfolio.recommend({ experimentCount: 3, sampleSufficient: true, conversions: 0, impressions: 500000, winners: 0, contributionUsd: -50, roas: null, totalCostUsd: 50, attributedValueUsd: 0 })
  assert.equal(vanity.state, 'STOP')
})

await test('overview: winner yield 以實驗計算，不以判定筆數計算', () => {
  // Re-evaluating writes a second decision row for the same experiment.
  evaluator.evaluate(fixture.experiment.id, { actor: 'test' })
  const o = pipeline.overview()
  assert.ok(o.winners.yield <= 1, `yield 不得超過 1，實得 ${o.winners.yield}`)
})

/* -------------------------------------------------------------- archive */

await test('archive: 草稿不會出現在任何公開讀取路徑', () => {
  assert.ok(fixture, '前一個測試未通過，無法繼續')
  const draft = archive.createArticle({
    productId: fixture.product.id,
    personaId: fixture.personaId,
    title: '這是一篇還沒發布的草稿',
    summary: '草稿摘要',
    body: '內文。',
    topics: ['測試'],
  }, 'test')

  assert.equal(draft.status, 'draft', '新文章必須預設為草稿——公開必須是明確的動作')
  assert.equal(archive.getPublicBySlug(draft.slug), null, '草稿不得能用 slug 讀到')
  assert.equal(archive.listPublic().some((a) => a.id === draft.id), false, '草稿不得出現在公開清單')
  assert.equal(archive.publicTopics().some((t) => t.topic === '測試' && t.count > 0), false, '草稿的分類不得出現在公開導覽')
})

await test('archive: AI 人設的揭露由人設推出，且明說不是真人', () => {
  const aiPersona = personas.listPersonas().find((p) => (p.tags ?? []).includes('ai-digital-human'))
  assert.ok(aiPersona, '測試資料裡必須有一個標記為 ai-digital-human 的人設')

  const d = archive.disclosureFor(aiPersona.id, fixture.product.id)
  assert.equal(d.kind, 'ai_persona')
  assert.match(d.text, /不是真實存在的人/, '揭露必須直說不是真人——R-AI-DISCLOSURE')
  assert.match(d.text, /不包含任何親身經歷的主張/, '揭露必須同時界定它不會做具身主張——R-EMBODIMENT')
})

await test('archive: 缺分類或摘要不得發布，而且要說得出缺什麼', () => {
  const bare = archive.createArticle({
    productId: fixture.product.id,
    personaId: fixture.personaId,
    title: '沒有摘要也沒有分類',
    body: '內文。',
  }, 'test')

  const readiness = archive.publishReadiness(bare.id)
  assert.equal(readiness.ok, false)
  assert.equal(readiness.reasons.length >= 2, true, `應列出所有缺口，實得：${readiness.reasons}`)
  assert.throws(() => archive.publishArticle(bare.id, { actor: 'test' }), /還不能發布/)
  assert.throws(
    () => archive.publishArticle(bare.id, { actor: 'test', force: true }),
    /必須寫理由/,
    '強制發布沒有理由時必須被擋——覆寫可以，隱形的覆寫不行',
  )
})

await test('archive: 發布後鑄出 per-article 追蹤連結，這是整條路徑唯一的 direct 歸因點', () => {
  const article = archive.createArticle({
    productId: fixture.product.id,
    personaId: fixture.personaId,
    title: '可以發布的一篇',
    summary: '摘要。',
    body: '第一段。\n\n第二段。',
    topics: ['成本'],
  }, 'test')

  const published = archive.publishArticle(article.id, { actor: 'test' })
  assert.equal(published.status, 'published')
  assert.equal(published.disclosure.kind, 'ai_persona')
  assert.ok(published.trackingLinkId, '發布時必須鑄出這篇專屬的追蹤連結')

  const link = store.db.get('trackingLinks', published.trackingLinkId)
  assert.equal(link.articleId, article.id, '連結必須綁回文章，否則點擊無法歸因到單篇')
  assert.equal(link.medium, 'archive')

  assert.equal(archive.getPublicBySlug(published.slug)?.id, article.id, '發布後才讀得到')
  assert.equal(archive.publicTopics().some((t) => t.topic === '成本'), true)
})

/* ---------------------------------------------------------------- report */

const failed = results.filter((r) => !r.ok)
for (const r of results) console.log(`${r.ok ? '  ok' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n        ${r.error}`}`)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
fs.rmSync(DIR, { recursive: true, force: true })
process.exit(failed.length ? 1 : 0)
