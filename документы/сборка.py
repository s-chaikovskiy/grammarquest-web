# -*- coding: utf-8 -*-
"""
Сборка документов олимпиады для версии 2.0.

Два документа собираются по оглавлению прошлогодней защиты: те же разделы,
та же нумерация, тот же порядок. Так учителю не нужно сверять структуру —
достаточно прочитать содержание.

Текст лежит в `техническое.py` и `руководство.py`, вёрстка — здесь.
Разделение то же, что и в презентации: правка текста не должна требовать
правки оформления.

    ./venv/bin/python сборка.py

Шрифт Times New Roman 12 — как принято в школьных работах. Заголовки
жирные того же кегля, что и в оригинале: 20 / 16 / 14.
"""
import pathlib
import sys

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt, RGBColor

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

BODY = "Times New Roman"
MONO = "Consolas"
INK = RGBColor(0x1B, 0x22, 0x2B)
GREY = RGBColor(0x55, 0x5D, 0x68)


def новый_документ(заголовок: str, подзаголовок: str) -> Document:
    d = Document()
    s = d.sections[0]
    s.page_width, s.page_height = Cm(21), Cm(29.7)
    s.left_margin = s.right_margin = Cm(3)
    s.top_margin = s.bottom_margin = Cm(2)

    n = d.styles["Normal"]
    n.font.name = BODY
    n.font.size = Pt(12)
    n.paragraph_format.space_after = Pt(6)
    n.paragraph_format.line_spacing = 1.15

    for имя, кегль in (("Heading 1", 20), ("Heading 2", 16), ("Heading 3", 14)):
        st = d.styles[имя]
        st.font.name = BODY
        st.font.size = Pt(кегль)
        st.font.bold = True
        st.font.color.rgb = INK
        st.paragraph_format.space_before = Pt(16 if кегль > 14 else 12)
        st.paragraph_format.space_after = Pt(6)

    p = d.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(заголовок)
    r.font.size, r.font.bold, r.font.name = Pt(22), True, BODY

    p = d.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(подзаголовок)
    r.font.size, r.font.name = Pt(13), BODY
    r.font.color.rgb = GREY
    p.paragraph_format.space_after = Pt(18)
    return d


def _маркер(d, текст, уровень=0):
    p = d.add_paragraph(текст, style="List Bullet" if уровень == 0 else "List Bullet 2")
    p.paragraph_format.space_after = Pt(2)
    for r in p.runs:
        r.font.name, r.font.size = BODY, Pt(12)
    return p


def _код(d, текст):
    for строка in текст.strip("\n").split("\n"):
        p = d.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.left_indent = Cm(0.6)
        r = p.add_run(строка if строка.strip() else " ")
        r.font.name, r.font.size = MONO, Pt(9.5)
        r.font.color.rgb = INK


def _таблица(d, строки):
    t = d.add_table(rows=len(строки), cols=len(строки[0]))
    t.style = "Table Grid"
    for i, ряд in enumerate(строки):
        for j, ячейка in enumerate(ряд):
            c = t.cell(i, j)
            c.text = ""
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(str(ячейка))
            r.font.name, r.font.size = BODY, Pt(10.5)
            if i == 0:
                r.font.bold = True
    d.add_paragraph().paragraph_format.space_after = Pt(4)


def _картинка(d, путь, подпись):
    p = d.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(путь), width=Cm(7.2))
    c = d.add_paragraph()
    c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = c.add_run(подпись)
    r.font.size, r.font.italic, r.font.name = Pt(10), True, BODY
    r.font.color.rgb = GREY
    c.paragraph_format.space_after = Pt(12)


def собрать(блоки, d: Document, база: pathlib.Path):
    """Блок — кортеж («вид», …). Виды: h1 h2 h3 p b b2 code table img."""
    for блок in блоки:
        вид, данные = блок[0], блок[1]
        if вид in ("h1", "h2", "h3"):
            d.add_heading(данные, level=int(вид[1]))
        elif вид == "p":
            p = d.add_paragraph(данные)
            for r in p.runs:
                r.font.name, r.font.size = BODY, Pt(12)
        elif вид == "b":
            for пункт in данные:
                _маркер(d, пункт)
        elif вид == "b2":
            for пункт in данные:
                _маркер(d, пункт, 1)
        elif вид == "code":
            _код(d, данные)
        elif вид == "table":
            _таблица(d, данные)
        elif вид == "img":
            путь = база / данные
            if путь.exists():
                _картинка(d, путь, блок[2])
            else:
                print(f"  ! нет картинки: {путь.name}")
        else:
            raise ValueError(f"неизвестный вид блока: {вид}")
    return d


def main():
    import руководство
    import техническое

    скрины = HERE / "скриншоты"
    for модуль in (техническое, руководство):
        d = новый_документ(модуль.ЗАГОЛОВОК, модуль.ПОДЗАГОЛОВОК)
        собрать(модуль.БЛОКИ, d, скрины)
        путь = HERE / модуль.ФАЙЛ
        d.save(путь)
        знаков = sum(len(b[1]) if isinstance(b[1], str)
                     else sum(len(str(x)) for x in b[1]) for b in модуль.БЛОКИ)
        print(f"  собрано: {модуль.ФАЙЛ}  ({len(модуль.БЛОКИ)} блоков, ~{знаков} знаков)",
              flush=True)   # иначе вывод сверки ниже встанет выше этих строк

    # Сверка чисел идёт сразу за сборкой, а не по памяти: в документах
    # 26 сабақ, 623 жазба, 70 автотест — и разъезжаются они тихо.
    # Так уже случилось с весом приложения: в тексте стояло 202 КБ
    # при фактических 210.
    import subprocess
    print()
    subprocess.run([sys.executable, str(HERE / "сверка-чисел.py")], check=False)


if __name__ == "__main__":
    main()
