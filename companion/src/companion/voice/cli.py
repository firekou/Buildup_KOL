"""Minimal standalone entry point for the voice layer.

Usage:
    python -m companion.voice.cli --backend piper \
        --voice zh_CN-huayan-medium --text "早安！今天喝抹茶了嗎🤍" --out out.wav

    python -m companion.voice.cli --backend edge-tts \
        --voice zh-TW-HsiaoChenNeural --text "早安！今天喝抹茶了嗎🤍" --out out.mp3

This does not depend on the Persona/Orchestrator/LLM layers described in
03-phase1-detailed-design.md — it is usable today on its own: type text in,
get a spoken audio file out. Wiring it to the Orchestrator's streaming
TokenChunk output (sentence-buffered) is future work, not required for this
layer to already be useful.
"""

import argparse
import sys

from .edge_tts_backend import EdgeTTSBackend
from .piper_backend import PiperBackend

BACKENDS = {
    "piper": lambda voices_dir: PiperBackend(voices_dir=voices_dir),
    "edge-tts": lambda voices_dir: EdgeTTSBackend(),
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Text-to-speech CLI")
    parser.add_argument("--backend", choices=BACKENDS.keys(), required=True)
    parser.add_argument("--voice", required=True, help="voice id, see --list-voices")
    parser.add_argument("--text", help="text to speak")
    parser.add_argument("--out", help="output audio file path")
    parser.add_argument(
        "--voices-dir",
        default="./voices",
        help="directory containing Piper .onnx voice models (piper backend only)",
    )
    parser.add_argument("--list-voices", action="store_true")
    args = parser.parse_args()

    backend = BACKENDS[args.backend](args.voices_dir)

    if args.list_voices:
        for v in backend.list_voices():
            print(f"{v.id}\t{v.language}\t{v.label}")
        return

    if not args.text or not args.out:
        print("--text and --out are required unless --list-voices is given", file=sys.stderr)
        sys.exit(1)

    backend.synthesize(args.text, args.voice, args.out)
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
