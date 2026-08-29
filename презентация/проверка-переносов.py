# -*- coding: utf-8 -*-
"""
Поиск строк, которые после переноса начинаются с тире.

В карточках и списках маркер пункта — тоже тире. Если внутри текста есть
тире и перенос попадает прямо перед ним, строка начинается с «—» и читается
как ещё один пункт. На слайде 06 так и вышло: «Подставь любое своё слово /
— увидишь все его формы» выглядело тремя пунктами вместо двух.

    ./venv/bin/python проверка-переносов.py
"""
import sys

sys.path.insert(0, ".")
from deckkit import CW, MONO_MD, TEXT, text_w, wrap
from тексты import TEXTS

DASHES = ("—", "–", "-")


def check(text: str, width: float, size: float, where: str) -> list[str]:
    ind = text_w("—", MONO_MD, size, 0) + 0.14
    lines = wrap(text, TEXT, size, width - ind)
    return [f"{where}: строка {i + 1} начинается с тире → «{ln[:52]}»"
            for i, ln in enumerate(lines)
            if i > 0 and ln.lstrip().startswith(DASHES)]


def main():
    bad = []
    for code, T in TEXTS.items():
        # карточки: 4 в ряд, внутренняя ширина = ширина карточки минус поля
        for key, item_size in (("s02_cards", 10), ("s06_cards", 10)):
            cw = (CW - 0.22 * 3) / 4
            for tag, head, items in T[key]:
                for it in items:
                    bad += check(it, cw - 0.28 * 2, item_size, f"[{code}] {key} «{head[:22]}»")
        # правая колонка списков на слайдах 05 и 08
        for key, size in (("s05_right", 11), ("s08_next", 11)):
            rw = (CW - 0.22 * 11) / 12 * 5 + 0.22 * 4
            for it in T[key]:
                bad += check(it, rw - 0.60, size, f"[{code}] {key}")

    if bad:
        print("Переносы, ломающие список:")
        for b in bad:
            print("  ✗", b)
        sys.exit(1)
    print("  ✓ ни одна строка списков не начинается с тире")


if __name__ == "__main__":
    main()
