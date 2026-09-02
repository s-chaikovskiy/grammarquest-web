#!/usr/bin/env python3
"""
Обогащение уроков «Тілашар»: превращает 187 одинаковых заданий «впиши текст»
в шесть разных типов упражнений.

Вход:  src/data/lessons.merged.json  (собирается tools/content/build.py)
Выход: src/data/lessons.json          (то, что читает приложение)
       src/data/vocabulary.json       (словарь, собранный из уроков)

Скрипт детерминированный: один и тот же вход всегда даёт один и тот же выход,
поэтому результат воспроизводим и его можно пересобрать после правки контента.
"""
import json
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data" / "lessons.merged.json"
DST = ROOT / "src" / "data" / "lessons.json"
VOC = ROOT / "src" / "data" / "vocabulary.json"

# --- казахская фонетика -------------------------------------------------------

KZ_FOLD = str.maketrans({"ә": "а", "ғ": "г", "қ": "к", "ң": "н",
                         "ө": "о", "ұ": "у", "ү": "у", "һ": "х", "і": "и"})

# Личные окончания, сгруппированные по сингармонизму (жуан / жіңішке).
# Замена внутри группы даёт грамматически существующую, но неверную здесь форму —
# то есть идеальный дистрактор.
PERSON_SETS = [
    ["мын", "сың", "сыз", "мыз", "сыңдар"],      # твёрдый ряд, после гласной/звонкой
    ["мін", "сің", "сіз", "міз", "сіңдер"],      # мягкий ряд
    ["бын", "сың", "быз", "сыз"],
    ["бін", "сің", "біз", "сіз"],
    ["пын", "сың", "пыз", "сыз"],
    ["пін", "сің", "піз", "сіз"],
]

# Временные показатели: подмена времени — вторая по частоте ошибка школьника.
TENSE_SETS = [
    ["ды", "ады", "ар"],
    ["ді", "еді", "ер"],
    ["ты", "ады"],
    ["ті", "еді"],
]


BACK_VOWELS = set("аоыұу")      # жуан дауыстылар
FRONT_VOWELS = set("әөіүе")     # жіңішке дауыстылар
VOICELESS = set("қкпстшчфхһцщ")  # қатаң дауыссыздар


def fold(s: str) -> str:
    return s.lower().translate(KZ_FOLD)


def is_back(stem: str) -> bool:
    """Сингармонизм определяется последней гласной основы."""
    for ch in reversed(stem.lower()):
        if ch in BACK_VOWELS:
            return True
        if ch in FRONT_VOWELS:
            return False
    return True


def valid_junction(stem: str, suffix: str) -> bool:
    """
    Отбраковывает несуществующие формы на стыке основы и окончания.
    «талқылай» + «ады» дало бы «талқылайады», «талқыла» + «ар» — «талқылаар»:
    в казахском невозможны ни две гласные подряд, ни «й» перед гласной.
    Такие кандидаты отбрасываем и берём дистрактор из урока — лучше простой
    вариант, чем выдуманная форма, на которой ученик запомнит неправильное.
    """
    if not stem or not suffix:
        return False
    vowels = BACK_VOWELS | FRONT_VOWELS
    left, right = stem[-1], suffix[0]
    if left in vowels and right in vowels:
        return False
    if left == "й" and right in vowels:
        return False
    return True


def converb_forms(word: str) -> list[str]:
    """
    Для деепричастия на -ып/-іп/-п строит другие формы того же глагола:
    настоящее-будущее, прошедшее и инфинитив. Ученик путает именно их,
    поэтому как дистракторы они работают лучше случайных слов урока.
    """
    for suffix in ("ып", "іп", "п"):
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            stem = word[: -len(suffix)]
            break
    else:
        return []

    back = is_back(stem)
    last = stem[-1] if stem else ""
    # Прошедшее время: после глухих — -ты/-ті, иначе -ды/-ді.
    past = ("ты" if back else "ті") if last in VOICELESS else ("ды" if back else "ді")
    # Настоящее-будущее: после согласной -ады/-еді, после гласной -йды/-йді.
    if last in BACK_VOWELS | FRONT_VOWELS:
        present = "йды" if back else "йді"
    else:
        present = "ады" if back else "еді"
    infinitive = "у"
    forms = [stem + present, stem + past, stem + infinitive]
    return [f for f, suf in zip(forms, (present, past, infinitive)) if valid_junction(stem, suf)]


def lev(a: str, b: str) -> int:
    if a == b:
        return 0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def similarity(a: str, b: str) -> float:
    a, b = fold(a), fold(b)
    m = max(len(a), len(b)) or 1
    return 1 - lev(a, b) / m


def swap_suffix(word: str, families) -> list[str]:
    """Меняет окончание слова на «братские» из той же группы."""
    out = []
    for family in families:
        # Самое длинное подходящее окончание — иначе «ады» распознается как «ды».
        matches = sorted((s for s in family if word.endswith(s)), key=len, reverse=True)
        if not matches:
            continue
        suffix = matches[0]
        stem = word[: -len(suffix)]
        for alt in family:
            if alt != suffix and valid_junction(stem, alt):
                out.append(stem + alt)
        break
    return out


def make_distractors(answer: str, pool: list[str], rng: random.Random, need=3,
                     hand: list[str] | None = None) -> list[str]:
    """
    Три правдоподобных неверных варианта.
    Порядок источников: заданные вручную → по правилу → соседние ответы урока.
    """
    if hand and len(hand) >= need:
        return hand[:need]
    words = answer.split()
    last = words[-1]
    prefix = " ".join(words[:-1])
    seen = {fold(answer)}
    out = []

    def push(candidate: str):
        candidate = candidate.strip()
        key = fold(candidate)
        if candidate and key not in seen and len(out) < need:
            seen.add(key)
            out.append(candidate)

    # 1. Смена лица (я / ты / мы) — сохраняет сингармонизм.
    for alt in swap_suffix(last, PERSON_SETS):
        push((prefix + " " + alt).strip())
    # 2. Смена времени.
    for alt in swap_suffix(last, TENSE_SETS):
        push((prefix + " " + alt).strip())
    # 3. Другие формы того же глагола — для деепричастий на -ып/-іп/-п.
    for alt in converb_forms(last):
        push((prefix + " " + alt).strip())
    # 4. Соседние ответы того же урока, отсортированные по похожести:
    #    чем ближе форма, тем труднее отличить — тем полезнее упражнение.
    neighbours = sorted(
        (p for p in pool if fold(p) != fold(answer)),
        key=lambda p: similarity(answer, p),
        reverse=True,
    )
    for p in neighbours:
        push(p)

    return out[:need]


BLANK_RE = re.compile(r"«([^»]*(?:\.\.\.|…)[^»]*)»")
HINT_RE = re.compile(r"\(([^)]+)\)\s*$")


def parse_blank(task: str):
    """Достаёт из формулировки предложение с пропуском и подсказку-инфинитив."""
    m = BLANK_RE.search(task)
    if not m:
        return None
    sentence = m.group(1).replace("…", "...")
    hint_m = HINT_RE.search(task)
    hint = hint_m.group(1) if hint_m else None
    prompt = task[: m.start()].strip().rstrip(":").strip()
    return {"sentence": sentence, "hint": hint, "prompt": prompt}


def clean_ru(text: str) -> str:
    return text.strip().strip(".")


def enrich():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    stats = {}

    for lesson in data["lessons"]:
        steps = lesson["steps"]
        rng = random.Random(lesson["id"])          # детерминизм: сид от id урока

        short_pool = [s["answerKz"] for s in steps if 1 <= len(s["answerKz"].split()) <= 2]
        pair_pool = [
            {"left": s["answerKz"], "right": clean_ru(s["answerRu"])}
            for s in steps
            if 1 <= len(s["answerKz"].split()) <= 2 and 1 <= len(s["answerRu"].split()) <= 3
        ]
        # Уникальные пары: одинаковый перевод в двух строках сделал бы задание нерешаемым.
        uniq, seen_l, seen_r = [], set(), set()
        for p in pair_pool:
            if fold(p["left"]) in seen_l or fold(p["right"]) in seen_r:
                continue
            seen_l.add(fold(p["left"]))
            seen_r.add(fold(p["right"]))
            uniq.append(p)
        pair_pool = uniq

        # Один шаг урока отводим под сопоставление — если пар хватает на 4 строки.
        matching_at = None
        if len(pair_pool) >= 4:
            candidates = [i for i, s in enumerate(steps) if 1 <= len(s["answerKz"].split()) <= 2]
            if candidates:
                matching_at = candidates[len(candidates) // 2]

        for i, step in enumerate(steps):
            answer = step["answerKz"].strip()
            words = answer.split()
            wc = len(words)
            blank = parse_blank(step["taskKz"])
            ru = clean_ru(step["answerRu"])

            if i == matching_at:
                pairs = [p for p in pair_pool if fold(p["left"]) == fold(answer)][:1]
                rest = [p for p in pair_pool if fold(p["left"]) != fold(answer)]
                rng.shuffle(rest)
                pairs += rest[: 4 - len(pairs)]
                rng.shuffle(pairs)
                step["taskType"] = "matching"
                step["pairs"] = pairs

            elif wc > 6 or "/" in answer:
                # Развёрнутые и вариативные ответы автоматом не проверяются честно —
                # ученик пишет свободно, потом сверяется с эталоном и оценивает себя.
                step["taskType"] = "open"

            elif 3 <= wc <= 6 and lesson["level"] > 1:
                # Знаки препинания не должны становиться отдельными «словами»:
                # собирать предложение из тире бессмысленно. Движок проверки
                # пунктуацию игнорирует, поэтому выбросить её безопасно.
                tokens = [w for w in words if any(ch.isalpha() for ch in w)]
                if len(tokens) < 3:
                    step["taskType"] = "input"
                else:
                    rng.shuffle(tokens)
                    if tokens == [w for w in words if any(ch.isalpha() for ch in w)] and len(tokens) > 1:
                        tokens.reverse()
                    step["taskType"] = "word_order"
                    step["tokens"] = tokens

            elif lesson["level"] == 1 and 3 <= wc <= 6 and blank:
                # На первом уровне сборка предложения слишком сложна:
                # ученик ещё не знает порядка слов. Оставляем пропуск.
                step["taskType"] = "fill_blank"
                step["blank"] = blank

            elif i % 3 == 1 and wc <= 2:
                options = make_distractors(answer, short_pool, rng,
                                           hand=step.get("distractors"))
                if len(options) >= 3:
                    options.append(answer)
                    rng.shuffle(options)
                    step["taskType"] = "choice"
                    step["options"] = options
                elif blank:
                    step["taskType"] = "fill_blank"
                    step["blank"] = blank
                else:
                    step["taskType"] = "input"

            elif blank:
                step["taskType"] = "fill_blank"
                step["blank"] = blank

            elif (wc <= 2 and 1 <= len(ru.split()) <= 3 and i % 2 == 0
                  and any(ch.isalpha() for ch in answer)):
                # Ответ обязан быть словом. Без этой проверки шаг «Какое число
                # означает „үш“?» с ответом «3» превращался в «Переведи на
                # казахский: три» — и ученик, написавший «үш», получал «неверно».
                step["taskType"] = "translate"
                step["prompt"] = ru

            else:
                step["taskType"] = "input"

            stats[step["taskType"]] = stats.get(step["taskType"], 0) + 1

    # Короткое название для карточек: полные заголовки вроде «Числительные:
    # количественные, порядковые, дробные и собирательные» в список не влезают.
    for lesson in data["lessons"]:
        for key in ("titleRu", "titleKz"):
            short = lesson[key].split(":")[0].split("(")[0].strip()
            lesson[key.replace("title", "short")] = short

    for lesson in data["lessons"]:
        for step in lesson["steps"]:
            step.pop("distractors", None)   # служебное поле, приложению не нужно

    data["version"] = 3
    DST.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    build_vocabulary(data)

    total = sum(stats.values())
    print(f"Обогащено шагов: {total}")
    for k, v in sorted(stats.items(), key=lambda kv: -kv[1]):
        print(f"  {k:12} {v:4}  {v / total * 100:5.1f}%")
    return data, stats


def validate(data):
    """Проверки, без которых битые задания уехали бы в прод."""
    problems = []
    for lesson in data["lessons"]:
        for i, s in enumerate(lesson["steps"]):
            tag = f"{lesson['id']}[{i}] {s['taskType']}"
            tt = s["taskType"]
            if tt == "choice":
                opts = s["options"]
                if len(opts) != 4:
                    problems.append(f"{tag}: вариантов {len(opts)}, нужно 4")
                if len({fold(o) for o in opts}) != len(opts):
                    problems.append(f"{tag}: дубли среди вариантов")
                if not any(fold(o) == fold(s["answerKz"]) for o in opts):
                    problems.append(f"{tag}: среди вариантов нет правильного")
            elif tt == "word_order":
                expected = sorted(w for w in s["answerKz"].split() if any(c.isalpha() for c in w))
                if sorted(s["tokens"]) != expected:
                    problems.append(f"{tag}: набор слов не совпадает с ответом")
                if any(not any(c.isalpha() for c in tok) for tok in s["tokens"]):
                    problems.append(f"{tag}: среди слов есть знак препинания")
                if s["tokens"] == s["answerKz"].split():
                    problems.append(f"{tag}: слова не перемешаны")
            elif tt == "matching":
                pairs = s["pairs"]
                if len(pairs) != 4:
                    problems.append(f"{tag}: пар {len(pairs)}, нужно 4")
                if len({fold(p["right"]) for p in pairs}) != len(pairs):
                    problems.append(f"{tag}: одинаковые переводы — задание нерешаемо")
            elif tt == "fill_blank":
                if "..." not in s["blank"]["sentence"]:
                    problems.append(f"{tag}: в предложении нет пропуска")

            # Формулировка не должна обещать свободу, которой проверка не даёт.
            # Задание «напиши любое имя» с единственным верным ответом «Дима»
            # наказывает ученика за то, что он сделал ровно то, о чём просили.
            promise = ("любое", "любой", "своё имя", "свое имя", "на выбор", "что хочешь")
            text = (s["taskRu"] + " " + s["taskKz"]).lower()
            if any(word in text for word in promise) and tt not in ("open",):
                problems.append(f"{tag}: формулировка обещает свободный ответ, "
                                f"а проверка ждёт «{s['answerKz']}»")
    return problems


def build_vocabulary(data):
    """
    Словарь собирается из самих уроков: каждый короткий ответ — это словарная
    форма, которую ученик уже встречал. Отдельного словаря не ведём, чтобы
    он не разошёлся с содержанием уроков.
    """
    entries = {}

    def unfit(kz: str, ru: str) -> bool:
        """
        Годится ли пара в словарь.

        Отсеиваем то, что словарной статьёй не является:
        цифры (учить надо «үш», а не «3»), перечисления через запятую —
        они попадают из ответов вида «мектептер, әжелер, балалар» и в игре
        на перевод выглядят как одно длинное слово, — и пары, где перевод
        совпал с оригиналом: такая карточка ничему не учит.
        """
        if not kz or not ru:
            return True
        if not (1 <= len(kz.split()) <= 3) or "/" in kz:
            return True
        if not any(ch.isalpha() for ch in kz):
            return True
        if "," in kz or "," in ru:
            return True
        if fold(kz) == fold(ru):
            return True
        return False

    for lesson in data["lessons"]:
        for i, step in enumerate(lesson["steps"]):
            kz = step["answerKz"].strip()
            ru = step["answerRu"].strip().rstrip(".")
            if unfit(kz, ru):
                continue
            key = fold(kz)
            entry = entries.setdefault(key, {
                "kz": kz, "ru": ru,
                # Одно слово или оборот из нескольких. Игра на перевод берёт
                # только слова: «жақсы оқушыға» в качестве «слова» сбивает.
                "phrase": len(kz.split()) > 1,
                "level": lesson["level"],
                "unit": lesson["unit"],
                "lessons": [],
            })
            entry["level"] = min(entry["level"], lesson["level"])
            ref = {"lessonId": lesson["id"], "stepIndex": i}
            if ref not in entry["lessons"]:
                entry["lessons"].append(ref)

    # Дополняем словами из заданий на сопоставление.
    #
    # Раньше здесь не было ни одной проверки — «пары уже выверены» оказалось
    # неверным допущением: именно отсюда в словарь попали цифра «3» и
    # перечисления через запятую. Условия те же, что и выше.
    for lesson in data["lessons"]:
        for step in lesson["steps"]:
            for pair in step.get("pairs", []):
                kz, ru = pair["left"].strip(), pair["right"].strip()
                if unfit(kz, ru):
                    continue
                key = fold(kz)
                if key not in entries:
                    entries[key] = {"kz": kz, "ru": ru,
                                    "phrase": len(kz.split()) > 1,
                                    "level": lesson["level"], "unit": lesson["unit"],
                                    "lessons": []}

    words = sorted(entries.values(), key=lambda e: (e["level"], fold(e["kz"])))
    VOC.write_text(json.dumps({"version": 1, "words": words}, ensure_ascii=False, indent=1),
                   encoding="utf-8")
    single = sum(1 for w in words if not w.get("phrase"))
    print(f"Словарь: {len(words)} статей — {single} слов, {len(words) - single} оборотов")
    print(f"  по уровням: "
          f"1 — {sum(1 for w in words if w['level'] == 1)}, "
          f"2 — {sum(1 for w in words if w['level'] == 2)}, "
          f"3 — {sum(1 for w in words if w['level'] == 3)})")


if __name__ == "__main__":
    data, _ = enrich()
    problems = validate(data)
    if problems:
        print(f"\n✗ Проблем: {len(problems)}")
        for p in problems[:30]:
            print("  " + p)
        sys.exit(1)
    print("✓ Валидация пройдена: все задания корректны")
