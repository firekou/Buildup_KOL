# companion — Local AI Companion 程式碼庫

程式碼對應的設計文件在 `../research/local-ai-companion/`。目前只有 **voice/** 這一層有實際
實作（見 `src/companion/voice/README.md`）——persona/orchestrator/backend/interface（純文字
對話核心，`03-phase1-detailed-design.md`）與 avatar/（真人數位人 + 直播，
`04-realtime-avatar-integration.md`）尚未動工。

## 快速開始（Voice layer）

```bash
pip install -r requirements.txt
./voices/download_zh_voice.sh   # 下載一次，之後完全離線可用

PYTHONPATH=src python -m companion.voice.cli --backend piper --voices-dir ./voices \
  --voice zh_CN-huayan-medium --text "你好，這是本地語音測試。" --out out.wav
```

詳見 `src/companion/voice/README.md`：兩個 backend（Piper / EdgeTTS）的取捨、授權注意事項、
與後續 Phase 的接點。
