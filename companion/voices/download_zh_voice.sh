#!/usr/bin/env bash
# Fetches the zh_CN Piper voice model used in voice/README.md's tested example.
# Run once; the resulting .onnx model is used fully offline afterwards.
set -euo pipefail
cd "$(dirname "$0")"
curl -L -o zh_CN-huayan-medium.onnx \
  https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx
curl -L -o zh_CN-huayan-medium.onnx.json \
  https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx.json
