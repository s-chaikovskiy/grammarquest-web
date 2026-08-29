# -*- coding: utf-8 -*-
"""
«Тілашар» — защита научного проекта. Сборка колоды.

Восемь слайдов по четырём вопросам: что создано, для чего, как и что здесь
особенного. Доклад на пять-семь минут.

Особенности сведены в один слайд намеренно. В прежней версии их было три,
и весь доклад начинал звучать как рассказ про казахские буквы, а не про
приложение. Прежние версии — в архив/.

Вёрстка одна, языков два. Тексты — в тексты.py: так казахская версия
остаётся переводом строк, а не второй колодой.

    ./venv/bin/python build.py ru      русская версия (по умолчанию)
    ./venv/bin/python build.py kz      казахская
    ./venv/bin/python build.py оба     обе сразу

После сборки:
    soffice --headless --convert-to pdf *.pptx
"""
import sys

from deckkit import *
from тексты import TEXTS, SITE

TOTAL = 8


def build(lang: str):
    T = TEXTS[lang]
    d = Deck()
    d.total = TOTAL
    N = [0]

    def sl(eyebrow, dark=False):
        N[0] += 1
        s = d.add(dark=dark)
        y = chrome(s, d, eyebrow, N[0], dark=dark)
        return s, y

    def notes(slide, text):
        """Заметки докладчика: видны выступающему, но не залу."""
        slide.notes_slide.notes_text_frame.text = text.strip()

    # ═════════════════════════════════════════════════ 01 · титул
    N[0] += 1
    s = d.add()
    title_slide(s, T["year"], T["s01_l1"], T["s01_l2"], T["s01_sub"],
                T["s01_kpi"], T["author_line"])
    notes(s, T["s01_notes"])

    # ═════════════════════════════════════════════════ 02 · что создано
    s, y = sl(T["s02_eyebrow"])
    y = title(s, T["s02_title"], y, max_lines=2, start=38)
    y = lede(s, T["s02_lede"], y + 0.16, w=CW * 0.86)
    yy = y + 0.46
    cards = T["s02_cards"]
    gap = 0.22
    cw = (CW - gap * 3) / 4
    h = row_h(cw, [(t, hd, it) for t, hd, it in cards], head_size=15, item_size=10)
    tones = [SIGNAL, PETROL, OCHRE, SIGNAL]
    for i, (tag, head, items) in enumerate(cards):
        card(s, ML + i * (cw + gap), yy, cw, h, tag, head, items,
             head_size=15, item_size=10, accent=tones[i], tag_color=tones[i])
    band(s, yy + h + 0.42, [(T["s02_band"], TEXT_SB, WHITE)], size=12.5)
    notes(s, T["s02_notes"])

    # ═════════════════════════════════════════════════ 03 · для чего
    s, y = sl(T["s03_eyebrow"])
    y = title(s, T["s03_title"], y, max_lines=2, start=38)
    y = lede(s, T["s03_lede"], y + 0.16, w=CW * 0.88)
    yy = y + 0.48
    hline(s, ML, yy - 0.22, CW)
    lx, lw = col(0, 6)
    rx, rw = col(6, 6)
    b1 = block(s, wrap(T["s03_left"], TEXT_SB, 13, lw - 0.56), lx + 0.28, yy + 0.30,
               lw - 0.56, TEXT_SB, 13, INK, leading=19)
    panel_behind(s, lx, yy, lw, bottom=b1, pad=0.30, accent=SIGNAL)
    b2 = block(s, wrap(T["s03_right"], TEXT, 12.5, rw - 0.56), rx + 0.28, yy + 0.30,
               rw - 0.56, TEXT, 12.5, SOFT, leading=18)
    panel_behind(s, rx, yy, rw, bottom=b2, pad=0.30)
    footnote(s, T["s03_note"])
    notes(s, T["s03_notes"])

    # ═════════════════════════════════════════════════ 04 · как создано
    s, y = sl(T["s04_eyebrow"], dark=True)
    y = title(s, T["s04_title"], y, dark=True, max_lines=1, start=40)
    y = lede(s, T["s04_lede"], y + 0.16, dark=True, w=CW * 0.86)
    yy = y + 0.50
    lx, lw = col(0, 7)
    rx, rw = col(7, 5)
    b = block(s, [T["s04_left_tag"]], lx + 0.30, yy + 0.30, lw - 0.60, MONO_SB, 8.5,
              SIGNAL_L, leading=11, tracking=0.16, caps=True)
    b = bullets(s, T["s04_left"], lx + 0.30, b + 0.20, lw - 0.60, dark=True, size=11.5, gap=0.16)
    panel_behind(s, lx, yy, lw, bottom=b, pad=0.30, dark=True, accent=SIGNAL)
    b2 = block(s, [T["s04_right_tag"]], rx + 0.30, yy + 0.30, rw - 0.60, MONO_SB, 8.5,
               PETROL_L, leading=11, tracking=0.16, caps=True)
    b2 = bullets(s, T["s04_right"], rx + 0.30, b2 + 0.20, rw - 0.60, dark=True, size=11,
                 gap=0.14, mcolor=PETROL_L)
    panel_behind(s, rx, yy, rw, bottom=b2, pad=0.30, dark=True, accent=PETROL)
    band(s, max(b, b2) + 0.46, [(T["s04_band"], TEXT_SB, WHITE)], dark=True, size=12.5)
    notes(s, T["s04_notes"])

    # ═════════════════════════════════════════════════ 05 · что особенного
    s, y = sl(T["s05_eyebrow"], dark=True)
    y = title(s, T["s05_title"], y, dark=True, max_lines=1, start=42)
    y = lede(s, T["s05_lede"], y + 0.18, dark=True, w=CW * 0.82)
    yy = y + 0.52
    cards = T["s05_cards"]
    gap = 0.22
    cw = (CW - gap * 3) / 4
    h = row_h(cw, [(t, hd, it) for t, hd, it in cards], head_size=15, item_size=10)
    for i, (tag, head, items) in enumerate(cards):
        card(s, ML + i * (cw + gap), yy, cw, h, tag, head, items, dark=True,
             head_size=15, item_size=10, accent=SIGNAL, tag_color=SIGNAL_L)
    band(s, yy + h + 0.44, [(T["s05_band"], TEXT_SB, WHITE)], dark=True, size=12.5)
    notes(s, T["s05_notes"])

    # ═════════════════════════════════════════════════ 06 · что внутри
    s, y = sl(T["s06_eyebrow"], dark=True)
    y = title(s, T["s06_title"], y, dark=True, max_lines=1, start=40)
    y = lede(s, T["s06_lede"], y + 0.16, dark=True, w=CW * 0.86)
    yy = y + 0.50
    hline(s, ML, yy - 0.24, CW, HAIR_D)
    n = len(T["s06_sections"])
    gap = 0.24
    cw = (CW - gap * (n - 1)) / n
    bottom = yy
    for i, (head, body) in enumerate(T["s06_sections"]):
        xx = ML + i * (cw + gap)
        hs, hl = fit(head, DISPLAY_B, cw, 1, 16, 12, 0.5, -0.015)
        b = block(s, hl, xx, yy + 0.10, cw, DISPLAY_B, hs, PAPER_ON_D,
                  leading=hs * 1.12, tracking=-0.015)
        bottom = max(bottom, block(s, wrap(body, TEXT, 10.5, cw), xx, b + 0.14, cw,
                                   TEXT, 10.5, SOFT_D, leading=15))
    band(s, bottom + 0.46, [(T["s06_band"], TEXT_SB, WHITE)], dark=True, size=12.5)
    notes(s, T["s06_notes"])

    # ═════════════════════════════════════════════════ 07 · демонстрация
    s, y = sl(T["s07_eyebrow"], dark=True)
    y = title(s, T["s07_title"], y, dark=True, max_lines=1, start=40)
    y = lede(s, T["s07_lede"], y + 0.16, dark=True, w=CW * 0.8)
    yy = y + 0.50

    # QR слева, способы установки справа: жюри достаточно навести телефон.
    qs = 1.55
    qr(s, f"https://{SITE}", ML, yy, qs)
    qb = block(s, wrap(f"{T['s07_qr']}: {SITE}", TEXT, 9.5, qs + 0.7), ML, yy + qs + 0.14,
               qs + 0.7, TEXT, 9.5, SOFT_D, leading=13.5)

    wx = ML + qs + 0.75
    ww = CW - (qs + 0.75)
    b = yy
    for tag, body in T["s07_ways"]:
        b = block(s, [tag], wx + 0.28, b + 0.28, ww - 0.56, MONO_SB, 8.5, SIGNAL_L,
                  leading=11, tracking=0.16, caps=True)
        b = block(s, wrap(body, TEXT, 11, ww - 0.56), wx + 0.28, b + 0.16, ww - 0.56,
                  TEXT, 11, PAPER_ON_D, leading=16)
        b += 0.10
    panel_behind(s, wx, yy, ww, bottom=b, pad=0.28, dark=True)

    kpi_row(s, T["s07_kpi"], max(qb, b) + 0.46, dark=True, size=32, label_size=8,
            w_total=CW * 0.62)
    footnote(s, T["s07_note"], dark=True)
    notes(s, T["s07_notes"])

    # ═════════════════════════════════════════════════ 08 · итоги
    s, y = sl(T["s08_eyebrow"], dark=True)
    y = title(s, T["s08_title"], y, dark=True, max_lines=1, start=42)
    yy = y + 0.56
    lx, lw = col(0, 7)
    rx, rw = col(7, 5)
    b = block(s, [T["s08_concl_tag"]], lx + 0.30, yy + 0.30, lw - 0.60, MONO_SB, 8.5,
              SIGNAL_L, leading=11, tracking=0.16, caps=True)
    b = block(s, wrap(T["s08_concl"], DISPLAY_B, 19, lw - 0.60), lx + 0.30, b + 0.18,
              lw - 0.60, DISPLAY_B, 19, PAPER_ON_D, leading=25, tracking=-0.018)
    panel_behind(s, lx, yy, lw, bottom=b, pad=0.30, dark=True, fill=SIGNAL, border=False)
    b2 = block(s, [T["s08_next_tag"]], rx + 0.30, yy + 0.30, rw - 0.60, MONO_SB, 8.5,
               SIGNAL_L, leading=11, tracking=0.16, caps=True)
    b2 = bullets(s, T["s08_next"], rx + 0.30, b2 + 0.20, rw - 0.60, dark=True, size=11, gap=0.15)
    panel_behind(s, rx, yy, rw, bottom=b2, pad=0.30, dark=True)
    block(s, [f"{SITE}  ·  {T['author_line']}"], ML, H - MB - 0.10, CW, MONO_MD, 8.5,
          SOFT_D, leading=11, tracking=0.10, caps=True)
    notes(s, T["s08_notes"])

    d.save(T["file"])
    return T["file"]


def main():
    arg = (sys.argv[1] if len(sys.argv) > 1 else "ru").lower()
    langs = ["ru", "kz"] if arg in ("оба", "both", "all") else [arg]
    for lang in langs:
        OVERFLOW.clear()
        name = build(lang)
        print(f"  собрано: {name}  ({TOTAL} слайдов)")
        if OVERFLOW:
            print("  ПЕРЕПОЛНЕНИЯ:")
            for o in OVERFLOW:
                print("   ", o)
        else:
            print("  переполнений в карточках нет")


if __name__ == "__main__":
    main()
