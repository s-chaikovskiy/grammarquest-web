#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Сборка единого источника уроков.

Объединяет два набора:
  1. Исходные 18 уроков (lessons.source.json) — грамматика уровня 8–11 класса
  2. Базовый курс из beginner.py — 8 тематических уроков для 5–7 классов

Каждому уроку проставляется уровень, учебный блок и подсказка класса.
Уроки базового курса помечаются needsReview и выгружаются отдельным
файлом НА-ПРОВЕРКУ-УЧИТЕЛЮ.md — их писал ассистент, а не носитель языка.

Запуск: python3 tools/content/build.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from beginner import LESSONS as BEGINNER, DISTRACTORS   # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
ORIGINAL = ROOT / "src" / "data" / "lessons.source.json"
MERGED = ROOT / "src" / "data" / "lessons.merged.json"
REVIEW = ROOT / "НА-ПРОВЕРКУ-УЧИТЕЛЮ.md"

# Уровни. Название для ученика + подсказка класса.
LEVELS = {
    1: {"titleRu": "Начало", "titleKz": "Бастау", "grades": "5–7 класс",
        "aboutRu": "Первые слова, счёт, семья, школа. Грамматика вводится небольшими порциями."},
    2: {"titleRu": "Уверенный", "titleKz": "Сенімді", "grades": "7–9 класс",
        "aboutRu": "Падежи и времена глагола — основа, на которой держится вся казахская грамматика."},
    3: {"titleRu": "Свободный", "titleKz": "Еркін", "grades": "9–11 класс",
        "aboutRu": "Наклонения, залоги, сложные предложения и словообразование."},
}

# Раскладка исходных 18 уроков. Ключ — начало titleRu, значение — (уровень, блок, классы).
# Порядок внутри уровня определяется этим списком.
PLACEMENT = [
    # --- Уровень 1: то, что можно дать сразу после базовой лексики ---
    ("Число существительного",          1, "Основы грамматики", "5–7"),
    ("Местоимения:",                    1, "Основы грамматики", "5–7"),
    ("Притяжательные местоимения",      1, "Основы грамматики", "6–7"),
    ("Согласование прилагательного",    1, "Основы грамматики", "6–7"),
    # --- Уровень 2: ядро школьной программы ---
    ("Падежи существительного",         2, "Септіктер — падежи", "7–8"),
    ("Настоящее время",                 2, "Времена глагола", "7–8"),
    ("Прошедшее время",                 2, "Времена глагола", "7–9"),
    ("Будущее время",                   2, "Времена глагола", "8–9"),
    ("Числительное и существительное",  2, "Числа и признаки", "7–8"),
    ("Числительные:",                   2, "Числа и признаки", "8–9"),
    ("Повелительное наклонение",        2, "Наклонения", "8–9"),
    # --- Уровень 3: старшие классы ---
    ("Степени сравнения",               3, "Числа и признаки", "9–10"),
    ("Условное наклонение",             3, "Наклонения", "9–10"),
    ("Страдательный залог",             3, "Залоги и виды", "10–11"),
    ("Вид глагола",                     3, "Залоги и виды", "10–11"),
    ("Возвратное местоимение",          3, "Залоги и виды", "10–11"),
    ("Сложные предложения",             3, "Сложная речь", "10–11"),
    ("Словообразование",                3, "Сложная речь", "10–11"),
]

FIELDS = ("dialogueKz", "dialogueRu", "grammarKz", "grammarRu",
          "taskKz", "taskRu", "answerKz", "answerRu",
          "teacherKz1", "teacherRu1", "teacherKz2", "teacherRu2")


def beginner_lessons() -> list[dict]:
    out = []
    for lesson in BEGINNER:
        steps = []
        for step in lesson["steps"]:
            data = dict(zip(FIELDS, step))
            # Подсказка генератору: для этих ответов варианты подобраны вручную.
            hand = DISTRACTORS.get(data["answerKz"].strip())
            if hand:
                data["distractors"] = hand
            steps.append(data)
        out.append({
            "id": lesson["id"],
            "titleKz": lesson["titleKz"],
            "titleRu": lesson["titleRu"],
            "character": lesson["character"],
            "level": lesson["level"],
            "unit": lesson["unit"],
            "grades": lesson["grades"],
            "needsReview": True,     # написано ассистентом, нужна сверка с учителем
            "tags": ["kz", "base"],
            "steps": steps,
        })
    return out


def place_original(lessons: list[dict]) -> list[dict]:
    """Проставляет уровень и блок исходным урокам по таблице PLACEMENT."""
    placed, unplaced = [], []
    for lesson in lessons:
        for prefix, level, unit, grades in PLACEMENT:
            if lesson["titleRu"].startswith(prefix):
                lesson["level"] = level
                lesson["unit"] = unit
                lesson["grades"] = grades
                lesson["needsReview"] = False
                placed.append((PLACEMENT.index((prefix, level, unit, grades)), lesson))
                break
        else:
            unplaced.append(lesson["titleRu"])
    if unplaced:
        print("✗ Уроки без уровня:")
        for t in unplaced:
            print("   ", t)
        sys.exit(1)
    return [lesson for _, lesson in sorted(placed, key=lambda p: p[0])]


def write_review(lessons: list[dict]):
    """Выгружает весь новый контент для проверки живым учителем."""
    new = [l for l in lessons if l.get("needsReview")]
    steps_total = sum(len(l["steps"]) for l in new)

    lines = [
        "# Новый контент — на проверку учителю казахского языка",
        "",
        f"**Уроков:** {len(new)} · **шагов:** {steps_total}",
        "",
        "Эти уроки написаны ассистентом для 5–7 классов, потому что исходный курс",
        "начинался сразу с грамматики уровня 8–11 класса. Ассистент не носитель языка,",
        "поэтому каждую фразу нужно проверить: правильность формы, естественность",
        "звучания и соответствие школьной программе.",
        "",
        "Как править: находите нужный урок в `tools/content/beginner.py`, меняете текст,",
        "затем выполняете `npm run data`. Файлы в `src/data/` перезаписываются, править их",
        "напрямую бесполезно.",
        "",
        "---",
        "",
    ]
    for lesson in new:
        lines += [f"## {lesson['titleRu']} — {lesson['titleKz']}",
                  "",
                  f"Уровень {lesson['level']} · блок «{lesson['unit']}» · {lesson['grades']} класс · `{lesson['id']}`",
                  ""]
        for i, s in enumerate(lesson["steps"], 1):
            lines += [
                f"**Шаг {i}**",
                "",
                f"- Диалог: {s['dialogueKz']}",
                f"  — {s['dialogueRu']}",
                f"- Правило: {s['grammarKz']}",
                f"  — {s['grammarRu']}",
                f"- Задание: {s['taskKz']}",
                f"  — {s['taskRu']}",
                f"- **Ответ: {s['answerKz']}** — {s['answerRu']}",
                f"- Совет: {s['teacherKz1']}",
                f"- Разбор: {s['teacherKz2']}",
                "",
            ]
        lines.append("---")
        lines.append("")
    REVIEW.write_text("\n".join(lines), encoding="utf-8")


def main():
    original = json.loads(ORIGINAL.read_text(encoding="utf-8"))["lessons"]
    lessons = place_original(original) + []
    base = beginner_lessons()

    # Базовый курс идёт первым: он и есть вход в предмет.
    ordered = base + lessons
    ordered.sort(key=lambda l: (l["level"],))

    data = {"version": 3, "levels": LEVELS, "lessons": ordered}
    MERGED.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    write_review(ordered)

    by_level = {}
    for l in ordered:
        by_level.setdefault(l["level"], []).append(l)
    print(f"Собрано уроков: {len(ordered)}, шагов: {sum(len(l['steps']) for l in ordered)}")
    for lvl in sorted(by_level):
        ls = by_level[lvl]
        info = LEVELS[lvl]
        print(f"\n  Уровень {lvl} «{info['titleRu']}» ({info['grades']}) — "
              f"{len(ls)} уроков, {sum(len(x['steps']) for x in ls)} шагов")
        for l in ls:
            mark = " ★новый" if l.get("needsReview") else ""
            print(f"     {l['unit']:22} {l['titleRu'][:44]:44}{mark}")
    print(f"\nСписок на проверку учителю: {REVIEW.name}")


if __name__ == "__main__":
    main()
