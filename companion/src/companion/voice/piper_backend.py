"""Fully offline TTS via Piper (https://github.com/OHF-voice/piper1-gpl).

Invoked as a subprocess (the installed `piper` console script), not imported
as a library. `piper-tts` on PyPI is GPL-3.0-or-later; calling it as an
arm's-length external process — the same relationship your code has with
`ffmpeg` — keeps this file's own license unaffected. See voice/README.md
"授权注意事项" before switching this to an in-process `from piper import
PiperVoice` call, which would create a combined work under GPL.

Zero network calls at synthesis time: once the .onnx voice model is on disk,
this works with no internet connection at all.
"""

import shutil
import subprocess

from .base import TTSBackend, Voice


class PiperBackend(TTSBackend):
    name = "piper"

    def __init__(self, voices_dir: str, piper_bin: str = "piper"):
        self.voices_dir = voices_dir
        self.piper_bin = piper_bin
        if shutil.which(piper_bin) is None:
            raise RuntimeError(
                f"'{piper_bin}' not found on PATH. Install with: pip install piper-tts"
            )

    def list_voices(self) -> list[Voice]:
        import glob
        import os

        voices = []
        for onnx_path in sorted(glob.glob(f"{self.voices_dir}/*.onnx")):
            voice_id = os.path.splitext(os.path.basename(onnx_path))[0]
            voices.append(Voice(id=voice_id, label=voice_id, language=voice_id.split("-")[0]))
        return voices

    def synthesize(self, text: str, voice_id: str, out_path: str) -> None:
        model_path = f"{self.voices_dir}/{voice_id}.onnx"
        result = subprocess.run(
            [self.piper_bin, "-m", model_path, "-f", out_path],
            input=text,
            text=True,
            capture_output=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"piper failed: {result.stderr}")
