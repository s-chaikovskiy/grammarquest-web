#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Выгрузка справочной части на проверку учителю.

Уроки уходят в НА-ПРОВЕРКУ-УЧИТЕЛЮ.md, но казахский текст есть не только
в них: 33 правила и 22 темы справочника — это ещё 47 тысяч знаков, которые
ученик читает прямо во время урока. Их тоже писала нейросеть, и их тоже
не видел носитель языка.

Запуск: python3 tools/export_reference_review.py (входит в npm run data)
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
RULES = ROOT / "src" / "data" / "rules.json"
TOPICS = ROOT / "src" / "data" / "reference.json"
OUT = ROOT / "НА-ПРОВЕРКУ-СПРАВОЧНИК.md"


def kz_chars(objs, keys) -> int:
    total = 0
    for o in objs:
        for k in keys:
            v = o.get(k)
            if isinstance(v, list):
                total += sum(len(str(x)) for x in v)
            elif v:
                total += len(str(v))
    return total


def block(title: str, kz, ru) -> list[str]:
    """Пара «казахский — русский» одним блоком; списки разворачиваются."""
    out = [f"**{title}**", ""]
    if isinstance(kz, list):
        out += [f"- {x}" for x in kz]
    elif kz:
        out += [str(kz)]
    out.append("")
    if isinstance(ru, list):
        out += [f"  — {x}" for x in ru]
    elif ru:
        out += [f"  — {ru}"]
    out.append("")
    return out


def main():
    rules = json.loads(RULES.read_text(encoding="utf-8"))
    topics = json.loads(TOPICS.read_text(encoding="utf-8"))["topics"]

    rk = kz_chars(rules, ["titleKz", "kz", "examplesKz"])
    tk = kz_chars(topics, ["titleKz", "bodyKz", "examplesKz", "mistakesKz"])

    lines = [
        "# Справочник и правила — на проверку учителю",
        "",
        "Вторая половина казахского текста приложения. Первая — уроки,",
        "она в `НА-ПРОВЕРКУ-УЧИТЕЛЮ.md`.",
        "",
        "| Часть | Статей | Знаков казахского |",
        "|---|---|---|",
        f"| Правила | {len(rules)} | {rk} |",
        f"| Темы справочника | {len(topics)} | {tk} |",
        f"| **Всего здесь** | **{len(rules) + len(topics)}** | **{rk + tk}** |",
        "",
        "Этот текст ученик читает прямо во время урока — раздел «Справка».",
        "Его писала нейросеть, носитель языка не проверял.",
        "",
        "Править: `src/data/rules.json` и `src/data/reference.json`.",
        "Эти файлы не генерируются, их можно менять напрямую.",
        "",
        "---",
        "",
        f"# Правила ({len(rules)})",
        "",
    ]

    for r in rules:
        lines += [f"## {r['titleRu']}", "", f"`{r['id']}` · казахское название: **{r.get('titleKz','—')}**", ""]
        lines += block("Объяснение", r.get("kz"), r.get("ru"))
        if r.get("examplesKz"):
            lines += block("Примеры", r["examplesKz"], r.get("examplesRu"))
        lines += ["---", ""]

    lines += [f"# Темы справочника ({len(topics)})", ""]
    for t in topics:
        lines += [f"## {t['titleRu']}", "",
                  f"`{t['id']}` · раздел «{t.get('categoryRu','—')}» · казахское название: **{t.get('titleKz','—')}**", ""]
        lines += block("Разбор", t.get("bodyKz"), t.get("bodyRu"))
        if t.get("examplesKz"):
            lines += block("Примеры", t["examplesKz"], t.get("examplesRu"))
        if t.get("mistakesKz"):
            lines += block("Частые ошибки", t["mistakesKz"], t.get("mistakesRu"))
        lines += ["---", ""]

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"{OUT.name}: {len(rules)} правил и {len(topics)} тем, {rk + tk} знаков казахского")


if __name__ == "__main__":
    main()
