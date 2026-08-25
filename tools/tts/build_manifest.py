#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Список фраз для озвучки.

Озвучивать всё подряд не нужно и вредно: грамматические объяснения на слух
не воспринимаются, а длинные записи никто не дослушивает. Озвучиваем то,
что ученик должен научиться произносить сам:

  1. Словарные слова      — основа произношения
  2. Правильные ответы    — та форма, которую он только что построил
  3. Реплики диалогов     — живая речь в контексте

Имя файла — короткий хеш от текста. Так один и тот же текст не записывается
дважды, а приложение находит запись, не храня отдельной таблицы.

Запуск: python3 tools/tts/build_manifest.py
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
LESSONS = ROOT / "src" / "data" / "lessons.json"
VOCAB = ROOT / "src" / "data" / "vocabulary.json"
MANIFEST = ROOT / "tools" / "tts" / "audio-manifest.json"
INDEX = ROOT / "src" / "data" / "audio-index.json"
PHRASES = ROOT / "tools" / "tts" / "фразы-для-записи.md"

# Реплики длиннее этого не озвучиваем: их не переслушивают.
MAX_CHARS = 120


def audio_id(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def clean(text: str) -> str:
    return " ".join(text.replace("\n", " ").split()).strip()


# Кто произносит реплику. Имя стоит в начале строки — так же, как их разбирает
# само приложение (src/utils/helpers.ts, splitDialogue).
SPEAKERS = {
    "мұғалім": "teacher",
    "учитель": "teacher",
    "айша": "girl",
    "дима": "boy",
}


def split_speaker(line: str, fallback: str) -> tuple[str, str]:
    """Отделяет имя говорящего от самой реплики."""
    head, sep, tail = line.partition(":")
    name = head.strip().lower()
    if sep and 2 <= len(head) <= 20 and name in SPEAKERS:
        return SPEAKERS[name], tail.strip()
    return fallback, line.strip()


# Казахских нейроголосов у Azure ровно два. Женский — основной: им читаются
# слова, ответы и реплики Айши. Мужской достаётся Диме и учителю, иначе в
# диалоге двух собеседников не различить на слух.
VOICE_BY_SPEAKER = {
    "girl": "kk-KZ-AigulNeural",
    "teacher": "kk-KZ-DauletNeural",
    "boy": "kk-KZ-DauletNeural",
}
DEFAULT_VOICE = "kk-KZ-AigulNeural"


def character_to_speaker(character: str) -> str:
    return {
        "AISHA": "girl", "GIRL": "girl",
        "DIMA": "boy", "BOY": "boy",
    }.get((character or "").upper(), "teacher")


def main():
    lessons = json.loads(LESSONS.read_text(encoding="utf-8"))["lessons"]
    vocab = json.loads(VOCAB.read_text(encoding="utf-8"))["words"]

    entries: dict[str, dict] = {}

    def add(text: str, kind: str, priority: int, ru: str = "", speaker: str = "girl"):
        text = clean(text)
        if not text or len(text) > MAX_CHARS:
            return
        # Цифры озвучивать незачем: ученику нужно услышать «он», а не «десять».
        if not any(ch.isalpha() for ch in text):
            return
        key = audio_id(text)
        existing = entries.get(key)
        if existing:
            # Приоритет берём самый высокий из встретившихся.
            existing["priority"] = min(existing["priority"], priority)
            return
        entries[key] = {
            "id": key,
            "text": text,
            "ru": clean(ru),
            "kind": kind,
            "priority": priority,
            "speaker": speaker,
            "voice": VOICE_BY_SPEAKER.get(speaker, DEFAULT_VOICE),
        }

    for word in vocab:
        add(word["kz"], "word", 1, word["ru"], speaker="girl")

    for lesson in lessons:
        for step in lesson["steps"]:
            if "/" not in step["answerKz"]:
                add(step["answerKz"], "answer", 2, step["answerRu"], speaker="girl")
            # Диалог — это обмен репликами, и приложение показывает их по одной.
            # Записываем так же построчно: иначе кнопка «послушать» рядом с
            # репликой не найдёт файл, а в одной записи звучали бы оба
            # собеседника подряд одним голосом.
            fallback = character_to_speaker(lesson.get("character", ""))
            kz_lines = [x for x in step["dialogueKz"].split("\n") if x.strip()]
            ru_lines = [x for x in step["dialogueRu"].split("\n") if x.strip()]
            for i, raw in enumerate(kz_lines):
                who, line = split_speaker(raw, fallback)
                _, line_ru = split_speaker(ru_lines[i], fallback) if i < len(ru_lines) else ("", "")
                add(line, "dialogue", 3, line_ru, speaker=who)

    items = sorted(entries.values(), key=lambda e: (e["priority"], e["text"]))

    # Полный манифест — для скриптов синтеза и списка на запись.
    MANIFEST.write_text(
        json.dumps({"version": 1, "items": items}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )

    # В приложение уходит только то, что нужно для поиска записи по тексту:
    # переводы и пометки типа в браузере не используются, а весят втрое больше.
    INDEX.write_text(
        json.dumps({"version": 1, "items": [[e["id"], e["text"]] for e in items]},
                   ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    by_kind: dict[str, int] = {}
    chars = 0
    for e in items:
        by_kind[e["kind"]] = by_kind.get(e["kind"], 0) + 1
        chars += len(e["text"])

    print(f"Фраз к озвучке: {len(items)} (символов {chars})")
    for kind, n in sorted(by_kind.items(), key=lambda kv: -kv[1]):
        label = {"word": "слова", "answer": "ответы", "dialogue": "реплики диалогов"}[kind]
        print(f"  {label:20} {n}")

    # Текстовый список — для записи живым голосом.
    lines = [
        "# Фразы для записи",
        "",
        f"Всего: {len(items)}. Порядок — от самого нужного к менее важному,",
        "поэтому запись можно прервать в любой момент: приложение озвучит то,",
        "что успели записать, а остальное просто останется без звука.",
        "",
        "**Как записывать.** Один файл на фразу, имя файла — код из первой колонки,",
        f"формат mp3, тихая комната, ровный темп чуть медленнее обычного. Готовые файлы",
        "положить в `public/audio/`.",
        "",
    ]
    for kind, label in (("word", "Слова"), ("answer", "Ответы"), ("dialogue", "Реплики диалогов")):
        group = [e for e in items if e["kind"] == kind]
        if not group:
            continue
        lines += [f"## {label} ({len(group)})", "", "| Имя файла | Кто говорит | Текст | Перевод |", "|---|---|---|---|"]
        who_ru = {"girl": "Айша", "boy": "Дима", "teacher": "Учитель"}
        lines += [f"| `{e['id']}.mp3` | {who_ru.get(e['speaker'], '—')} | {e['text']} | {e['ru']} |" for e in group]
        lines.append("")
    PHRASES.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nСписок для записи голосом: {PHRASES.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
