#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка покрытия казахских букв шрифтом.

Слайд 07 презентации утверждает, что прежние шрифты не содержали казахских
букв. Утверждение должно быть проверяемым: жюри вправе попросить показать.
Скрипт читает таблицу символов самого файла шрифта и отвечает по каждой букве.

    python3 tools/check_fonts.py               свои шрифты проекта
    python3 tools/check_fonts.py --скачать     плюс Manrope и Playfair Display

Второй режим тянет шрифты с Google Fonts и требует интернета. Файлы кладутся
во временный каталог и не попадают в репозиторий.

Нужен fontTools: tools/.venv/bin/python tools/check_fonts.py
"""
import argparse
import pathlib
import re
import ssl
import sys
import tempfile
import urllib.request

from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Девять букв, которых нет на русской раскладке и без которых казахский текст
# набрать нельзя. Именно на них построена главная находка проекта.
KZ_LETTERS = "ә ғ қ ң ө ұ ү һ і".split()

# Прежние шрифты приложения. Прямые ссылки на файлы Google Fonts меняются
# от версии к версии, поэтому спрашиваем у самого сервиса, где лежат
# кириллические сабсеты: искать казахские буквы в латинском наборе
# бессмысленно — их там не должно быть по определению.
REMOTE = ["Manrope", "Playfair Display"]

CSS_URL = "https://fonts.googleapis.com/css2?{}&display=swap"

# Так браузер сообщает, что понимает woff2; иначе Google отдаёт старый формат.
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def covered(path: pathlib.Path) -> dict[str, bool]:
    """Какие из казахских букв есть в таблице символов шрифта."""
    font = TTFont(str(path), fontNumber=0, lazy=True)
    codepoints: set[int] = set()
    for table in font["cmap"].tables:
        codepoints |= set(table.cmap.keys())
    font.close()
    return {ch: ord(ch) in codepoints for ch in KZ_LETTERS}


def report(name: str, path: pathlib.Path) -> bool:
    try:
        result = covered(path)
    except Exception as exc:                                  # noqa: BLE001
        print(f"  {name:22} не прочитался: {exc}")
        return False
    missing = [ch for ch, ok in result.items() if not ok]
    marks = " ".join(ch if ok else "·" for ch, ok in result.items())
    if missing:
        print(f"  ✗ {name:22} {marks}    нет: {' '.join(missing)} ({len(missing)} из 9)")
    else:
        print(f"  ✓ {name:22} {marks}    все девять на месте")
    return not missing


def _context() -> ssl.SSLContext:
    """Свежий venv не знает корневых сертификатов системы — берём их у certifi."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20, context=_context()) as resp:
        return resp.read()


def cyrillic_subsets(family: str) -> list[str]:
    """
    Ссылки на кириллические сабсеты шрифта — их и надо проверять.

    Google Fonts помечает каждый блок комментарием с именем сабсета, и стоит
    он ПЕРЕД блоком. Делить файл по «@font-face» нельзя: имя сабсета остаётся
    в конце предыдущего куска, и разбор врёт — у Playfair Display кириллица
    так «пропадала» целиком.
    """
    css = get(CSS_URL.format("family=" + family.replace(" ", "+"))).decode("utf-8")
    urls = []
    for name, block in re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{.*?\})", css, re.S):
        if not name.startswith("cyrillic"):
            continue
        m = re.search(r"url\((https://[^)]+\.woff2)\)", block)
        if m and m.group(1) not in urls:
            urls.append(m.group(1))
    return urls


def fetch(name: str, url: str, into: pathlib.Path) -> pathlib.Path | None:
    target = into / f"{name.replace(' ', '-')}-{len(list(into.iterdir()))}.woff2"
    try:
        target.write_bytes(get(url))
        return target
    except Exception as exc:                                  # noqa: BLE001
        print(f"  {name:22} не скачался: {exc}")
        return None


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--скачать", action="store_true", dest="download",
                    help="проверить ещё и прежние шрифты, скачав их с Google Fonts")
    args = ap.parse_args()

    print("Казахские буквы, которых нет на русской раскладке:")
    print("  " + " ".join(KZ_LETTERS) + "\n")

    print("Шрифт приложения:")
    ours = sorted((ROOT / "public" / "fonts").glob("*.woff2"))
    if not ours:
        print("  файлы шрифтов не найдены")
        sys.exit(1)
    # Казахские буквы лежат в кириллических сабсетах; латинские их и не должны
    # содержать — проверяем набор целиком, как его видит браузер.
    union: dict[str, bool] = {ch: False for ch in KZ_LETTERS}
    for f in ours:
        for ch, ok in covered(f).items():
            union[ch] = union[ch] or ok
        report(f.stem, f)
    missing = [ch for ch, ok in union.items() if not ok]
    print(f"\n  Набор целиком: {'все девять букв доступны' if not missing else 'НЕ ХВАТАЕТ ' + ' '.join(missing)}")

    if args.download:
        print("\nПрежние шрифты — кириллические сабсеты с Google Fonts:")
        with tempfile.TemporaryDirectory() as tmp:
            for family in REMOTE:
                try:
                    urls = cyrillic_subsets(family)
                except Exception as exc:                      # noqa: BLE001
                    print(f"  {family:22} список сабсетов не получен: {exc}")
                    continue
                if not urls:
                    print(f"  {family:22} кириллических сабсетов нет вовсе")
                    continue
                combined = {ch: False for ch in KZ_LETTERS}
                for url in urls:
                    path = fetch(family, url, pathlib.Path(tmp))
                    if not path:
                        continue
                    for ch, ok in covered(path).items():
                        combined[ch] = combined[ch] or ok
                gone = [ch for ch, ok in combined.items() if not ok]
                marks = " ".join(ch if ok else "·" for ch, ok in combined.items())
                verdict = f"нет: {' '.join(gone)} ({len(gone)} из 9)" if gone else "все девять на месте"
                print(f"  {'✗' if gone else '✓'} {family:22} {marks}    {verdict}")

    if missing:
        sys.exit(1)


if __name__ == "__main__":
    main()
