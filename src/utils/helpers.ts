import type { Lang } from '../types';

export function t(kz: string, ru: string, lang: Lang): string {
  return lang === 'kz' ? kz : ru;
}

export function getCharacterName(character: string, lang: Lang): string {
  const names: Record<string, Record<Lang, string>> = {
    'AUTO': { kz: 'Мұғалім', ru: 'Учитель' },
    'AISHA': { kz: 'Айша', ru: 'Айша' },
    'DIMA': { kz: 'Дима', ru: 'Дима' },
    'TEACHER': { kz: 'Мұғалім', ru: 'Учитель' },
    'GIRL': { kz: 'Айша', ru: 'Айша' },
    'BOY': { kz: 'Дима', ru: 'Дима' },
  };
  const entry = names[character.toUpperCase()] || names['AUTO'];
  return entry[lang];
}

export function getCharacterSvgName(character: string): 'teacher' | 'girl' | 'boy' {
  const map: Record<string, 'teacher' | 'girl' | 'boy'> = {
    'AUTO': 'teacher',
    'TEACHER': 'teacher',
    'AISHA': 'girl',
    'GIRL': 'girl',
    'DIMA': 'boy',
    'BOY': 'boy',
  };
  return map[character.toUpperCase()] || 'teacher';
}

export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');
}

export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

export function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}

/**
 * Согласование существительного с числом по-русски:
 * 1 задание, 2 задания, 5 заданий.
 *
 * Без этого интерфейс выдаёт «1 заданий» — мелочь, которая сразу читается
 * как машинный перевод.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** Число вместе с согласованным словом: «5 заданий». */
export function pluralize(n: number, one: string, few: string, many: string): string {
  return `${n} ${plural(n, one, few, many)}`;
}
