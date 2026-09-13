#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Список фраз для озвучки.

Озвучивается то, что ученик слышит от героев: реплики диалога — голосом
того, кто говорит, — и правильный ответ после проверки. Правила не
озвучиваются: на слух длинное объяснение не воспринимается.

Имя файла — короткий хеш от текста. Так один и тот же текст не записывается
дважды, а приложение находит запись, не храня отдельной таблицы.

Записи, которых нет в списке, удаляются из public/audio: после того как
учитель сократила приложение, там остались бы сотни файлов от уроков,
которых больше нет, — лишние мегабайты в каждой установке.

Запуск: python3 tools/tts/build_manifest.py
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
LESSONS = ROOT / "src" / "data" / "lessons.json"
MANIFEST = ROOT / "tools" / "tts" / "audio-manifest.json"
INDEX = ROOT / "src" / "data" / "audio-index.json"
PHRASES = ROOT / "tools" / "tts" / "фразы-для-записи.md"
AUDIO = ROOT / "public" / "audio"

# Казахских нейроголосов ровно два, мужской и женский. Обе героини — женщины:
# учитель на картинке — взрослая женщина, Айша — девочка. Мужской голос
# учителю противоречил картинке, поэтому обе говорят женским, а различаются
# высотой и темпом: Айша выше и чуть живее, учитель — ровнее и спокойнее.
VOICE_BY_SPEAKER = {
    "girl": "kk-KZ-AigulNeural",
    "teacher": "kk-KZ-AigulNeural",
}
PROSODY_BY_SPEAKER = {
    "girl": {"pitch": "+18Hz", "rate": "-4%"},
    "teacher": {"pitch": "-6Hz", "rate": "-10%"},
}
WHO_RU = {"girl": "Айша", "teacher": "Мұғалім"}


def audio_id(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def clean(text: str) -> str:
    return " ".join(text.replace("\n", " ").split()).strip()


def main():
    lessons = json.loads(LESSONS.read_text(encoding="utf-8"))["lessons"]
    entries: dict[str, dict] = {}

    def add(text: str, kind: str, speaker: str):
        text = clean(text)
        # Окончание само по себе («-нші») не произносится — звучит готовое слово.
        if not text or text.startswith("-") or not any(ch.isalpha() for ch in text):
            return
        entries.setdefault(audio_id(text), {
            "id": audio_id(text),
            "text": text,
            "kind": kind,
            "speaker": speaker,
            "voice": VOICE_BY_SPEAKER[speaker],
            **PROSODY_BY_SPEAKER[speaker],
        })

    for lesson in lessons:
        for step in lesson["steps"]:
            for line in step["dialogue"]:
                add(line["kz"], "dialogue", line["who"])
            task = step["task"]
            for answer in task["answers"]:
                add(answer, "answer", "teacher")
            if task.get("result"):
                add(task["result"], "answer", "teacher")

    items = sorted(entries.values(), key=lambda e: (e["kind"], e["text"]))
    MANIFEST.write_text(json.dumps({"version": 2, "items": items}, ensure_ascii=False, indent=1),
                        encoding="utf-8")

    AUDIO.mkdir(parents=True, exist_ok=True)
    stale = [p for p in AUDIO.glob("*.mp3") if p.stem not in entries]
    for p in stale:
        p.unlink()
    available = sorted(p.stem for p in AUDIO.glob("*.mp3"))

    # Приложение знает заранее, какие записи лежат в сборке, и не спрашивает
    # файлы по сети — иначе обещание «работает без интернета» не выполняется.
    INDEX.write_text(
        json.dumps({"version": 3, "items": [[e["id"], e["text"]] for e in items], "available": available},
                   ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    lines = ["# Фразы для записи", "", f"Всего: {len(items)}.", "",
             "| Имя файла | Кто говорит | Текст |", "|---|---|---|"]
    lines += [f"| `{e['id']}.mp3` | {WHO_RU[e['speaker']]} | {e['text']} |" for e in items]
    PHRASES.write_text("\n".join(lines) + "\n", encoding="utf-8")

    missing = len(items) - len(set(available) & set(entries))
    print(f"Фраз к озвучке: {len(items)} · удалено лишних записей: {len(stale)} · "
          f"не записано: {missing}")
    if missing:
        print("  Записать: python3 tools/tts/synthesize.py, затем снова эту команду.")


if __name__ == "__main__":
    main()
