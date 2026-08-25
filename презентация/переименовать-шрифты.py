#!/usr/bin/env python3
"""
Приведение имён шрифтов к тем, которые запрашивает колода.

Движок вёрстки меряет текст по файлу TTF, а PowerPoint и LibreOffice ищут
шрифт по имени, записанному внутри файла. Если имена расходятся, редактор
подставляет чужую гарнитуру с другими метриками — строки перевёрстываются,
и подзаголовок наезжает на заголовок.

Скрипт записывает в каждый файл имя семейства ровно таким, каким его
запрашивает deckkit, и ставит начертание Regular: тогда совпадение точное
и подстановки не происходит.
"""
import glob
import pathlib
from fontTools.ttLib import TTFont

NAMES = {
    "GQText-Rg.ttf": "GQ Text",
    "GQText-Md.ttf": "GQ Text Medium",
    "GQText-SmBd.ttf": "GQ Text SemiBold",
    "GQText-Bold.ttf": "GQ Text Bold",
}

WIN, MAC = (3, 1, 0x409), (1, 0, 0)


def rename(path: pathlib.Path, family: str):
    font = TTFont(str(path))
    name = font["name"]
    ps = family.replace(" ", "")
    values = {1: family, 2: "Regular", 3: f"{ps};v1.0", 4: family, 6: ps, 16: family, 17: "Regular"}
    for platform in (WIN, MAC):
        for nid, value in values.items():
            name.setName(value, nid, *platform)
    # Снимаем флаг «жирный» у ОС: вес уже зашит в само начертание,
    # иначе редактор дополнительно утолщает шрифт синтетически.
    font["OS/2"].fsSelection = (font["OS/2"].fsSelection & ~0b100001) | 0b1000000
    font["head"].macStyle = 0
    font.save(str(path))
    print(f"  {path.name:20} → «{family}»")


if __name__ == "__main__":
    for file, family in NAMES.items():
        rename(pathlib.Path("шрифты") / file, family)
