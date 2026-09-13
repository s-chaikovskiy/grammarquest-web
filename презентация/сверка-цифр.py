# -*- coding: utf-8 -*-
"""
Сверка чисел презентации с данными проекта.

Каждое число в докладе должно пересчитываться из первоисточника — иначе оно
незаметно устаревает. Так уже случалось не раз: вес приложения, число
автотестов и проверок контраста менялись, а слайд оставался со старым.

Скрипт не правит тексты, а показывает расхождения. Запуск перед защитой:

    ./venv/bin/python сверка-цифр.py

Нужен свежий `npm run build` в корне проекта — вес считается по сборке.
"""
import gzip
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
sys.path.insert(0, str(ROOT / "tools" / "content"))
from тексты import RU, KZ
from сабақтар import ПРАВКИ


def load(name):
    return json.loads((ROOT / "src" / "data" / name).read_text(encoding="utf-8"))


def facts() -> dict[str, str]:
    lessons = load("lessons.json")["lessons"]
    steps = [(l["author"], s) for l in lessons for s in l["steps"]]

    assets = ROOT / "dist" / "assets"
    weight = None
    if assets.exists():
        main = list(assets.glob("index-*.js")) + list(assets.glob("index-*.css"))
        if main:
            weight = str(round(sum(len(gzip.compress(f.read_bytes())) for f in main) / 1024))

    tests = sum(len(re.findall(r"^test\(", f.read_text(encoding="utf-8"), re.M))
                for f in sorted((ROOT / "tools" / "tests").glob("*.test.ts")))
    contrast = subprocess.run([sys.executable, str(ROOT / "tools" / "contrast.py")],
                              capture_output=True, text=True).stdout

    return {
        "автотестов": str(tests),
        "проверок контраста": str(len(re.findall(r"нужно ≥", contrast))),
        "тем": str(len(lessons)),
        "заданий": str(len(steps)),
        "заданий учителя": str(sum(1 for a, _ in steps if a == "учитель")),
        "заданий по её образцу": str(sum(1 for a, _ in steps if a != "учитель")),
        "исправлений в тексте учителя": str(len(ПРАВКИ)),
        "записей озвучки": str(len(load("audio-index.json").get("available", []))),
        "вес в сжатом виде, КБ": weight or "— (нет dist, сделайте npm run build)",
    }


# Где какое число обязано стоять. Ключ — из тексты.py, значение — из facts().
EXPECTED = [
    ("s01_kpi[0]", "тем"),
    ("s01_kpi[1]", "заданий"),
    ("s01_kpi[2]", "записей озвучки"),
    ("s02_cards[1][2][1]", "тем"),
    ("s04_band", "записей озвучки"),
    ("s04_levels[0]", "заданий учителя"),
    ("s04_levels[1]", "заданий по её образцу"),
    ("s04_levels[2]", "исправлений в тексте учителя"),
    ("s05_right[0]", "автотестов"),
    ("s05_right[1]", "проверок контраста"),
    ("s07_kpi[0]", "вес в сжатом виде, КБ"),
]


def read(deck: dict, path: str):
    """s12_rows[1][2] → deck['s12_rows'][1][2]; из строки берётся первое число"""
    name = path.split("[", 1)[0]
    value = deck[name]
    for part in re.findall(r"\[(\d+)\]", path):
        value = value[int(part)]
    if isinstance(value, (list, tuple)):
        return value[0]
    m = re.search(r"\d+", value)
    return m.group() if m else value


def main():
    f = facts()
    print("Числа по данным проекта:")
    for k, v in f.items():
        print(f"  {k:30} {v}")

    print("\nСверка со слайдами:")
    bad = 0
    for deck_name, deck in (("ru", RU), ("kz", KZ)):
        for path, fact in EXPECTED:
            got = str(read(deck, path))
            want = f[fact]
            if got != want:
                bad += 1
                print(f"  ✗ [{deck_name}] {path:20} на слайде «{got}», по данным «{want}» ({fact})")
        # И строка «уже сделано» на последнем слайде: в ней тоже числа.
        done = deck["s08_done"]
        for number, fact in ((f["тем"], "тем"), (f["заданий"], "заданий"),
                             (f["записей озвучки"], "записей озвучки")):
            if number not in re.findall(r"\d+", done):
                bad += 1
                print(f"  ✗ [{deck_name}] s08_done: нет числа {number} ({fact})")
    if bad:
        print(f"\nРасхождений: {bad}. Поправить в тексты.py и пересобрать колоду.")
        sys.exit(1)
    print(f"  ✓ все {(len(EXPECTED) + 3) * 2} чисел сходятся с данными проекта")


if __name__ == "__main__":
    main()
