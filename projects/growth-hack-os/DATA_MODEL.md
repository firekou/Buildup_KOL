# Growth Hack OS — Data Model v0.1

## 1. Data Model Goal

GHOS 的資料模型必須同時支援四件事：

1. **Experiment identity** — 每一筆內容知道自己在測什麼。
2. **Lineage** — Winner 變體可追到 parent。
3. **Attribution** — 社群流量可追到產品 conversion。
4. **Economics** — 每個實驗可計算成本與商業結果。

核心關聯：

```text
Product
└─ Campaign
   ├─ Opportunity
   └─ Experiment
      ├─ ExperimentArm
      │  ├─ CreativeConcept
      │  ├─ Asset
      │  │  └─ ModelRun
      │  └─ Publication
      │     ├─ MetricEvent
      │     └─ AttributionTouch
      ├─ CostEvent
      ├─ WinnerDecision
      └─ MutationJob

Persona ───────────────┘
Product ConversionEvent ─→ AttributionTouch ─→ Publication / Arm
```

---

## 2. Core Tables

### `products`

- `id`
- `name`
- `business_model`
- `status`
- `primary_domain`
- `policy_profile_id`
- `created_at`

### `product_conversion_definitions`

- `id`
- `product_id`
- `event_name`
- `display_name`
- `event_type`
- `value_field`
- `is_primary`
- `schema_version`

### `campaigns`

- `id`
- `product_id`
- `name`
- `objective`
- `status`
- `starts_at`
- `ends_at`
- `owner`

### `signals`

- `id`
- `source_type`
- `source_ref`
- `title`
- `summary`
- `occurred_at`
- `ingested_at`
- `raw_payload_ref`
- `evidence_refs`

### `opportunities`

- `id`
- `product_id`
- `campaign_id`
- `signal_id`
- `topic`
- `why_now`
- `tension`
- `product_relevance`
- `evidence_json`
- `risk_flags_json`
- `freshness_at`
- `status`
- `created_by`

### `personas`

GHOS 不複製完整 KOL 資料；此表保存 reference / cache：

- `id` — 對應 `kols/{kol-id}`
- `source_version`
- `status`
- `synced_at`

### `persona_growth_overlays`

- `persona_id`
- `product_id` nullable
- `product_role`
- `platform_roles_json`
- `audience_hypotheses_json`
- `allowed_claims_json`
- `blocked_claims_json`
- `cta_compatibility_json`
- `policy_version`

### `experiments`

- `id`
- `product_id`
- `campaign_id`
- `opportunity_id`
- `hypothesis`
- `comparison_dimension`
- `primary_outcome`
- `baseline_definition_json`
- `observation_window_json`
- `status`
- `data_completeness_status`
- `created_by`
- `evaluator_version`
- `created_at`

### `experiment_arms`

- `id`
- `experiment_id`
- `persona_id`
- `hook`
- `format`
- `cta`
- `platform`
- `frozen_dimensions_json`
- `tested_dimensions_json`
- `parent_arm_id` nullable
- `mutation_reason` nullable
- `status`

### `creative_concepts`

- `id`
- `arm_id`
- `concept_version`
- `brief_json`
- `prompt_template_id`
- `created_at`

### `prompt_templates`

- `id`
- `name`
- `version`
- `task_type`
- `template`
- `policy_notes`
- `created_at`

### `assets`

- `id`
- `arm_id`
- `asset_type`
- `storage_ref`
- `content_hash`
- `parent_asset_id` nullable
- `generation_status`
- `review_status`
- `created_at`

### `model_runs`

- `id`
- `asset_id`
- `provider`
- `model`
- `prompt_template_id`
- `prompt_version`
- `input_refs_json`
- `usage_json`
- `latency_ms`
- `cost_amount`
- `cost_currency`
- `status`
- `error_code`
- `created_at`

### `review_decisions`

- `id`
- `asset_id`
- `publication_id` nullable
- `review_type`
- `decision`
- `reason_code`
- `notes`
- `reviewer`
- `policy_version`
- `created_at`

### `social_accounts`

- `id`
- `platform`
- `persona_id` nullable
- `account_ref`
- `account_type`
- `status`
- `policy_state`
- `credential_ref`
- `last_sync_at`

`credential_ref` 只存 secret reference，不存明文 credential。

### `publications`

- `id`
- `arm_id`
- `asset_id`
- `social_account_id`
- `platform`
- `platform_post_id`
- `tracking_url_id`
- `status`
- `scheduled_at`
- `published_at`
- `last_metric_sync_at`

### `metric_snapshots`

保存平台原始快照：

- `id`
- `publication_id`
- `captured_at`
- `raw_payload_json`
- `source_version`

### `metric_events`

normalized：

- `id`
- `publication_id`
- `metric_name`
- `metric_value`
- `occurred_at`
- `captured_at`
- `normalizer_version`

### `tracking_links`

- `id`
- `product_id`
- `campaign_id`
- `experiment_id`
- `arm_id`
- `publication_id`
- `destination_url`
- `tracking_code`
- `created_at`

### `conversion_events`

- `id`
- `product_id`
- `event_name`
- `event_external_id`
- `anonymous_or_user_ref` nullable
- `session_ref` nullable
- `click_ref` nullable
- `value_amount` nullable
- `value_currency` nullable
- `occurred_at`
- `received_at`
- `raw_payload_ref`

### `attribution_touches`

- `id`
- `conversion_event_id`
- `publication_id` nullable
- `arm_id` nullable
- `experiment_id` nullable
- `model_name`
- `model_version`
- `attribution_weight` nullable
- `attributed_value` nullable
- `evidence_type`
- `created_at`

`evidence_type` 必須能區分 `direct`, `modeled`, `unknown`。

### `cost_events`

- `id`
- `product_id`
- `campaign_id` nullable
- `experiment_id` nullable
- `arm_id` nullable
- `asset_id` nullable
- `publication_id` nullable
- `cost_type`
- `provider`
- `amount`
- `currency`
- `occurred_at`
- `source_ref`

### `winner_decisions`

- `id`
- `experiment_id`
- `arm_id` nullable
- `decision`
- `baseline_ref`
- `primary_outcome_observed_json`
- `data_completeness_json`
- `decision_reason`
- `evaluator_version`
- `decided_at`

### `mutation_jobs`

- `id`
- `parent_experiment_id`
- `parent_arm_id`
- `mutation_dimension`
- `mutation_instruction_json`
- `frozen_dimensions_json`
- `child_experiment_id` nullable
- `status`
- `created_at`

### `policy_incidents`

- `id`
- `product_id`
- `persona_id` nullable
- `publication_id` nullable
- `incident_type`
- `severity`
- `platform`
- `description`
- `resolution`
- `policy_version`
- `occurred_at`

### `audit_logs`

- `id`
- `actor_type`
- `actor_id`
- `action`
- `entity_type`
- `entity_id`
- `before_json`
- `after_json`
- `reason`
- `created_at`

---

## 3. Standard Event Envelope

所有 async event 使用共同 envelope：

```json
{
  "event_id": "evt_01...",
  "event_name": "product.conversion.occurred",
  "occurred_at": "2026-08-29T12:34:56Z",
  "schema_version": 1,
  "product_id": "prd_01...",
  "campaign_id": "cmp_01...",
  "experiment_id": "exp_01...",
  "arm_id": "arm_01...",
  "persona_id": "iris-chen",
  "asset_id": "ast_01...",
  "publication_id": "pub_01...",
  "platform": "x",
  "source": "product_adapter",
  "properties": {}
}
```

未知欄位允許為 `null`，但不得用猜測值補齊。

---

## 4. Lineage Rules

1. `parent_arm_id` / `parent_asset_id` 只能指向同 product 的歷史物件。
2. lineage 不可形成 cycle。
3. Clone 不可覆寫 parent。
4. Child 必須記錄 mutation dimension。
5. 若一次改多個 dimension，Dashboard 必須標為 multi-factor mutation，不可宣稱單因子因果。
6. 所有 lineage decision 保留 evaluator / operator version。

---

## 5. Attribution Rules

P0 優先順序：

1. Direct tracking link / click ID
2. Product referral / campaign ID
3. Server-side session join
4. Configured attribution model
5. Unattributed

禁止把沒有可驗證連結的 conversion 強行分配給某一篇內容。

Dashboard 必須顯示 attribution coverage。

---

## 6. Cost Ledger Rules

Cost ledger 需要能回答：

- 這個 asset 花多少生成成本？
- 這個 experiment 總共花多少？
- 這個 Persona 一段時間內投入多少？
- Winner family 的 cumulative cost 與 cumulative business value 是多少？

每筆成本要有 `source_ref`，避免 Dashboard 自己推估後無從對帳。

---

## 7. Data Retention / Privacy

- Product user identifier 優先使用 pseudonymous reference。
- 不把不需要的個資拉進 Growth OS。
- Raw platform payload 與 normalized analytics 分離，可設定不同 retention。
- 刪除／更正流程需保留必要 audit，但不得保存不必要的敏感內容副本。
- Persona 的真人 likeness / 授權 metadata 若存在，應有獨立 restricted access。

---

## 8. P0 Data Definition of Done

只要有一個 experiment，工程師應能從 DB 可靠回答：

```text
這個實驗測什麼？
→ 有哪些 arms？
→ 每個 arm 用哪個 Persona / Hook / Asset？
→ 發在哪裡？
→ 花多少？
→ 得到多少 social metrics？
→ 有哪些 product conversions？
→ 哪些 conversion 是直接量到、哪些是模型歸因？
→ evaluator 為何判 Winner / Loser / Inconclusive？
→ Winner 後來 clone 成哪些 child？
```

若其中任何一題只能靠人工翻群組訊息回答，資料模型尚未完成。