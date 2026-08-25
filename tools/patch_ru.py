#!/usr/bin/env python3
"""
Замена русского слоя уроков.

Исходные данные содержали русские поля, описывающие РУССКУЮ грамматику:
диалог шёл от другого лица, «перевод» был другим текстом, а правило
объясняло спряжение русских глаголов вместо казахских аффиксов.
Для продукта «казахский для русскоязычных» русская половина обязана
быть переводом и объяснением казахской.

Скрипт принимает JSON-файл вида
    {"kzru_grammar_01": [{"dialogueRu": "...", "grammarRu": "...", ...}, ...]}
и вносит правки в lessons.source.json (по одному объекту на шаг, по порядку;
null или отсутствующее поле оставляет прежнее значение).

Запуск: python3 tools/patch_ru.py путь/к/патчу.json
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "lessons.source.json"
ALLOWED = {"dialogueRu", "grammarRu", "taskRu", "answerRu", "teacherRu1", "teacherRu2"}


def main(patch_path: str):
    data = json.loads(SRC.read_text(encoding="utf-8"))
    patch = json.loads(Path(patch_path).read_text(encoding="utf-8"))
    lessons = {l["id"]: l for l in data["lessons"]}

    changed = 0
    for lesson_id, steps_patch in patch.items():
        lesson = lessons.get(lesson_id)
        if lesson is None:
            sys.exit(f"Урок {lesson_id} не найден")
        if len(steps_patch) != len(lesson["steps"]):
            sys.exit(f"{lesson_id}: в патче {len(steps_patch)} шагов, в уроке {len(lesson['steps'])}")
        for step, step_patch in zip(lesson["steps"], steps_patch):
            for key, value in (step_patch or {}).items():
                if key not in ALLOWED:
                    sys.exit(f"{lesson_id}: поле {key} менять нельзя")
                if value:
                    step[key] = value
                    changed += 1

    SRC.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Обновлено полей: {changed}")


if __name__ == "__main__":
    main(sys.argv[1])
