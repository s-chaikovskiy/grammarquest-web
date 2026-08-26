#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Markdown → PDF.

Нужен, чтобы отдавать документы проекта людям, у которых нет ни редактора
кода, ни желания разбираться в разметке: учителю на проверку, школьнику
перед защитой.

    ./презентация/venv/bin/python tools/md_to_pdf.py ГИТХАБ-И-ВЕРСЕЛЬ.md
    ./презентация/venv/bin/python tools/md_to_pdf.py файл.md --выход имя.pdf

Печатает LibreOffice. Два других пути отпали на проверке: headless-режим
Chrome на этой машине падает при печати страницы, а сборка через fpdf2
ломала нумерованные списки и таблицы.

Шрифт — «GQ Text», то есть Golos Text под тем именем, под которым он ставится
вместе с презентацией (папка презентация/шрифты). Он выбран не по красоте:
в нём есть все девять казахских букв, а во многих гарнитурах их нет.
Если шрифт не установлен, LibreOffice подставит системный — текст останется
читаемым, но казахские буквы могут выглядеть чужими.
"""
import argparse
import pathlib
import shutil
import subprocess
import sys
import tempfile

import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent

FONT = "'GQ Text','Golos Text','Helvetica Neue',sans-serif"
MONO = "'IBM Plex Mono','SF Mono',monospace"

CSS = f"""
body {{
  font-family: {FONT};
  font-size: 10.5pt;
  line-height: 1.45;
  color: #1B222B;
  margin: 0;
}}

/* Заголовки без этого правила уходят в засечки: LibreOffice применяет
   к ним собственный стиль и гарнитуру body не наследует. */
h1, h2, h3, h4 {{ font-family: {FONT}; margin-left: 0; }}

h1 {{ font-size: 20pt; color: #1B222B; margin: 0 0 8pt; }}
h2 {{ font-size: 13.5pt; color: #0057A3; margin: 18pt 0 6pt; }}
h3 {{ font-size: 11pt; color: #1B222B; margin: 12pt 0 4pt; }}

p {{ margin: 0 0 7pt; }}
li {{ margin-bottom: 3pt; }}

table {{ border-collapse: collapse; width: 100%; margin: 6pt 0 12pt; }}
th {{
  font-family: {FONT};
  text-align: left;
  font-size: 8.5pt;
  color: #535C66;
  border-bottom: 1.2pt solid #1B222B;
  padding: 4pt 8pt 4pt 0;
}}
td {{
  font-family: {FONT};
  font-size: 9.5pt;
  border-bottom: 0.5pt solid #E4E9EF;
  padding: 5pt 8pt 5pt 0;
  vertical-align: top;
}}

blockquote {{
  margin: 8pt 0 12pt 0;
  padding: 9pt 12pt;
  background: #F2F6FB;
  border-left: 3pt solid #0064B9;
}}

code, pre {{ font-family: {MONO}; font-size: 9pt; }}
pre {{ background: #F1F4F8; padding: 8pt 10pt; }}

hr {{ border: 0; border-top: 0.5pt solid #D8DEE6; }}
a {{ color: #0057A3; }}
"""


def find_soffice() -> str:
    for c in ("soffice", "/Applications/LibreOffice.app/Contents/MacOS/soffice"):
        found = shutil.which(c) or (c if pathlib.Path(c).exists() else None)
        if found:
            return found
    print("Не найден LibreOffice — он нужен для печати.")
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("файл", help="исходный .md")
    ap.add_argument("--выход", dest="out", help="имя PDF (по умолчанию рядом с исходником)")
    args = ap.parse_args()

    src = pathlib.Path(args.файл)
    if not src.exists():
        print(f"Нет файла: {src}")
        sys.exit(1)
    out = pathlib.Path(args.out) if args.out else src.with_suffix(".pdf")

    body = markdown.markdown(
        src.read_text(encoding="utf-8"),
        extensions=["tables", "sane_lists", "fenced_code"],
    )
    html = (f"<!doctype html><html lang=ru><head><meta charset='utf-8'>"
            f"<style>{CSS}</style></head><body>{body}</body></html>")

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = pathlib.Path(tmp)
        page = tmpdir / f"{src.stem}.html"
        page.write_text(html, encoding="utf-8")
        subprocess.run(
            [find_soffice(), "--headless", "--convert-to", "pdf",
             "--outdir", str(tmpdir), str(page)],
            check=True, capture_output=True, timeout=180,
        )
        made = tmpdir / f"{src.stem}.pdf"
        if not made.exists():
            print("LibreOffice не создал PDF.")
            sys.exit(1)
        shutil.move(str(made), str(out))

    print(f"{out.name}: {out.stat().st_size / 1024:.0f} КБ")


if __name__ == "__main__":
    main()
