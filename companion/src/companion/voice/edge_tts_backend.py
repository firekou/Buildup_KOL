"""TTS via Microsoft Edge's neural voices (https://github.com/rany2/edge-tts).

Not a "local" model — it calls Microsoft's cloud endpoint over WebSocket —
but needs no API key/account and produces production-grade neural voices,
including several zh-TW voices matching this repo's KOL persona files. Kept
as the "works immediately, best default quality" option; `PiperBackend` is
the fully-offline fallback when there's no internet or the destination host
is blocked by a network policy.

`edge_tts` pins its SSL trust to the `certifi` CA bundle instead of the
system trust store, so behind a TLS-intercepting proxy (as in this sandbox)
requests fail with "self-signed certificate in certificate chain" even
though the destination itself is reachable. Set `EDGE_TTS_CA_BUNDLE` to an
extra CA file to trust (e.g. a corporate/proxy CA) to fix that; leave unset
on a normal machine with direct internet access.
"""

import asyncio
import os

import edge_tts

from .base import TTSBackend, Voice

_EXTRA_CA_BUNDLE = os.environ.get("EDGE_TTS_CA_BUNDLE")
if _EXTRA_CA_BUNDLE:
    edge_tts.communicate._SSL_CTX.load_verify_locations(cafile=_EXTRA_CA_BUNDLE)


class EdgeTTSBackend(TTSBackend):
    name = "edge-tts"

    async def _list_voices_async(self) -> list[Voice]:
        raw = await edge_tts.list_voices()
        return [
            Voice(id=v["ShortName"], label=v["FriendlyName"], language=v["Locale"])
            for v in raw
        ]

    def list_voices(self) -> list[Voice]:
        return asyncio.run(self._list_voices_async())

    async def _synthesize_async(self, text: str, voice_id: str, out_path: str) -> None:
        communicate = edge_tts.Communicate(text, voice_id)
        await communicate.save(out_path)

    def synthesize(self, text: str, voice_id: str, out_path: str) -> None:
        asyncio.run(self._synthesize_async(text, voice_id, out_path))
