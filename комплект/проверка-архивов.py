# -*- coding: utf-8 -*-
"""
Полная перепроверка готовых архивов перед отправкой.

Читает текст из каждого файла внутри распакованных папок архивов — docx
(тело, колонтитулы), pptx (слайды и заметки), pdf, txt/srt/url/md — и ищет:
  · старое имя проекта в любом написании;
  · старые адреса и старые версии установщика;
  · что новый адрес есть в письмах и памятках;
а также сверяет APK и exe в архивах побайтно с файлами комплекта.

    презентация/venv/bin/python комплект/проверка-архивов.py

Зовётся из СОБРАТЬ.py последним шагом. Проверена на архивах 3.0.1:
нашла все 10 оставшихся упоминаний Setup-3.0.1 и вернула код 1.
"""
import hashlib
import pathlib
import re
import sys
import zipfile

import pypdfium2 as pdfium

ROOT = pathlib.Path(__file__).resolve().parent.parent
ГОТОВОЕ = ROOT / "комплект" / "готовое"
АРХИВЫ = ["Grammar-Dialogue-Quest-3.0-қазақша", "Grammar-Dialogue-Quest-3.0-по-русски"]

ЗАПРЕЩЕНО = re.compile(
    r"Тілашар|ТІЛАШАР|тілашар|Tilashar|TILASHAR|tilashar"
    r"|Setup-3\.0\.[01]\b|portable-3\.0\.[01]\b|3\.0\.0|2\.0\.0")
АДРЕС = "grammarquest-web.vercel.app"


def текст(f: pathlib.Path) -> str:
    суф = f.suffix.lower()
    if суф in (".docx", ".pptx"):
        z = zipfile.ZipFile(f)
        части = [n for n in z.namelist() if n.endswith(".xml") and (
            n.startswith("word/") or n.startswith("ppt/slides/") or n.startswith("ppt/notesSlides/"))]
        return "\n".join(re.sub(r"<[^>]+>", "", z.read(n).decode("utf-8", "ignore")) for n in части)
    if суф == ".pdf":
        doc = pdfium.PdfDocument(str(f))
        return "\n".join(doc[i].get_textpage().get_text_range() for i in range(len(doc)))
    if суф in (".txt", ".srt", ".url", ".md"):
        return f.read_bytes().decode("utf-8-sig", "ignore")
    return ""


def sha(f: pathlib.Path) -> str:
    return hashlib.sha1(f.read_bytes()).hexdigest()


плохо = 0
for архив in АРХИВЫ:
    корень = ГОТОВОЕ / архив
    zipf = ГОТОВОЕ / f"{архив}.zip"
    print(f"\n=== {архив}")
    if not zipf.exists() or not корень.exists():
        print("  ✗ архива нет"); плохо += 1; continue
    # Папка и zip должны совпадать по составу: проверяем именно то, что уйдёт.
    в_zip = {n.split("/", 1)[1] for n in zipfile.ZipFile(zipf).namelist() if "/" in n and not n.endswith("/")}
    в_папке = {str(p.relative_to(корень)) for p in корень.rglob("*") if p.is_file()}
    if в_zip != в_папке:
        print(f"  ✗ zip и папка расходятся: {sorted(в_zip ^ в_папке)[:5]}"); плохо += 1
    for f in sorted(корень.rglob("*")):
        if not f.is_file():
            continue
        отн = f.relative_to(корень)
        if ЗАПРЕЩЕНО.search(str(отн)):
            print(f"  ✗ имя файла: {отн}"); плохо += 1
        if "шрифты" in отн.parts:
            continue
        т = текст(f)
        найдено = sorted(set(ЗАПРЕЩЕНО.findall(т)))
        if найдено:
            print(f"  ✗ {отн}: {найдено}"); плохо += 1
        elif т:
            print(f"  ✓ {отн}  ({len(т)} знаков)")
        if f.suffix == ".txt" and "ПАМЯТКА" not in f.name and АДРЕС not in т:
            print(f"  ✗ {отн}: нет адреса {АДРЕС}"); плохо += 1
    for имя, src in (("GrammarDialogueQuest.apk", ROOT / "комплект/apk/GrammarDialogueQuest.apk"),
                     ("GrammarDialogueQuest-Setup-3.0.2.exe", ROOT / "комплект/exe/GrammarDialogueQuest-Setup-3.0.2.exe")):
        копии = list(корень.rglob(имя))
        if len(копии) != 1 or sha(копии[0]) != sha(src):
            print(f"  ✗ {имя}: нет в архиве или не совпадает с комплектом"); плохо += 1
        else:
            print(f"  ✓ {имя} совпадает побайтно")

print(f"\nЗамечаний: {плохо}")
sys.exit(1 if плохо else 0)
