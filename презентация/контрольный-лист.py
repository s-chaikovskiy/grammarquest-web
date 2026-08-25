# -*- coding: utf-8 -*-
"""
Контрольный лист: все слайды колоды на одной картинке.

Нужен, чтобы одним взглядом увидеть, не вылез ли где текст и не разъехалась ли
вёрстка. Открывать PDF постранично для этого слишком долго.

    ./venv/bin/python контрольный-лист.py Тілашар-защита.pdf
"""
import sys
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

COLS = 3
SCALE = 1.1          # ~ 1050 px по ширине слайда
PAD = 10
BG = (232, 234, 238)


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "Тілашар-защита.pdf")
    doc = pdfium.PdfDocument(str(src))
    pages = [doc[i].render(scale=SCALE).to_pil() for i in range(len(doc))]

    w, h = pages[0].size
    rows = (len(pages) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * w + PAD * (COLS + 1), rows * h + PAD * (rows + 1)), BG)
    for i, p in enumerate(pages):
        c, r = i % COLS, i // COLS
        sheet.paste(p, (PAD + c * (w + PAD), PAD + r * (h + PAD)))

    out = src.with_name(f"все-слайды-{src.stem.split('-')[-1]}.png")
    sheet.save(out, optimize=True)
    print(f"{out.name}: {len(pages)} слайдов, {sheet.size[0]}×{sheet.size[1]}, "
          f"{out.stat().st_size / 1024:.0f} КБ")


if __name__ == "__main__":
    main()
