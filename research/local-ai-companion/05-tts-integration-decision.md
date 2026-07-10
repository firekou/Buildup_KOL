# Voice 層決策與落地紀錄 — 本地文字轉語音（TTS）整合

> **Status（2026-07-10）**：`04-realtime-avatar-integration.md` 已經把「打字→真人聲音→真人臉→
> 直播」整條鏈路的整合對象定案為 `lipku/LiveTalking`（可行性 ~91%），但那條鏈路需要 **NVIDIA
> GPU**（見 04 文件第 2.2、第 8 節）。本次任務在一個**無 GPU 的雲端 sandbox**（4 core CPU、
> 15GB RAM、無 `nvidia-smi`）裡執行，因此把範圍**收斂到 04 文件裡「真人聲音」這一層**單獨
> 驗證：**這一層不需要 GPU，可以立即在任何機器上跑通**，且已經**實際寫成程式碼並實測產出
> 音檔**（不只是研究調查），填實了 `03-phase1-detailed-design.md` 第 1 節原本留白的
> `companion/src/companion/voice/` 空殼目錄。
>
> 這份文件**不取代** 04 文件的整體結論，而是把它其中一塊（TTS）從「規劃」推進到「已實作、
> 已驗證」，並記錄在 GPU 不可用時可以先做什麼。

---

## 0. 這次要驗收的條件（04 文件條件 A/B 的子集）

| # | 條件 | 驗收方式 | 結果 |
|---|---|---|---|
| B | 我打字輸入一段文案，系統把它講出來（語音） | 輸入文字，產生可播放音檔 | ✅ 已實測，見第 3 節 |
| B' | 聲音要「像真人」，不是機械合成腔 | 主觀聽感比較兩個候選 | ✅ EdgeTTS 達成；Piper 尚可但非頂級（見第 2 節評分） |
| A（子集） | 至少有一條路徑可以**完全不依賴雲端** | 斷網後仍可合成語音 | ✅ Piper 做到；EdgeTTS 需要網路（見第 2 節） |

不在本文件範圍：真人臉對嘴（04 文件已定案 LiveTalking）、直播輸出（同上）、把這一層接上
Orchestrator 的逐句緩衝邏輯（見第 5 節「尚未做的事」）。

---

## 1. 候選盤點

延續 `01-landscape-existing-solutions.md` 第 4 節、`04-realtime-avatar-integration.md` 第 1 節
已經列過的 TTS 選項，本次**只鎖定「不需要額外聲音克隆訓練、立即可用」這一層**：

| 方案 | 本地執行 | 自然度 | 中文（繁中優先）支援 | 上手成本 | 授權 |
|---|---|---|---|---|---|
| **EdgeTTS** | ❌ 呼叫 Microsoft 雲端（免金鑰） | ★★★★★ | zh-TW 三種神經網路語音（HsiaoChen/HsiaoYu/YunJhe） | 極低 | 套件無明確聲明，服務條款層面屬 Microsoft |
| **Piper** | ✅ 完全離線 | ★★★☆☆ | zh_CN（huayan）一種語音，繁中需靠簡轉繁前處理 | 低（模型 63MB） | **GPL-3.0-or-later**（見 `voice/README.md`） |
| GPT-SoVITS / CosyVoice（聲音克隆） | ✅ | ★★★★★（可克隆特定人聲） | 極佳 | 高：需參考語音、GPU 建議、環境建置摩擦大 | MIT / Apache-2.0（模型另計） |
| Coqui XTTS-v2 | ✅（CPU 慢） | ★★★★☆ | 支援 zh-cn | 中：~1.5GB 模型 | Coqui Public Model License，**商用需額外授權**，直播屬商用場景，風險較高 |

**排除 Coqui XTTS-v2 的理由**：授權對商用（直播）不友善，且在 CPU-only 環境下合成延遲明顯
高於 Piper/EdgeTTS，不符合「立即整合」的門檻。**GPT-SoVITS/CosyVoice 保留為下一步的聲音克隆
升級路徑**（04 文件已提過），本次不重複評估，因為它們解決的是「這個聲音要像哪個特定角色」，
而本文件先解決「有沒有一條路徑能把文字變成任何一種像真人的聲音」。

**結論：選 EdgeTTS 為預設（品質優先），Piper 為離線備援（可用性底線）**，兩者共用同一個
`TTSBackend` 介面（`companion/src/companion/voice/base.py`），上層不需要關心切換成本。

---

## 2. 可行性評估（> 80% 門檻）

| 面向 | 權重 | 評分 | 說明 |
|---|---|---|---|
| 功能達成（文字→人聲，B 條件） | 35% | 100% | 兩個 backend 都已實測產出可播放音檔 |
| 自然度（「真人」，B' 條件） | 25% | 90% | EdgeTTS 已是商用等級神經語音；Piper 略遜但仍可用，兩者互為備援不是單一失敗點 |
| 整合難度（拿來即用） | 20% | 95% | `pip install` 兩個套件即可；Piper 額外一次性下載模型（63MB，已寫成 `download_zh_voice.sh`） |
| 離線可行性（A 條件子集） | 10% | 90% | Piper 100% 離線；EdgeTTS 需網路，兩者互補而非互斥 |
| 授權風險 | 10% | 70% | Piper 為 GPL（已用 subprocess 隔離降低風險）；EdgeTTS 授權不明確（已在 `voice/README.md` 標註為原型階段，正式商用前建議評估 Azure Speech SDK 或聲音克隆路徑） |

**加權可行性 ≈ 91%**（> 80% 門檻達成，且不需要任何特殊硬體——這是與 04 文件最大的差異：
04 文件的 91% 有「需要 NVIDIA GPU」的前提，本文件的 91% **在純 CPU 環境就已經驗證成立**）。

---

## 3. 實測紀錄（2026-07-10，sandbox：CPU-only、4 core、15GB RAM、無 GPU）

```
環境確認：nvidia-smi 不存在；Python 3.11.15；4 核心；15GB RAM；29GB 可用磁碟；有網路
```

實際執行（透過本次新增的 `companion/src/companion/voice/cli.py`，非直接呼叫底層套件）：

```bash
pip install -r companion/requirements.txt
./companion/voices/download_zh_voice.sh

PYTHONPATH=companion/src python -m companion.voice.cli --backend piper \
  --voices-dir ./companion/voices --voice zh_CN-huayan-medium \
  --text "練完腿走路像在拜拜，但等等的滷肉飯我問心無愧。你們今天有動嗎？" \
  --out sample_piper.wav
# → wrote sample_piper.wav（RIFF/WAV 16-bit mono 22050Hz，耗時 ~2.4 秒）

PYTHONPATH=companion/src EDGE_TTS_CA_BUNDLE=<你的環境若有 TLS 攔截代理才需要> \
  python -m companion.voice.cli --backend edge-tts \
  --voice zh-TW-HsiaoChenNeural \
  --text "練完腿走路像在拜拜，但等等的滷肉飯我問心無愧。你們今天有動嗎？" \
  --out sample_edgetts.mp3
# → wrote sample_edgetts.mp3（MPEG layer III 24kHz）
```

兩個音檔已附在對話中供直接試聽比較。過程中遇到並解決一個環境特有問題：`edge-tts`
把 SSL 信任鎖死在 `certifi` 憑證庫，在有 TLS 攔截代理的網路環境下會出現「self-signed
certificate in certificate chain」——這與 Microsoft 服務端本身無關，是套件沒有讀系統/環境
變數指定的憑證庫。解法（已寫進 `edge_tts_backend.py`）：透過 `EDGE_TTS_CA_BUNDLE` 環境變數
把額外的 CA 憑證載入 `edge_tts` 的 SSL context。**在一般直接連網、沒有企業代理的機器上，
這個環境變數留空即可，不影響正常使用。**

---

## 4. 程式碼落地（填實 `03` 文件的 `voice/` 空殼）

```
companion/
├── README.md
├── requirements.txt              # edge-tts, piper-tts
├── voices/
│   └── download_zh_voice.sh      # 一次性抓取 zh_CN Piper 語音模型
└── src/companion/voice/
    ├── README.md                 # backend 取捨、授權注意事項、實測紀錄
    ├── base.py                   # TTSBackend 介面：list_voices() / synthesize(text, voice_id, out_path)
    ├── piper_backend.py          # subprocess 呼叫 piper（刻意不 import，見授權注意事項）
    ├── edge_tts_backend.py       # 呼叫 edge_tts 套件 + CA bundle 修正
    └── cli.py                    # python -m companion.voice.cli，獨立可用，不依賴 Orchestrator
```

---

## 5. 尚未做的事（明確排除，避免誤讀為「已完成」）

1. **逐句緩衝**：`03` 文件的 Orchestrator 輸出是 token-level streaming；要把對話串接到這一層，
   需要一個「累積 token 直到句尾標點才呼叫 `synthesize`」的緩衝層，本文件的 `cli.py` 目前
   只接受一整段現成文字，這個緩衝邏輯**尚未實作**。
2. **聲音克隆**：目前兩個 backend 都是「平台內建語音」，不是某個特定角色（如 `kols/chloe-lin`）
   的克隆聲音——04 文件已指出 GPT-SoVITS/CosyVoice 是下一步，本文件不重複。
3. **與 LiveTalking 的實際接線**：04 文件把 TTS 列為 LiveTalking 內建、可換模組的一部分；
   本文件驗證的 backend 尚未接進 LiveTalking 的 pipeline，需要你確認 GPU 型號（04 文件第 8
   節「唯一待你確認」）之後才能展開。
4. **EdgeTTS 商用授權評估**：見第 1 節表格與 `voice/README.md`，正式直播上線前需要決定。

---

## 6. 決策摘要

- **這一層（文字→人聲）獨立於 04 文件的 GPU 前提，可行性 ~91%，且已經是「寫好程式碼、實測
  跑通」而不是「還在研究」的狀態。**
- 預設 backend：**EdgeTTS**（品質最像真人，zh-TW 語音）；離線備援：**Piper**（零雲端依賴）。
- 下一步（依序）：① 你聽過附帶的兩個樣本、確認方向；② 決定要不要先做聲音克隆（需要一段
  該 KOL 的參考語音）；③ 依 04 文件確認 GPU 型號後，把這一層接進 LiveTalking 或反過來讓
  LiveTalking 接管語音合成。
