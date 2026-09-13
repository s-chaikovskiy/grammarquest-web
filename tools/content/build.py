#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Сборка уроков: tools/content/сабақтар.py → src/data/lessons.json.

Заодно выгружает весь текст курса учителю на проверку —
НА-ПРОВЕРКУ-УЧИТЕЛЮ.md, вместе со списком правок к её заданиям.

Сборка падает, а не предупреждает, если урок устроен не так, как в образце
учителя (диалог → правило → задание с выбором), если верный ответ не стоит
среди вариантов, или если список правок разошёлся с уроками. Молчаливое
«собралось» здесь хуже падения: приложение засчитывало бы неверный ответ.

Запуск: python3 tools/content/build.py
"""
import json
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from сабақтар import AISHA, LESSONS, TEACHER, ПРАВКИ  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "src" / "data" / "lessons.json"
REVIEW = ROOT / "НА-ПРОВЕРКУ-УЧИТЕЛЮ.md"

SPEAKERS = {AISHA: "Айша", TEACHER: "Мұғалім"}
KINDS = {"choice", "multi"}
AUTHORS = {"учитель", "ассистент"}
SHEET = {1: "Тәуелдік жалғау", 2: "Жіктік жалғау", 3: "Септік жалғау", 4: "Зат есім",
         5: "Көптік жалғау (листочек читается неуверенно)", 6: "Сын есім", 7: "Сан есім"}


def nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text)


def key(text: str) -> str:
    return " ".join(nfc(text).casefold().split())


errors: list[str] = []


def fail(where: str, message: str) -> None:
    errors.append(f"{where}: {message}")


def lesson_text(lesson: dict) -> str:
    """Весь казахский текст урока одной строкой — по нему проверяются правки."""
    parts = []
    for step in lesson["steps"]:
        parts += [kz for _, kz, _ in step["dialogue"]]
        task = step["task"]
        parts += [step["ruleKz"], task["kz"], task.get("sentence", ""), task.get("result", ""),
                  *task["options"]]
    return key("\n".join(parts))


def check() -> None:
    ids, sheets = set(), set()
    for lesson in LESSONS:
        where = lesson["id"]
        if lesson["id"] in ids:
            fail(where, "id повторяется")
        ids.add(lesson["id"])
        if lesson["sheet"] in sheets:
            fail(where, "на один пункт листочка уже есть тема")
        sheets.add(lesson["sheet"])
        if lesson["sheet"] not in SHEET:
            fail(where, f"пункта {lesson['sheet']} на листочке нет")
        if lesson["author"] not in AUTHORS:
            fail(where, f"автор «{lesson['author']}» — ожидается учитель или ассистент")
        if not lesson["steps"]:
            fail(where, "нет ни одного шага")

        for n, step in enumerate(lesson["steps"], 1):
            w = f"{where}, шаг {n}"
            dialogue = step["dialogue"]
            if not dialogue:
                fail(w, "нет диалога")
            elif dialogue[0][0] != AISHA:
                fail(w, "диалог начинает Айша — так в образце учителя")
            for who, kz, ru in dialogue:
                if who not in SPEAKERS:
                    fail(w, f"неизвестный говорящий «{who}»")
                if not kz.strip() or not ru.strip():
                    fail(w, "пустая реплика или перевод")
            if not step["ruleKz"].strip() or not step["ruleRu"].strip():
                fail(w, "пустое правило")
            if not step.get("source"):
                fail(w, "не указано, с чем сверено правило")

            task = step["task"]
            options, answers = task["options"], task["answers"]
            if task["kind"] not in KINDS:
                fail(w, f"тип задания «{task['kind']}»")
            if len(options) < 2:
                fail(w, "меньше двух вариантов")
            if len({key(o) for o in options}) != len(options):
                fail(w, "варианты повторяются")
            stray = [a for a in answers if a not in options]
            if stray:
                fail(w, f"верный ответ не стоит среди вариантов: {stray}")
            if task["kind"] == "choice" and len(answers) != 1:
                fail(w, "в задании на один ответ верный вариант должен быть ровно один")
            if task["kind"] == "multi" and not 1 <= len(answers) < len(options):
                fail(w, "в задании на несколько ответов неверные варианты тоже нужны")
            if "sentence" in task and task["sentence"].count("...") != 1:
                fail(w, "в предложении должен быть ровно один пропуск «...»")
            if not task["kz"].strip() or not task["ru"].strip():
                fail(w, "пустая формулировка задания")

    by_id = {lesson["id"]: lesson for lesson in LESSONS}
    for fix in ПРАВКИ:
        w = f"правка «{fix['где']}»"
        lesson = by_id.get(fix["урок"])
        if not lesson:
            fail(w, f"урока {fix['урок']} нет")
            continue
        if lesson["author"] != "учитель":
            fail(w, "правки ведутся только к текстам учителя")
        text = lesson_text(lesson)
        for frag in fix["нет"]:
            if key(frag) in text:
                fail(w, f"старый текст всё ещё стоит в уроке: «{frag}»")
        for frag in fix["есть"]:
            if key(frag) not in text:
                fail(w, f"исправления в уроке нет: «{frag}»")
        if not fix["нет"] or not fix["есть"] or not fix["источник"].strip():
            fail(w, "у правки должны быть «нет», «есть» и источник")


def export() -> dict:
    lessons = sorted(LESSONS, key=lambda l: l["sheet"])
    return {
        "version": 4,
        "lessons": [
            {
                "id": l["id"],
                "sheet": l["sheet"],
                "titleKz": nfc(l["titleKz"]),
                "titleRu": nfc(l["titleRu"]),
                "author": l["author"],
                "steps": [
                    {
                        "dialogue": [{"who": who, "kz": nfc(kz), "ru": nfc(ru)}
                                     for who, kz, ru in s["dialogue"]],
                        "ruleKz": nfc(s["ruleKz"]),
                        "ruleRu": nfc(s["ruleRu"]),
                        "task": {k: (nfc(v) if isinstance(v, str) else [nfc(x) for x in v])
                                 for k, v in s["task"].items()},
                    }
                    for s in l["steps"]
                ],
            }
            for l in lessons
        ],
    }


def write_review(data: dict) -> None:
    lines = [
        "# Тексты приложения — на проверку учителю",
        "",
        "Собирается из `tools/content/сабақтар.py` командой `npm run data`.",
        "Править здесь бесполезно: файл перезаписывается.",
        "",
        "Задания из документа учителя перенесены дословно. Всё, что в них изменено,",
        "перечислено ниже с источником, — сборка проверяет, что каждая правка",
        "действительно стоит в уроке. Темы с листочка, которых нет в документе,",
        "написаны по её образцу и сверены с учебником «Бәйшешек»: их надо",
        "проверить целиком.",
        "",
        "## Правки к заданиям учителя",
        "",
        "| Где | Было | Стало | Почему | Источник |",
        "|---|---|---|---|---|",
    ]
    lines += [f"| {p['где']} | {p['было']} | {p['стало']} | {p['почему']} | {p['источник']} |"
              for p in ПРАВКИ]
    lines += ["", "## Уроки", ""]
    sources = {l["id"]: [s["source"] for s in l["steps"]] for l in LESSONS}
    for lesson in data["lessons"]:
        who = "текст учителя" if lesson["author"] == "учитель" else "написано ассистентом — проверить"
        lines += [f"### {lesson['sheet']}. {lesson['titleKz']} — {lesson['titleRu']}", "", f"_{who}_", ""]
        for n, step in enumerate(lesson["steps"], 1):
            task = step["task"]
            lines += [f"**{n}-қадам**", ""]
            lines += [f"- {SPEAKERS[d['who']]}: {d['kz']}" for d in step["dialogue"]]
            lines += [f"- Ереже: {step['ruleKz']}", f"- Тапсырма: {task['kz']}"]
            if task.get("sentence"):
                lines.append(f"  {task['sentence']}")
            marked = ", ".join(f"**{o}**" if o in task["answers"] else o for o in task["options"])
            lines.append(f"  Нұсқалар: {marked}")
            if task.get("result"):
                lines.append(f"  Нәтиже: {task['result']}")
            lines += [f"- Сверено: {sources[lesson['id']][n - 1]}", ""]
    missing = [f"{n}. {title}" for n, title in SHEET.items()
               if n not in {l["sheet"] for l in data["lessons"]}]
    if missing:
        lines += ["## Темы с листочка, которых ещё нет", ""] + [f"- {m}" for m in missing] + [""]
    REVIEW.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    check()
    if errors:
        print("✗ Уроки не собраны:")
        for e in errors:
            print("   ", e)
        sys.exit(1)
    data = export()
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    write_review(data)
    steps = sum(len(l["steps"]) for l in data["lessons"])
    print(f"✓ Тем: {len(data['lessons'])}, заданий: {steps}, правок к тексту учителя: {len(ПРАВКИ)}")
    for l in data["lessons"]:
        print(f"   {l['sheet']}. {l['titleKz']:18} {len(l['steps'])} задания · {l['author']}")
    have = {l["sheet"] for l in data["lessons"]}
    for n, title in SHEET.items():
        if n not in have:
            print(f"   {n}. {title:18} — ещё нет")
    print(f"На проверку учителю: {REVIEW.name}")


if __name__ == "__main__":
    main()
