# -*- coding: utf-8 -*-
"""
Сверка чисел презентации с данными проекта.

Каждое число в докладе должно пересчитываться из первоисточника — иначе оно
незаметно устаревает. Так уже случилось: после правок кода вес приложения
изменился, а слайд остался со старым числом.

Скрипт не правит тексты, а показывает расхождения. Запуск перед защитой:

    ./venv/bin/python сверка-цифр.py

Нужен свежий `npm run build` в корне проекта — вес считается по сборке.
"""
import gzip
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from тексты import RU, KZ

KZ_LETTERS = set("әғқңөұүһі")


def load(name):
    return json.loads((ROOT / "src" / "data" / name).read_text(encoding="utf-8"))


def facts() -> dict[str, str]:
    lessons = load("lessons.json")["lessons"]
    steps = [s for l in lessons for s in l["steps"]]
    special = sum(1 for s in steps if KZ_LETTERS & set(s["answerKz"].lower()))
    manifest = json.loads((ROOT / "tools" / "tts" / "audio-manifest.json").read_text(encoding="utf-8"))["items"]

    assets = ROOT / "dist" / "assets"
    weight = None
    if assets.exists():
        main = list(assets.glob("index-*.js")) + list(assets.glob("index-*.css"))
        if main:
            weight = str(round(sum(len(gzip.compress(f.read_bytes())) for f in main) / 1024))

    return {
        "уроков": str(len(lessons)),
        "заданий": str(len(steps)),
        "слов в словаре": str(len(load("vocabulary.json")["words"])),
        "правил": str(len(load("rules.json"))),
        "тем": str(len(load("reference.json")["topics"])),
        "типов заданий": str(len({s.get("taskType") for s in steps})),
        "ответов с особыми буквами": str(special),
        "доля таких ответов": f"{round(special / len(steps) * 100)}%",
        "уроков на уровне 1": str(len([l for l in lessons if l.get("level") == 1])),
        "уроков на уровне 2": str(len([l for l in lessons if l.get("level") == 2])),
        "уроков на уровне 3": str(len([l for l in lessons if l.get("level") == 3])),
        "фраз озвучки": str(len(manifest)),
        "символов озвучки": str(sum(len(e["text"]) for e in manifest)),
        "вес в сжатом виде, КБ": weight or "— (нет dist, сделайте npm run build)",
    }


# Где какое число обязано стоять. Ключ — из тексты.py, значение — из facts().
EXPECTED = [
    ("s01_kpi[0]", "уроков"),
    ("s01_kpi[1]", "заданий"),
    ("s01_kpi[2]", "типов заданий"),
    ("s04_levels[0]", "уроков на уровне 1"),
    ("s04_levels[1]", "уроков на уровне 2"),
    ("s04_levels[2]", "уроков на уровне 3"),
    ("s07_kpi[0]", "вес в сжатом виде, КБ"),
]


def read(deck: dict, path: str):
    """s12_rows[1][2] → deck['s12_rows'][1][2]"""
    name = path.split("[", 1)[0]
    value = deck[name]
    for part in re.findall(r"\[(\d+)\]", path):
        value = value[int(part)]
    return value[0] if isinstance(value, (list, tuple)) else value


def main():
    f = facts()
    print("Числа по данным проекта:")
    for k, v in f.items():
        print(f"  {k:28} {v}")

    print("\nСверка со слайдами:")
    bad = 0
    for deck_name, deck in (("ru", RU), ("kz", KZ)):
        for path, fact in EXPECTED:
            got = str(read(deck, path))
            want = f[fact]
            ok = got == want
            if not ok:
                bad += 1
                print(f"  ✗ [{deck_name}] {path:18} на слайде «{got}», по данным «{want}» ({fact})")
    if bad:
        print(f"\nРасхождений: {bad}. Поправить в тексты.py и пересобрать колоду.")
        sys.exit(1)
    print(f"  ✓ все {len(EXPECTED) * 2} чисел сходятся с данными проекта")


if __name__ == "__main__":
    main()
