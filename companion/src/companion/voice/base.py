"""Common interface every TTS backend implements.

Kept intentionally tiny: one method, text in, an audio file on disk out.
`03-phase1-detailed-design.md` streams text as TokenChunks; a backend that
wants token-level streaming synthesis can buffer chunks into sentences and
call `synthesize` per sentence — that policy lives in the caller, not here.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class Voice:
    id: str
    label: str
    language: str


class TTSBackend(ABC):
    name: str

    @abstractmethod
    def list_voices(self) -> list[Voice]:
        ...

    @abstractmethod
    def synthesize(self, text: str, voice_id: str, out_path: str) -> None:
        """Render `text` as speech and write it to `out_path` (wav or mp3)."""
        ...
