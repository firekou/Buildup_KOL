# Voice Layer — 本地文字轉語音（TTS）整合

> 這是 `../../../research/local-ai-companion/03-phase1-detailed-design.md` 第 1 節裡原本標記為
> 「空殼目錄，現在不實作」的 `voice/`。本次任務把它填實：**打字輸入文案 → 產生人聲音檔**，
> 兩個 backend 都已在無 GPU 的 CPU-only 環境下實測跑通，可直接用。

## 為什麼是這兩個 backend

沿用 `04-realtime-avatar-integration.md` 第 2.1 節已經盤點過的 TTS 選項（EdgeTTS 開箱即用 /
GPT-SoVITS·CosyVoice 聲音克隆），但**縮小到「立即可用、免額外聲音克隆訓練」的這一層**：

| Backend | 是否本地執行 | 語音自然度 | 上手成本 | 授權 |
|---|---|---|---|---|
| **EdgeTTS**（`edge-tts` PyPI 套件） | ❌ 呼叫 Microsoft 雲端端點（免 API key） | ★★★★★ 商用等級神經網路語音，繁中 zh-TW 語音（HsiaoChen/HsiaoYu/YunJhe）與角色人設高度匹配 | 極低：`pip install edge-tts` 即可，零模型下載 | 套件本身無明確 license 聲明；呼叫的是 Microsoft 服務條款範疇 |
| **Piper**（`piper-tts` PyPI 套件，OHF-voice/piper1-gpl） | ✅ 完全離線，推理階段零網路呼叫 | ★★★☆☆ 尚可，中文語音（huayan）略偏平淡，非頂級自然度 | 低：`pip install piper-tts` + 下載一個 `.onnx` 語音模型（本例 63MB） | **GPL-3.0-or-later** —— 見下方「授權注意事項」 |

兩者互補：EdgeTTS 給「現在就要最像真人的聲音」，Piper 給「保證離線、不依賴任何雲端服務」的
底線方案。兩者共用同一個 `TTSBackend` 介面（`base.py`），上層（CLI 或未來的 Orchestrator）
不需要關心用了哪一個。

## 授權注意事項（重要，直播＝商用場景）

- **Piper**：目前 PyPI 上的 `piper-tts`（`OHF-voice/piper1-gpl`）是 **GPL-3.0-or-later**。
  `piper_backend.py` 刻意用 `subprocess` 呼叫已安裝的 `piper` 執行檔，而不是
  `from piper import PiperVoice` 直接 import 成同一個 process——這與呼叫 `ffmpeg`
  的關係相同，是「外部獨立程式」而非「連結成同一個作品」，一般認為不會讓呼叫端程式碼被
  GPL 傳染。**若之後要改成直接 import Piper 的 Python API 以換取效能，請先重新確認授權影響。**
  Piper 的語音模型（`.onnx`，如本例的 `zh_CN-huayan-medium`）另有自己的授權（多數是
  CC0 / CC-BY，依 Hugging Face `rhasspy/piper-voices` 各語音頁面標示，正式上線前逐一確認）。
- **EdgeTTS**：呼叫的是 Microsoft 未公開文件化的端點，`edge-tts` 套件本身沒有明確
  license 聲明；長期商用（尤其是直播帶貨）建議視為「原型/驗證階段」的選項，正式上線前
  應評估是否改用 Microsoft Azure 官方 Speech SDK（付費但有明確商用授權）或本文件的
  Piper／GPT-SoVITS 離線路徑。
- **真人聲音克隆**（如 04 文件提到的 GPT-SoVITS/CosyVoice）不在本次範圍——那需要「該角色的
  參考語音」，本層先用平台內建語音把「打字→講出來」的鏈路打通，聲音克隆是下一步的獨立任務。

## 已實測（2026-07-10，此 sandbox：CPU-only、4 core、無 GPU）

```bash
pip install -r companion/requirements.txt

# 下載一個中文 Piper 語音模型（僅需一次，之後離線可用）
mkdir -p voices
curl -L -o voices/zh_CN-huayan-medium.onnx \
  https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx
curl -L -o voices/zh_CN-huayan-medium.onnx.json \
  https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx.json

# 完全離线：CPU 生成一句中文語音，實測 ~2.4 秒
python -m companion.voice.cli --backend piper --voices-dir ./voices \
  --voice zh_CN-huayan-medium \
  --text "明明只是要去巷口買咖啡，結果穿成這樣被店員多看兩眼。" \
  --out sample_piper.wav

# EdgeTTS（zh-TW 神經網路語音，品質更接近真人）
python -m companion.voice.cli --backend edge-tts \
  --voice zh-TW-HsiaoChenNeural \
  --text "明明只是要去巷口買咖啡，結果穿成這樣被店員多看兩眼。" \
  --out sample_edgetts.mp3
```

兩條路徑都成功產生了可播放的音檔（`sample_piper.wav`：RIFF/WAV 16-bit mono 22050Hz；
`sample_edgetts.mp3`：MPEG layer III 24kHz），已附在對話中供你直接試聽比較。

## 與後續 Phase 的接點

- **往上接 Orchestrator**：`03` 文件的 `send_message` 是逐 token streaming
  （`TokenChunk` 序列，見 `03-phase1-detailed-design.md` 第 3.3 節）。要接上這裡，
  上層需要把 token 流按句子邊界（句號/問號/驚嘆號/換行）緩衝成完整句子，再逐句呼叫
  `TTSBackend.synthesize`——這個緩衝邏輯目前**尚未實作**，屬於下一步工作，不在本次範圍。
- **往下接 LiveTalking（`04-realtime-avatar-integration.md`）**：`04` 文件已經把
  「TTS 模組化、可換 EdgeTTS/GPT-SoVITS」列為 LiveTalking 的既有能力。這裡實作的
  `TTSBackend` 抽象與 LiveTalking 的模組化 TTS 精神一致，之後若決定讓 LiveTalking
  接管語音合成（因為它同時要驅動嘴型同步），這一層可以直接退位，或反過來把這裡驗證過的
  聲音克隆語音（GPT-SoVITS）注入 LiveTalking 的 TTS 設定——兩條路都不衝突。
