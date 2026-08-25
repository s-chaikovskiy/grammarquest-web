#!/usr/bin/env python3
"""
Замена русской части правил (rules.json).

Русские тексты правил описывали грамматику русского языка: спряжения,
род существительных, «Present Continuous». Для тренажёра казахского это
не просто бесполезно — это сбивает ученика. Скрипт заменяет titleRu, ru и
examplesRu на объяснение казахского правила по-русски, а заодно применяет
исправления казахских терминов.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES = ROOT / "src" / "data" / "rules.json"


def main(patch_path: str):
    rules = json.loads(RULES.read_text(encoding="utf-8"))
    patch = json.loads(Path(patch_path).read_text(encoding="utf-8"))
    by_id = {r["id"]: r for r in rules}

    changed = 0
    for rule_id, fields in patch.items():
        if rule_id.startswith("_"):
            continue
        rule = by_id.get(rule_id)
        if rule is None:
            sys.exit(f"Правило {rule_id} не найдено")
        for key, value in fields.items():
            if key not in {"titleRu", "ru", "examplesRu", "titleKz", "kz", "examplesKz"}:
                sys.exit(f"{rule_id}: поле {key} менять нельзя")
            rule[key] = value
            changed += 1

    RULES.write_text(json.dumps(rules, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Обновлено полей в правилах: {changed}")


if __name__ == "__main__":
    main(sys.argv[1])
