#!/usr/bin/env python3
"""
Иконка и заставка приложения.

Прежняя иконка была типовой картинкой «языкового приложения»: два флага,
книга, карандаш, блёстки и рамка внутри рамки. На домашнем экране телефона
иконка занимает около 48 px — там всё это сливается в пятно.

Новая иконка построена на смысле продукта: буква «қ». Её нет на русской
раскладке, и именно с такими буквами связана главная сложность ученика.
Она читается на любом размере и сразу говорит, о каком языке речь.

Шрифт берётся из того же файла, что и в приложении, — начертание одно.
Запуск: python3 tools/make_icon.py
"""
import pathlib
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT_WOFF2 = ROOT / "public" / "fonts" / "golos-cyrillic-ext.woff2"  # «қ» = U+049B лежит именно здесь
OUT = ROOT / "resources"
TMP_TTF = OUT / ".golos.ttf"

SIZE = 1024
ACCENT = (0, 100, 185)      # --accent светлой темы, oklch(0.5 0.16 250)
INK_DARK = (17, 22, 30)     # --bg тёмной темы
WHITE = (255, 255, 255)


def to_ttf() -> pathlib.Path:
    """woff2 → ttf: Pillow не читает woff2 напрямую."""
    font = TTFont(str(FONT_WOFF2))
    OUT.mkdir(exist_ok=True)
    font.flavor = None
    font.save(str(TMP_TTF))
    return TMP_TTF


def rounded_square(size: int, radius_ratio: float, color) -> Image.Image:
    """Подложка со скруглением, как у иконок Android и iOS."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, size - 1, size - 1],
                           radius=int(size * radius_ratio), fill=color)
    return img


def draw_letter(img: Image.Image, ttf: pathlib.Path, letter: str, color, scale: float):
    draw = ImageDraw.Draw(img)
    size = img.size[0]
    font = ImageFont.truetype(str(ttf), int(size * scale))
    try:
        font.set_variation_by_axes([700])      # начертание Bold у вариативного шрифта
    except Exception:
        pass
    box = draw.textbbox((0, 0), letter, font=font)
    x = (size - (box[2] - box[0])) // 2 - box[0]
    y = (size - (box[3] - box[1])) // 2 - box[1]
    draw.text((x, y), letter, font=font, fill=color)


def main():
    ttf = to_ttf()

    # Иконка: белая «қ» на акцентном фоне.
    icon = rounded_square(SIZE, 0.22, ACCENT)
    draw_letter(icon, ttf, "қ", WHITE, 0.62)
    icon.save(OUT / "icon.png")

    # Foreground адаптивной иконки Android: буква мельче, поля под обрезку системой.
    fg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_letter(fg, ttf, "қ", WHITE, 0.40)
    fg.save(OUT / "icon-foreground.png")
    rounded_square(SIZE, 0.5, ACCENT).resize((SIZE, SIZE)).save(OUT / "icon-background.png")
    Image.new("RGBA", (SIZE, SIZE), ACCENT).save(OUT / "icon-background.png")

    # Заставка: та же буква по центру тёмного фона.
    for name, bg, fg_color in (("splash.png", WHITE, ACCENT),
                               ("splash-dark.png", INK_DARK, WHITE)):
        splash = Image.new("RGBA", (2732, 2732), bg)
        draw_letter(splash, ttf, "қ", fg_color, 0.22)
        splash.save(OUT / name)

    TMP_TTF.unlink(missing_ok=True)
    for f in sorted(OUT.glob("*.png")):
        print(f"  {f.name:24} {f.stat().st_size/1024:6.0f} КБ")


if __name__ == "__main__":
    main()
