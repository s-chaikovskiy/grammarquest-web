#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Синтез озвучки через Azure Speech.

Казахские нейроголоса есть у Azure: kk-KZ-AigulNeural (женский) и
kk-KZ-DauletNeural (мужской). Встроенная в браузер озвучка для казахского
не годится — казахских голосов там попросту нет (проверено: на типовой
машине 157 голосов, ни одного казахского).

Ключ берётся из переменных окружения и в репозиторий не попадает:

    export AZURE_SPEECH_KEY=...
    export AZURE_SPEECH_REGION=westeurope
    python3 tools/tts/synthesize.py

Скрипт пропускает уже записанные файлы, поэтому его можно прерывать
и запускать повторно. Объём для оценки стоимости печатается перед стартом.
"""
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
MANIFEST = ROOT / "src" / "data" / "audio-manifest.json"
OUT = ROOT / "public" / "audio"

VOICE = os.environ.get("AZURE_SPEECH_VOICE", "kk-KZ-AigulNeural")
KEY = os.environ.get("AZURE_SPEECH_KEY")
REGION = os.environ.get("AZURE_SPEECH_REGION", "westeurope")

# Чуть медленнее обычного: ученик слышит язык впервые.
RATE = os.environ.get("AZURE_SPEECH_RATE", "-8%")


def ssml(text: str) -> str:
    safe = (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="kk-KZ">'
        f'<voice name="{VOICE}"><prosody rate="{RATE}">{safe}</prosody></voice></speak>'
    )


def synth(text: str) -> bytes:
    req = urllib.request.Request(
        f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml(text).encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "grammarquest",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def main():
    items = json.loads(MANIFEST.read_text(encoding="utf-8"))["items"]
    OUT.mkdir(parents=True, exist_ok=True)

    todo = [e for e in items if not (OUT / f"{e['id']}.mp3").exists()]
    chars = sum(len(e["text"]) for e in todo)
    print(f"Всего фраз: {len(items)}, уже записано: {len(items) - len(todo)}")
    print(f"К синтезу: {len(todo)} фраз, {chars} символов, голос {VOICE}")

    if not KEY:
        print("\nПеременная AZURE_SPEECH_KEY не задана — синтез не запускается.")
        print("Это не ошибка: приложение работает и без озвучки.")
        print("Чтобы озвучить, задайте ключ и регион и запустите скрипт снова.")
        return

    if not todo:
        print("Всё уже записано.")
        return

    done = failed = 0
    for i, entry in enumerate(todo, 1):
        try:
            data = synth(entry["text"])
            (OUT / f"{entry['id']}.mp3").write_bytes(data)
            done += 1
        except Exception as exc:                      # noqa: BLE001
            failed += 1
            print(f"  ✗ {entry['text'][:40]}: {exc}")
        if i % 25 == 0:
            print(f"  {i}/{len(todo)}…")
        time.sleep(0.12)          # бережём лимит запросов

    print(f"\nГотово: {done}, с ошибкой: {failed}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
