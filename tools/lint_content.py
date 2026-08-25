#!/usr/bin/env python3
"""
Проверка русского слоя: не осталось ли текста про русскую грамматику.

Ищет маркеры прежнего содержания — термины, которые в объяснении
казахской грамматики появиться не могут (спряжения русского глагола,
род существительного, английские названия времён).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

MARKERS = [
    r"\bI+ спряжени", r"\bпервого спряжения", r"\bвторого спряжения",
    r"Present (Simple|Continuous|Perfect)", r"Past (Simple|Continuous)", r"Future Simple",
    r"мужского рода", r"женского рода", r"среднего рода",
    r"\bв русском языке\b.{0,40}(падеж|врем|спряж|род\b)",
    r"-щий/-ащий", r"-ся/-сь\b",
    r"\bпредложный падеж",   # в казахском такого падежа нет
]
PATTERNS = [re.compile(m, re.I) for m in MARKERS]


def scan(label: str, texts):
    hits = []
    for key, text in texts:
        for p in PATTERNS:
            m = p.search(text or "")
            if m:
                hits.append((key, m.group(0), (text or "")[max(0, m.start() - 40):m.start() + 60]))
                break
    print(f"{label}: подозрительных фрагментов {len(hits)}")
    return hits


def main():
    lessons = json.loads((ROOT / "src/data/lessons.source.json").read_text(encoding="utf-8"))
    items = []
    for lesson in lessons["lessons"]:
        for i, s in enumerate(lesson["steps"]):
            for f in ("dialogueRu", "grammarRu", "taskRu", "teacherRu1", "teacherRu2"):
                items.append((f"{lesson['id']}[{i}].{f}", s.get(f, "")))
    hits = scan("Уроки", items)

    rules = json.loads((ROOT / "src/data/rules.json").read_text(encoding="utf-8"))
    hits += scan("Правила", [(f"{r['id']}.ru", r["ru"]) for r in rules])

    ref = json.loads((ROOT / "src/data/reference.json").read_text(encoding="utf-8"))
    # Сопоставительные темы сравнивают казахский с русским — упоминание русской
    # грамматики там и есть содержание, а не остаток прежнего текста.
    hits += scan("Справочник", [
        (f"{t['id']}.bodyRu", t["bodyRu"])
        for t in ref["topics"] if t["categoryRu"] != "Сравнение с русским"
    ])

    if "-v" in sys.argv:
        for key, marker, ctx in hits[:40]:
            print(f"  {key}: «{marker}» … {ctx.strip()[:90]}")
    return len(hits)


if __name__ == "__main__":
    total = main()
    print(f"\nВсего: {total}")
    sys.exit(1 if total else 0)
