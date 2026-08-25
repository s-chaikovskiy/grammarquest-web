# -*- coding: utf-8 -*-
"""
«Тілашар» — защита научного проекта. Сборка колоды.

Вёрстка одна, языков два. Тексты лежат в тексты.py: так казахская версия
остаётся переводом строк, а не второй колодой, которую пришлось бы править
параллельно и путать перед защитой.

    ./venv/bin/python build.py ru      русская версия (по умолчанию)
    ./venv/bin/python build.py kz      казахская
    ./venv/bin/python build.py оба     обе сразу

После сборки:
    soffice --headless --convert-to pdf *.pptx
"""
import sys

from deckkit import *
from тексты import TEXTS, SITE


def build(lang: str):
    T = TEXTS[lang]
    d = Deck()
    d.total = 18
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
    title_slide(s, T["year"], T["s01_l1"], T["s01_l2"], T["s01_sub"], T["s01_kpi"], T["author_line"])
    notes(s, T["s01_notes"])

    # ═════════════════════════════════════════════════ 02 · актуальность
    s, y = sl(T["s02_eyebrow"])
    y = title(s, T["s02_title"], y, max_lines=2, start=38)
    y = lede(s, T["s02_lede"], y + 0.16, w=CW * 0.88)
    yy = y + 0.46
    hline(s, ML, yy - 0.22, CW)
    lx, lw = col(0, 6)
    rx, rw = col(6, 6)
    b1 = block(s, wrap(T["s02_left"], TEXT_SB, 13, lw - 0.56), lx + 0.28, yy + 0.30, lw - 0.56,
               TEXT_SB, 13, INK, leading=19)
    panel_behind(s, lx, yy, lw, bottom=b1, pad=0.30, accent=SIGNAL)
    b2 = block(s, wrap(T["s02_right"], TEXT, 12.5, rw - 0.56), rx + 0.28, yy + 0.30, rw - 0.56,
               TEXT, 12.5, SOFT, leading=18)
    panel_behind(s, rx, yy, rw, bottom=b2, pad=0.30)
    footnote(s, T["s02_note"])
    notes(s, T["s02_notes"])

    # ═════════════════════════════════════════════════ 03 · вопрос и гипотеза
    s, y = sl(T["s03_eyebrow"], dark=True)
    y = title(s, T["s03_title"], y, dark=True, max_lines=2, start=36)
    y = lede(s, T["s03_lede"], y + 0.15, dark=True, w=CW * 0.86)
    qy = y + 0.50
    qx, qw = col(0, 7)
    b = block(s, [T["s03_q_tag"]], qx + 0.30, qy + 0.30, qw - 0.60, MONO_SB, 8.5, SIGNAL_L,
              leading=11, tracking=0.16, caps=True)
    b = block(s, wrap(T["s03_q"], DISPLAY_B, 21, qw - 0.60), qx + 0.30, b + 0.16, qw - 0.60,
              DISPLAY_B, 21, PAPER_ON_D, leading=28, tracking=-0.018)
    panel_behind(s, qx, qy, qw, bottom=b, pad=0.30, dark=True, fill=SIGNAL, border=False)
    hx, hw = col(7, 5)
    b2 = block(s, [T["s03_h_tag"]], hx + 0.30, qy + 0.30, hw - 0.60, MONO_SB, 8.5, SIGNAL_L,
               leading=11, tracking=0.16, caps=True)
    b2 = block(s, wrap(T["s03_h"], TEXT_SB, 13, hw - 0.60), hx + 0.30, b2 + 0.16, hw - 0.60,
               TEXT_SB, 13, PAPER_ON_D, leading=19)
    panel_behind(s, hx, qy, hw, bottom=b2, pad=0.30, dark=True)
    notes(s, T["s03_notes"])

    # ═════════════════════════════════════════════════ 04 · цель и задачи
    s, y = sl(T["s04_eyebrow"])
    y = title(s, T["s04_title"], y, max_lines=2, start=34)
    yy = y + 0.52
    hline(s, ML, yy - 0.24, CW)
    lx, lw = col(0, 7)
    rx, rw = col(7, 5)
    b = block(s, [T["s04_tasks_tag"]], lx, yy, lw, MONO_SB, 8.5, SIGNAL, leading=11,
              tracking=0.16, caps=True)
    bullets(s, T["s04_tasks"], lx, b + 0.22, lw, size=11.5, gap=0.17, marker="→")
    b2 = block(s, [T["s04_obj_tag"]], rx + 0.28, yy + 0.30, rw - 0.56, MONO_SB, 8.5, SIGNAL,
               leading=11, tracking=0.16, caps=True)
    b2 = block(s, wrap(T["s04_obj"], TEXT, 12, rw - 0.56), rx + 0.28, b2 + 0.18, rw - 0.56,
               TEXT, 12, SOFT, leading=17.5)
    panel_behind(s, rx, yy, rw, bottom=b2, pad=0.30)
    notes(s, T["s04_notes"])

    # ═════════════════════════════════════════════════ 05 · методика
    s, y = sl(T["s05_eyebrow"])
    y = title(s, T["s05_title"], y, max_lines=1, start=38)
    y = lede(s, T["s05_lede"], y + 0.16, w=CW * 0.82)
    yy = y + 0.46
    hline(s, ML, yy - 0.22, CW)
    n = len(T["s05_steps"])
    gap = 0.24
    cw = (CW - gap * (n - 1)) / n
    for i, (head, body) in enumerate(T["s05_steps"]):
        xx = ML + i * (cw + gap)
        b = block(s, [f"{i + 1:02d}"], xx, yy + 0.12, cw, MONO_SB, 9, SIGNAL, leading=11,
                  tracking=0.14, caps=True)
        hs, hl = fit(head, DISPLAY_B, cw, 2, 15, 11, 0.5, -0.015)
        b = block(s, hl, xx, b + 0.14, cw, DISPLAY_B, hs, INK, leading=hs * 1.12, tracking=-0.015)
        block(s, wrap(body, TEXT, 10.5, cw), xx, b + 0.14, cw, TEXT, 10.5, SOFT, leading=15)
    notes(s, T["s05_notes"])

    # ═════════════════════════════════════════════════ 06 · находка 1
    s, y = sl(T["s06_eyebrow"], dark=True)
    y = title(s, T["s06_title"], y, dark=True, max_lines=1, start=44)
    y = lede(s, T["s06_lede"], y + 0.18, dark=True, w=CW * 0.84)
    y = kpi_row(s, T["s06_kpi"], y + 0.62, dark=True, size=52, accent_first=True)
    band(s, y + 0.52, [(T["s06_band"], TEXT_SB, WHITE)], dark=True, size=13)
    notes(s, T["s06_notes"])

    # ═════════════════════════════════════════════════ 07 · находка 2
    s, y = sl(T["s07_eyebrow"])
    y = title(s, T["s07_title"], y, max_lines=2, start=36)
    y = lede(s, T["s07_lede"], y + 0.16, w=CW * 0.84)
    cols = [(T["s07_cols"][0], 3), (T["s07_cols"][1], 3), (T["s07_cols"][2], 4)]
    y = table(s, cols, T["s07_rows"], ML, y + 0.48, CW, accent_col=2, row_h=0.48)
    band(s, y + 0.40, [(T["s07_band"], TEXT_SB, WHITE)], size=12.5)
    footnote(s, T["s07_note"])
    notes(s, T["s07_notes"])

    # ═════════════════════════════════════════════════ 08 · находка 3
    s, y = sl(T["s08_eyebrow"], dark=True)
    y = title(s, T["s08_title"], y, dark=True, max_lines=1, start=40)
    y = lede(s, T["s08_lede"], y + 0.16, dark=True, w=CW * 0.8)
    table(s, [(T["s08_cols"][0], 5), (T["s08_cols"][1], 7)], T["s08_rows"], ML, y + 0.46, CW,
          dark=True, row_h=0.46)
    notes(s, T["s08_notes"])

    # ═════════════════════════════════════════════════ 09 · решение 1
    s, y = sl(T["s09_eyebrow"])
    y = title(s, T["s09_title"], y, max_lines=1, start=38)
    y = lede(s, T["s09_lede"], y + 0.16, w=CW * 0.86)
    yy = y + 0.46
    cards = T["s09_cards"]
    gap = 0.22
    cw = (CW - gap * 3) / 4
    h = row_h(cw, [(t, hd, it) for t, hd, it in cards], head_size=14, item_size=10)
    tones = [PETROL, SIGNAL, OCHRE, ERROR]
    for i, (tag, head, items) in enumerate(cards):
        card(s, ML + i * (cw + gap), yy, cw, h, tag, head, items,
             head_size=14, item_size=10, accent=tones[i], tag_color=tones[i])
    band(s, yy + h + 0.38, [(T["s09_band"], TEXT_SB, WHITE)], size=12.5)
    notes(s, T["s09_notes"])

    # ═════════════════════════════════════════════════ 10 · тонкое место
    s, y = sl(T["s10_eyebrow"], dark=True)
    y = title(s, T["s10_title"], y, dark=True, max_lines=2, start=36)
    y = lede(s, T["s10_lede"], y + 0.15, dark=True, w=CW * 0.86)
    yy = y + 0.52
    lx, lw = col(0, 6)
    rx, rw = col(6, 6)
    # две формы, отличающиеся одним символом
    py = yy + 0.30
    for form, meaning in T["s10_pair"]:
        py = block(s, [form], lx + 0.30, py, lw - 0.60, MONO_SB, 22, SIGNAL_L, leading=27, tracking=-0.01)
        py = block(s, [meaning], lx + 0.30, py + 0.06, lw - 0.60, TEXT, 11, SOFT_D, leading=15)
        py += 0.22
    py = block(s, wrap(T["s10_pair_note"], TEXT, 11, lw - 0.60), lx + 0.30, py, lw - 0.60,
               TEXT, 11, SOFT_D, leading=16)
    panel_behind(s, lx, yy, lw, bottom=py, pad=0.30, dark=True)
    b = block(s, [T["s10_rule_tag"]], rx + 0.30, yy + 0.30, rw - 0.60, MONO_SB, 8.5, SIGNAL_L,
              leading=11, tracking=0.16, caps=True)
    b = block(s, wrap(T["s10_rule"], DISPLAY_B, 17, rw - 0.60), rx + 0.30, b + 0.18, rw - 0.60,
              DISPLAY_B, 17, PAPER_ON_D, leading=23, tracking=-0.015)
    panel_behind(s, rx, yy, rw, bottom=b, pad=0.30, dark=True, fill=SIGNAL, border=False)
    notes(s, T["s10_notes"])

    # ═════════════════════════════════════════════════ 11 · морфология
    s, y = sl(T["s11_eyebrow"])
    y = title(s, T["s11_title"], y, max_lines=1, start=36)
    y = lede(s, T["s11_lede"], y + 0.16, w=CW * 0.84)
    yy = y + 0.46
    hline(s, ML, yy - 0.22, CW)
    lx, lw = col(0, 8)
    rx, rw = col(8, 4)
    b1 = bullets(s, T["s11_rules"], lx, yy + 0.12, lw - 0.30, size=11.5, gap=0.20, marker="—")
    b2 = kpi_row(s, T["s11_kpi"], yy + 0.12, size=30, w_total=rw, x0=rx, gap=0.22, label_size=8)
    band(s, max(b1, b2) + 0.52, [(T["s11_band"], TEXT_SB, WHITE)], size=12.5)
    notes(s, T["s11_notes"])

    # ═════════════════════════════════════════════════ 12 · содержание
    s, y = sl(T["s12_eyebrow"])
    y = title(s, T["s12_title"], y, max_lines=1, start=36)
    y = lede(s, T["s12_lede"], y + 0.16, w=CW * 0.86)
    cols = [(T["s12_cols"][0], 2.4), (T["s12_cols"][1], 1.4), (T["s12_cols"][2], 1.2), (T["s12_cols"][3], 7)]
    y = table(s, cols, T["s12_rows"], ML, y + 0.44, CW, accent_col=0, row_h=0.44)
    b = block(s, [T["s12_types_tag"]], ML, y + 0.34, CW, MONO_SB, 8.5, SIGNAL, leading=11,
              tracking=0.16, caps=True)
    block(s, wrap(T["s12_types"], TEXT_SB, 12, CW), ML, b + 0.16, CW, TEXT_SB, 12, INK, leading=17.5)
    footnote(s, T["s12_note"])
    notes(s, T["s12_notes"])

    # ═════════════════════════════════════════════════ 13 · удержание
    s, y = sl(T["s13_eyebrow"], dark=True)
    y = title(s, T["s13_title"], y, dark=True, max_lines=1, start=38)
    y = lede(s, T["s13_lede"], y + 0.16, dark=True, w=CW * 0.86)
    yy = y + 0.50
    hline(s, ML, yy - 0.24, CW, HAIR_D)
    n = len(T["s13_sections"])
    gap = 0.24
    cw = (CW - gap * (n - 1)) / n
    bottom = yy
    for i, (head, body) in enumerate(T["s13_sections"]):
        xx = ML + i * (cw + gap)
        hs, hl = fit(head, DISPLAY_B, cw, 1, 16, 12, 0.5, -0.015)
        b = block(s, hl, xx, yy + 0.10, cw, DISPLAY_B, hs, PAPER_ON_D, leading=hs * 1.12, tracking=-0.015)
        bottom = max(bottom, block(s, wrap(body, TEXT, 10.5, cw), xx, b + 0.14, cw, TEXT, 10.5,
                                   SOFT_D, leading=15))
    band(s, bottom + 0.48, [(T["s13_band"], TEXT_SB, WHITE)], dark=True, size=12.5)
    notes(s, T["s13_notes"])

    # ═════════════════════════════════════════════════ 14 · демонстрация
    s, y = sl(T["s14_eyebrow"])
    y = title(s, T["s14_title"], y, max_lines=1, start=44)
    y = lede(s, T["s14_lede"], y + 0.16, w=CW * 0.8)
    stages = [(f"{i + 1:02d}", head, "", [body]) for i, (head, body) in enumerate(T["s14_steps"])]
    y = timeline(s, stages, ML, y + 0.58, CW)
    band(s, y + 0.46, [(T["s14_band"], TEXT_SB, WHITE)], size=12.5)
    notes(s, T["s14_notes"])

    # ═════════════════════════════════════════════════ 15 · мобильное
    s, y = sl(T["s15_eyebrow"], dark=True)
    y = title(s, T["s15_title"], y, dark=True, max_lines=1, start=40)
    y = lede(s, T["s15_lede"], y + 0.16, dark=True, w=CW * 0.84)
    yy = y + 0.48
    gap = 0.24
    cw = (CW - gap) / 2
    hh = row_h(cw, [(t, None, [b]) for t, b in T["s15_ways"]], item_size=11)
    for i, (tag, body) in enumerate(T["s15_ways"]):
        card(s, ML + i * (cw + gap), yy, cw, hh, tag, None, [body], dark=True, item_size=11)
    y2 = kpi_row(s, T["s15_kpi"], yy + hh + 0.44, dark=True, size=34, label_size=8)
    footnote(s, T["s15_note"], dark=True)
    notes(s, T["s15_notes"])

    # ═════════════════════════════════════════════════ 16 · как я это делал
    s, y = sl(T["s16_eyebrow"])
    y = title(s, T["s16_title"], y, max_lines=1, start=38)
    y = lede(s, T["s16_lede"], y + 0.16, w=CW * 0.86)
    yy = y + 0.48
    lx, lw = col(0, 6)
    rx, rw = col(6, 6)
    b = block(s, [T["s16_mine_tag"]], lx + 0.28, yy + 0.30, lw - 0.56, MONO_SB, 8.5, SIGNAL,
              leading=11, tracking=0.16, caps=True)
    b = bullets(s, T["s16_mine"], lx + 0.28, b + 0.20, lw - 0.56, size=11, gap=0.14)
    panel_behind(s, lx, yy, lw, bottom=b, pad=0.30, accent=SIGNAL)
    b2 = block(s, [T["s16_tools_tag"]], rx + 0.28, yy + 0.30, rw - 0.56, MONO_SB, 8.5, PETROL,
               leading=11, tracking=0.16, caps=True)
    b2 = bullets(s, T["s16_tools"], rx + 0.28, b2 + 0.20, rw - 0.56, size=11, gap=0.14,
                 mcolor=PETROL, color=SOFT)
    panel_behind(s, rx, yy, rw, bottom=b2, pad=0.30, accent=PETROL)
    notes(s, T["s16_notes"])

    # ═════════════════════════════════════════════════ 17 · апробация
    s, y = sl(T["s17_eyebrow"])
    y = title(s, T["s17_title"], y, max_lines=1, start=40)
    y = lede(s, T["s17_lede"], y + 0.16, w=CW * 0.86)
    yy = y + 0.50
    hline(s, ML, yy - 0.24, CW)
    n = len(T["s17_plan"])
    gap = 0.24
    cw = (CW - gap * (n - 1)) / n
    bottom = yy
    for i, (head, body) in enumerate(T["s17_plan"]):
        xx = ML + i * (cw + gap)
        b = block(s, [head], xx, yy + 0.10, cw, MONO_SB, 9, SIGNAL, leading=11.5,
                  tracking=0.14, caps=True)
        bottom = max(bottom, block(s, wrap(body, TEXT, 11, cw), xx, b + 0.16, cw, TEXT, 11,
                                   INK, leading=16))
    band(s, bottom + 0.50, [(T["s17_band"], TEXT_SB, WHITE)], size=12.5)
    notes(s, T["s17_notes"])

    # ═════════════════════════════════════════════════ 18 · выводы
    s, y = sl(T["s18_eyebrow"], dark=True)
    y = title(s, T["s18_title"], y, dark=True, max_lines=1, start=42)
    yy = y + 0.56
    lx, lw = col(0, 7)
    rx, rw = col(7, 5)
    b = block(s, [T["s18_concl_tag"]], lx + 0.30, yy + 0.30, lw - 0.60, MONO_SB, 8.5, SIGNAL_L,
              leading=11, tracking=0.16, caps=True)
    b = block(s, wrap(T["s18_concl"], DISPLAY_B, 19, lw - 0.60), lx + 0.30, b + 0.18, lw - 0.60,
              DISPLAY_B, 19, PAPER_ON_D, leading=25, tracking=-0.018)
    panel_behind(s, lx, yy, lw, bottom=b, pad=0.30, dark=True, fill=SIGNAL, border=False)
    b2 = block(s, [T["s18_next_tag"]], rx + 0.30, yy + 0.30, rw - 0.60, MONO_SB, 8.5, SIGNAL_L,
               leading=11, tracking=0.16, caps=True)
    b2 = bullets(s, T["s18_next"], rx + 0.30, b2 + 0.20, rw - 0.60, dark=True, size=11, gap=0.15)
    panel_behind(s, rx, yy, rw, bottom=b2, pad=0.30, dark=True)
    block(s, [f"{SITE}  ·  {T['author_line']}"], ML, H - MB - 0.10, CW, MONO_MD, 8.5, SOFT_D,
          leading=11, tracking=0.10, caps=True)
    notes(s, T["s18_notes"])

    d.save(T["file"])
    return T["file"]


def main():
    arg = (sys.argv[1] if len(sys.argv) > 1 else "ru").lower()
    langs = ["ru", "kz"] if arg in ("оба", "both", "all") else [arg]
    for lang in langs:
        OVERFLOW.clear()
        name = build(lang)
        print(f"  собрано: {name}")
        if OVERFLOW:
            print("  ПЕРЕПОЛНЕНИЯ:")
            for o in OVERFLOW:
                print("   ", o)
        else:
            print("  переполнений в карточках нет")


if __name__ == "__main__":
    main()
