# -*- coding: utf-8 -*-
"""
Выгрузка казахского текста презентации на проверку учителю.

Казахский текст писал ассистент, а не носитель языка. Пока его не сверил
живой учитель, считать колоду готовой нельзя. Скрипт кладёт рядом русский
и казахский вариант каждой строки, чтобы сверять было по чему.

    ./venv/bin/python выгрузка-на-проверку.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from тексты import RU, KZ

SKIP = {"code", "file", "author_line"}


def flat(value):
    """Разворачивает строку, список строк или список кортежей в плоский список."""
    if isinstance(value, str):
        return [value]
    out = []
    for item in value:
        if isinstance(item, str):
            out.append(item)
        elif isinstance(item, (list, tuple)):
            out.append(" · ".join(str(x) for x in item if x))
    return out


def main():
    rows = []
    for key in RU:
        # Заметки докладчика — шпаргалка, её зал не видит, и она остаётся русской.
        if key in SKIP or key.endswith("_notes"):
            continue
        ru, kz = RU[key], KZ[key]
        if ru == kz:
            continue
        rl, kl = flat(ru), flat(kz)
        for i in range(max(len(rl), len(kl))):
            rows.append((key if i == 0 else "",
                         rl[i] if i < len(rl) else "—",
                         kl[i] if i < len(kl) else "—"))

    esc = lambda s: str(s).replace("|", "\\|")
    lines = [
        "# Казахский текст презентации — на проверку",
        "",
        "Текст написан ассистентом, а не носителем языка. До проверки живым учителем",
        "считать его готовым нельзя — так же, как базовый курс уроков.",
        "",
        f"Строк к сверке: **{len(rows)}**.",
        "",
        "Правки вносить в `тексты.py`, словарь `KZ`, по ключу из первой колонки.",
        "После правки пересобрать: `./venv/bin/python build.py kz`.",
        "",
        "## На что смотреть в первую очередь",
        "",
        "- **Термины.** «жаттықтырғыш», «жалғау», «үндестік заңы», «септік», «ұяңдау» —",
        "  те ли слова, которые приняты в школьном учебнике?",
        "- **Падежные окончания в заголовках.** Заголовки короткие, ошибка в них заметнее всего.",
        "- **Числительные.** После числа существительное в казахском не ставится во",
        "  множественное число: «26 сабақ», а не «26 сабақтар».",
        "- **Слайд 10.** Формы «жатырмын» и «жатырсың» и их переводы — это ядро доклада,",
        "  ошибка здесь дороже всех остальных.",
        "",
        "| Ключ | Русский | Казахский |",
        "|---|---|---|",
    ] + [f"| `{k}` | {esc(r)} | {esc(z)} |" for k, r, z in rows]

    out = pathlib.Path(__file__).resolve().parent / "НА-ПРОВЕРКУ-КАЗАХСКИЙ-ТЕКСТ.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{out.name}: {len(rows)} строк на сверку")


if __name__ == "__main__":
    main()
