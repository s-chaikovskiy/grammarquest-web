#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Синтез озвучки казахскими нейроголосами.

Казахских голосов нет ни в macOS, ни в браузере: на этой машине 143 голоса
системы и 322 голоса Edge — казахские есть только во вторых. Нужны
kk-KZ-AigulNeural (женский) и kk-KZ-DauletNeural (мужской).

Два способа получить те же самые голоса:

    edge   — через edge-tts, ключ не нужен (по умолчанию)
    azure  — через Azure Speech, нужен ключ в переменной окружения

    python3 tools/tts/synthesize.py           # edge, без ключа
    TTS_BACKEND=azure AZURE_SPEECH_KEY=... python3 tools/tts/synthesize.py

Голоса в обоих случаях одни и те же — это озвучка Microsoft, отличается
только способ доступа. Ключ, если он используется, берётся из окружения
и в репозиторий не попадает.

Скрипт пропускает уже записанные файлы, поэтому его можно прерывать
и запускать повторно.
"""
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
MANIFEST = ROOT / "tools" / "tts" / "audio-manifest.json"
OUT = ROOT / "public" / "audio"

# Голос берётся из манифеста — у каждой реплики свой говорящий. Переменной
# окружения можно перекрыть все сразу, если понадобится один голос на всё.
VOICE_OVERRIDE = os.environ.get("AZURE_SPEECH_VOICE")
DEFAULT_VOICE = "kk-KZ-AigulNeural"
KEY = os.environ.get("AZURE_SPEECH_KEY")
REGION = os.environ.get("AZURE_SPEECH_REGION", "westeurope")
BACKEND = os.environ.get("TTS_BACKEND", "edge").lower()

# Чуть медленнее обычного: ученик слышит язык впервые.
RATE = os.environ.get("AZURE_SPEECH_RATE", "-8%")


def ssml(text: str, voice: str) -> str:
    safe = (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="kk-KZ">'
        f'<voice name="{voice}"><prosody rate="{RATE}">{safe}</prosody></voice></speak>'
    )


def synth_edge(text: str, voice: str) -> bytes:
    """edge-tts: те же голоса Microsoft, но без ключа.

    Библиотека асинхронная и умеет только писать в файл, поэтому пишем
    во временный и читаем обратно: остальной скрипт работает с байтами.
    """
    import asyncio
    import tempfile

    import edge_tts

    async def run(path: str) -> None:
        # Таймаут обязателен: без него одна зависшая фраза останавливает
        # весь прогон молча — процесс живёт, файлы не появляются, и понять,
        # что он встал, можно только по времени последней записи.
        await asyncio.wait_for(
            edge_tts.Communicate(text, voice, rate=RATE).save(path), timeout=25
        )

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        tmp = f.name
    try:
        asyncio.run(run(tmp))
        data = Path(tmp).read_bytes()
    finally:
        Path(tmp).unlink(missing_ok=True)
    if not data:
        raise RuntimeError("пустой ответ синтеза")
    return data


def synth_azure(text: str, voice: str) -> bytes:
    req = urllib.request.Request(
        f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml(text, voice).encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "tilashar",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def synth(text: str, voice: str) -> bytes:
    return synth_azure(text, voice) if BACKEND == "azure" else synth_edge(text, voice)


def main():
    items = json.loads(MANIFEST.read_text(encoding="utf-8"))["items"]
    OUT.mkdir(parents=True, exist_ok=True)

    todo = [e for e in items if not (OUT / f"{e['id']}.mp3").exists()]
    chars = sum(len(e["text"]) for e in todo)
    voices: dict[str, int] = {}
    for e in todo:
        v = VOICE_OVERRIDE or e.get("voice", DEFAULT_VOICE)
        voices[v] = voices.get(v, 0) + 1
    print(f"Всего фраз: {len(items)}, уже записано: {len(items) - len(todo)}")
    print(f"К синтезу: {len(todo)} фраз, {chars} символов")
    for v, n in sorted(voices.items()):
        print(f"  {v:22} {n}")

    print(f"Способ синтеза: {BACKEND}")
    if BACKEND == "azure" and not KEY:
        print("\nПеременная AZURE_SPEECH_KEY не задана — синтез не запускается.")
        print("Либо задайте ключ, либо уберите TTS_BACKEND=azure: без него")
        print("те же голоса берутся через edge-tts и ключ не нужен.")
        return

    if not todo:
        print("Всё уже записано.")
        return

    done = failed = 0
    for i, entry in enumerate(todo, 1):
        try:
            data = synth(entry["text"], VOICE_OVERRIDE or entry.get("voice", DEFAULT_VOICE))
            (OUT / f"{entry['id']}.mp3").write_bytes(data)
            done += 1
        except Exception as exc:                      # noqa: BLE001
            failed += 1
            print(f"  ✗ {entry['text'][:40]}: {exc}", flush=True)
        if i % 25 == 0:
            print(f"  {i}/{len(todo)}…", flush=True)
        time.sleep(0.12)          # бережём лимит запросов

    print(f"\nГотово: {done}, с ошибкой: {failed}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
