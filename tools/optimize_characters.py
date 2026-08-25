#!/usr/bin/env python3
"""
Подготовка изображений персонажей.

Исходники — 1024×1024 PNG по ~1,6 МБ (всего около 11 МБ), а на экране они
занимают 44–96 px. Для офлайн-приложения и APK это неоправданно много.
Плюс вокруг фигур запечена полупрозрачная серая дымка (альфа 30–60),
из-за которой персонаж выглядел вставленным в грязный прямоугольник.

Скрипт: гасит дымку, обрезает по фигуре, уменьшает и сохраняет WebP.
Запуск: python3 tools/optimize_characters.py
"""
import pathlib
from PIL import Image

SRC = pathlib.Path("public/characters")
OUT = pathlib.Path("public/characters")
SIZE = 320

HAZE_CUT = 90     # ниже — считаем дымкой и убираем полностью
SOLID_FROM = 150  # выше — оставляем как есть; между ними плавный переход


def clean_alpha(value: int) -> int:
    if value <= HAZE_CUT:
        return 0
    if value >= SOLID_FROM:
        return value
    return round((value - HAZE_CUT) / (SOLID_FROM - HAZE_CUT) * SOLID_FROM)


def process(path: pathlib.Path) -> tuple[int, int]:
    im = Image.open(path).convert("RGBA")
    before = path.stat().st_size

    alpha = im.getchannel("A").point(clean_alpha)
    im.putalpha(alpha)

    box = im.getbbox()          # обрезаем пустые поля после чистки
    if box:
        im = im.crop(box)

    im.thumbnail((SIZE, SIZE), Image.LANCZOS)

    dst = OUT / f"{path.stem}.webp"
    im.save(dst, "WEBP", quality=88, method=6)
    return before, dst.stat().st_size


if __name__ == "__main__":
    total_before = total_after = 0
    for path in sorted(SRC.glob("*.png")):
        if path.stem == "app_icon":
            continue        # иконка приложения нужна в PNG и в полном размере
        before, after = process(path)
        total_before += before
        total_after += after
        print(f"  {path.stem:22} {before/1024:7.0f} КБ → {after/1024:6.1f} КБ")
    print(f"\nИтого: {total_before/1024/1024:.1f} МБ → {total_after/1024:.0f} КБ "
          f"(в {total_before/max(total_after,1):.0f} раз меньше)")
