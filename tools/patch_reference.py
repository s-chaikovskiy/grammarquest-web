#!/usr/bin/env python3
"""
Замена русской части справочника (reference.json).

Русские тексты справочника описывали грамматику русского языка, а семь тем
были целиком посвящены ей. Первые переписаны как объяснение казахского
правила по-русски, вторые превращены в сопоставительные темы «чем казахский
отличается от русского» — для изучающего это как раз самое полезное место.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "src" / "data" / "reference.json"
ALLOWED = {"titleRu", "bodyRu", "examplesRu", "mistakesRu",
           "titleKz", "bodyKz", "categoryRu", "categoryKz"}


def main(patch_path: str):
    data = json.loads(REF.read_text(encoding="utf-8"))
    patch = json.loads(Path(patch_path).read_text(encoding="utf-8"))
    by_id = {t["id"]: t for t in data["topics"]}

    changed = 0
    for topic_id, fields in patch.items():
        if topic_id.startswith("_"):
            continue
        topic = by_id.get(topic_id)
        if topic is None:
            sys.exit(f"Тема {topic_id} не найдена")
        for key, value in fields.items():
            if key not in ALLOWED:
                sys.exit(f"{topic_id}: поле {key} менять нельзя")
            topic[key] = value
            changed += 1

    REF.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Обновлено полей в справочнике: {changed}")


if __name__ == "__main__":
    main(sys.argv[1])
