# -*- coding: utf-8 -*-
"""
Сверка чисел документов с данными проекта.

В презентации такая проверка уже есть, и она дважды поймала расхождение:
вес приложения менялся, а слайд оставался со старым числом. В документах
чисел не меньше — 26 сабақ, 623 жазба, 70 автотест, — и разъедутся они
ровно так же тихо.

Скрипт не правит тексты, а показывает расхождения. Запускается сам
при сборке документов, отдельно — так:

    ../презентация/venv/bin/python сверка-чисел.py

Нужен свежий `npm run build` в корне: вес считается по сборке.
"""
import gzip
import json
import pathlib
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent


def факты() -> dict[str, int]:
    def читать(имя):
        return json.loads((ROOT / "src" / "data" / имя).read_text(encoding="utf-8"))

    уроки = читать("lessons.json")["lessons"]
    шаги = [s for l in уроки for s in l["steps"]]
    индекс = читать("audio-index.json")

    активы = ROOT / "dist" / "assets"
    вес = 0
    if активы.exists():
        главные = list(активы.glob("index-*.js")) + list(активы.glob("index-*.css"))
        вес = round(sum(len(gzip.compress(f.read_bytes())) for f in главные) / 1024)

    тесты = sum(len(re.findall(r"^test\(", f.read_text(encoding="utf-8"), re.M))
                for f in sorted((ROOT / "tools" / "tests").glob("*.test.ts")))
    контраст = subprocess.run([sys.executable, str(ROOT / "tools" / "contrast.py")],
                              capture_output=True, text=True).stdout

    return {
        "сабақ": len(уроки),
        "тапсырма": len(шаги),
        "жаттығу түрі": len({s.get("taskType") for s in шаги}),
        "сөз": len(читать("vocabulary.json")["words"]),
        "ереже": len(читать("rules.json")),
        "тақырып": len(читать("reference.json")["topics"]),
        "жазба": len(индекс.get("available", [])),
        "автотест": тесты,
        "тексеру": len(re.findall(r"нужно ≥", контраст)),
        "КБ": вес,
    }


# Числа, которые могут стоять в тексте помимо сверяемых: они тоже верные,
# но означают другое. Без этого списка проверка ругалась бы на «7 файл»
# (столько картинок персонажей) и на «21 автотест» (столько в одном наборе).
ИСКЛЮЧЕНИЯ = {
    "сабақ": {7, 12, 18},        # уроки по уровням и в первой версии
    "автотест": {21},            # тестов в наборе морфологии
    "тапсырма": set(),
    "сөз": set(), "ереже": set(), "тақырып": set(),
    "жазба": set(), "тексеру": set(),
    # 240 КБ — это правила со справочником, они грузятся отдельно
    # и к весу основной сборки отношения не имеют.
    "КБ": {240},
    "жаттығу түрі": set(),
}

ШАБЛОНЫ = {
    "сабақ": r"(\d+)\s+сабақ\b",
    "тапсырма": r"(\d+)\s+тапсырма\b",
    "жаттығу түрі": r"(\d+)\s+жаттығу түрі",
    "сөз": r"(\d+)\s+сөз\b",
    "ереже": r"(\d+)\s+(?:грамматика\s+)?ереже",
    "тақырып": r"(\d+)\s+(?:анықтама\s+)?тақырып",
    "жазба": r"(\d+)\s+жазба",
    "автотест": r"(\d+)\s+автотест",
    "тексеру": r"(\d+)\s+тексеру",
    "КБ": r"(\d+)\s*КБ",
}


def листов(pdf: pathlib.Path) -> int:
    """Число страниц PDF без сторонних библиотек — по объектам /Type /Page."""
    b = pdf.read_bytes()
    return len(re.findall(rb"/Type\s*/Page[^s]", b))


def страницы_в_памятке() -> int:
    """
    В памятке рядом с каждым документом стоит его объём. Это число живёт
    отдельно от документов и уже разъезжалось: стояло 15 и 16 страниц,
    когда в файлах было 16 и 20. Сверяем с настоящими PDF.
    """
    памятка = HERE / "ЧИТАТЬ-ПЕРВЫМ.md"
    if not памятка.exists():
        return 0
    текст_памятки = памятка.read_text(encoding="utf-8")
    плохо = 0
    for pdf in sorted(HERE.glob("*.pdf")):
        имя = pdf.stem
        строка = next((s for s in текст_памятки.splitlines() if имя in s), None)
        if строка is None:
            continue
        заявлено = re.search(r"(\d+)\s+страниц", строка)
        если_есть = int(заявлено.group(1)) if заявлено else None
        было = листов(pdf)
        if если_есть is None:
            print(f"  ! {памятка.name}: у «{имя}» не указан объём")
            continue
        if если_есть != было:
            плохо += 1
            print(f"  ✗ {памятка.name}: «{имя}» — заявлено {если_есть} стр., в файле {было}")
    return плохо


def текст(файл: pathlib.Path) -> str:
    import zipfile
    xml = zipfile.ZipFile(файл).read("word/document.xml").decode("utf-8")
    return re.sub(r"<[^>]+>", "", re.sub(r"</w:p>", "\n", xml))


def main() -> None:
    ф = факты()
    print("Числа по данным проекта:")
    for k, v in ф.items():
        print(f"  {k:14} {v}")

    плохо = 0
    print("\nСверка с документами:")
    for файл in sorted(HERE.glob("*.docx")):
        t = текст(файл)
        for ключ, шаблон in ШАБЛОНЫ.items():
            for найдено in {int(m) for m in re.findall(шаблон, t)}:
                if найдено == ф[ключ] or найдено in ИСКЛЮЧЕНИЯ[ключ]:
                    continue
                плохо += 1
                print(f"  ✗ {файл.name}: «{найдено} {ключ}», по данным {ф[ключ]}")

    print("\nСверка объёма с памяткой:")
    плохо += страницы_в_памятке()

    if плохо:
        print(f"\nРасхождений: {плохо}. Поправить в текстах и пересобрать.")
        sys.exit(1)
    print(f"  ✓ числа и объём в {len(list(HERE.glob('*.docx')))} документах сходятся с данными")


if __name__ == "__main__":
    main()
