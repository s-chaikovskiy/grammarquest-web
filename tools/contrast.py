#!/usr/bin/env python3
"""
Проверка контраста палитры по WCAG 2.1.
OKLCH → Oklab → linear sRGB → относительная яркость → коэффициент контраста.
Запускается при каждом изменении токенов: цвета правим числом, а не на глаз.
"""
import math, sys

def oklch_to_srgb(L, C, H):
    h = math.radians(H)
    a, b = C * math.cos(h), C * math.sin(h)
    l_, m_, s_ = L + 0.3963377774*a + 0.2158037573*b, \
                 L - 0.1055613458*a - 0.0638541728*b, \
                 L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l_**3, m_**3, s_**3
    r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    bl = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    return r, g, bl

def luminance(L, C, H):
    """Относительная яркость: линейные компоненты, отсечённые по гамуту."""
    r, g, b = (min(max(v, 0.0), 1.0) for v in oklch_to_srgb(L, C, H))
    return 0.2126*r + 0.7152*g + 0.0722*b

def contrast(c1, c2):
    l1, l2 = luminance(*c1), luminance(*c2)
    lo, hi = sorted((l1, l2))
    return (hi + 0.05) / (lo + 0.05)

def to_hex(L, C, H):
    def enc(v):
        v = min(max(v, 0.0), 1.0)
        v = 1.055*v**(1/2.4) - 0.055 if v > 0.0031308 else 12.92*v
        return round(min(max(v, 0.0), 1.0) * 255)
    return '#%02X%02X%02X' % tuple(enc(v) for v in oklch_to_srgb(L, C, H))


LIGHT = {
    'bg':        (0.985, 0.004, 250),
    'surface':   (1.000, 0.000, 250),
    'surface-2': (0.955, 0.008, 250),
    'border':    (0.865, 0.014, 250),
    'ink':       (0.250, 0.020, 255),
    'ink-2':     (0.470, 0.020, 255),
    'accent':    (0.500, 0.160, 250),
    'accent-ink':(0.430, 0.150, 250),
    'success':   (0.500, 0.140, 155),
    'error':     (0.510, 0.190,  25),
    'gold-ink':  (0.480, 0.110,  78),
    'on-accent': (1.000, 0.000, 250),
}

DARK = {
    'bg':        (0.200, 0.018, 255),
    'surface':   (0.245, 0.020, 255),
    'surface-2': (0.295, 0.022, 255),
    'border':    (0.380, 0.020, 255),
    'ink':       (0.960, 0.005, 255),
    'ink-2':     (0.745, 0.015, 255),
    'accent':    (0.720, 0.140, 250),
    'accent-ink':(0.780, 0.130, 250),
    'success':   (0.760, 0.150, 158),
    'error':     (0.700, 0.170,  25),
    'gold-ink':  (0.820, 0.130,  82),
    'on-accent': (0.180, 0.020, 255),
}

# (текст, фон, минимум). 4.5 — обычный текст, 3.0 — крупный текст и границы контролов.
CHECKS = [
    ('ink',        'bg',        4.5, 'основной текст на фоне'),
    ('ink',        'surface',   4.5, 'основной текст на карточке'),
    ('ink',        'surface-2', 4.5, 'основной текст на второй поверхности'),
    ('ink-2',      'bg',        4.5, 'вторичный текст на фоне'),
    ('ink-2',      'surface',   4.5, 'вторичный текст на карточке'),
    ('ink-2',      'surface-2', 4.5, 'вторичный текст (плейсхолдер) на поверхности'),
    ('accent-ink', 'bg',        4.5, 'ссылка/акцентный текст'),
    ('accent-ink', 'surface',   4.5, 'акцентный текст на карточке'),
    ('on-accent',  'accent',    4.5, 'текст на акцентной кнопке'),
    ('success',    'surface',   4.5, 'текст «верно»'),
    ('error',      'surface',   4.5, 'текст «ошибка»'),
    ('gold-ink',   'surface',   4.5, 'текст серии/XP'),
    ('accent',     'bg',        3.0, 'граница активного контрола'),
    ('border',     'bg',        1.4, 'разделитель заметен'),
]

def run(name, tokens):
    print(f'\n=== {name} ===')
    bad = 0
    for fg, bgk, minimum, label in CHECKS:
        ratio = contrast(tokens[fg], tokens[bgk])
        ok = ratio >= minimum
        bad += not ok
        mark = '✓' if ok else '✗'
        print(f'  {mark} {label:38} {fg:10} на {bgk:10} {ratio:5.2f} (нужно ≥{minimum})')
    return bad

def dump(name, tokens):
    print(f'\n--- {name}: hex для справки ---')
    for k, v in tokens.items():
        print(f'  {k:11} oklch({v[0]} {v[1]} {v[2]})  {to_hex(*v)}')

if __name__ == '__main__':
    fails = run('Светлая тема', LIGHT) + run('Тёмная тема', DARK)
    if '--hex' in sys.argv:
        dump('Светлая', LIGHT); dump('Тёмная', DARK)
    if fails:
        print(f'\n✗ Не проходит проверок: {fails}')
        sys.exit(1)
    print('\n✓ Вся палитра проходит WCAG AA')
