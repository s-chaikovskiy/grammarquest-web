#!/usr/bin/env python3
"""
Применяет исправления ошибок казахского содержания из tools/corrections.json.

Отдельный скрипт, а не правка файла руками: изменение правильного ответа —
это вмешательство в учебный материал, и оно должно быть видимым, обоснованным
и воспроизводимым. Скрипт проверяет, что исходное значение совпадает с
записанным «было», иначе останавливается.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "lessons.source.json"


def apply_replacements(data, fixes):
    """
    Массовые замены термина внутри урока.

    Отдельный вид правки: когда ошибочный термин повторяется во всех шагах,
    перечислять каждое вхождение бессмысленно. Замена применяется ко всем
    текстовым полям урока и к его заголовкам.
    """
    lessons = {l["id"]: l for l in data["lessons"]}
    applied = 0
    for fix in fixes:
        lesson = lessons[fix["урок"]]
        targets = [lesson] + lesson["steps"]
        for pair in fix["замены"]:
            was, now = pair["было"], pair["стало"]
            for obj in targets:
                for key, value in obj.items():
                    if isinstance(value, str) and was in value:
                        obj[key] = value.replace(was, now)
                        applied += 1
        print(f"  {fix['урок']}: {fix['почему'][:110]}")
    return applied


def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    fixes = json.loads((ROOT / "tools" / "corrections.json").read_text(encoding="utf-8"))["исправления"]
    lessons = {l["id"]: l for l in data["lessons"]}

    applied = skipped = 0
    for fix in fixes:
        step = lessons[fix["урок"]]["steps"][fix["шаг"]]
        current = step[fix["поле"]]
        if current == fix["стало"]:
            skipped += 1
            continue
        if current != fix["было"]:
            sys.exit(f"{fix['урок']}[{fix['шаг']}].{fix['поле']}: ожидалось «{fix['было']}», "
                     f"в файле «{current}» — исправление не применено")
        step[fix["поле"]] = fix["стало"]
        applied += 1
        print(f"  {fix['урок']}[{fix['шаг']}].{fix['поле']}: «{fix['было']}» → «{fix['стало']}»")

    doc = json.loads((ROOT / "tools" / "corrections.json").read_text(encoding="utf-8"))
    replaced = apply_replacements(data, doc.get("термины", []))

    SRC.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nПрименено точечных: {applied}, уже было: {skipped}, замен термина: {replaced}")


if __name__ == "__main__":
    main()
