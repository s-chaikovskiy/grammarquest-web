/**
 * Интерфейс одноязычный — русский. Приложение с самого начала рассчитано на
 * тех, кто говорит по-русски и учит казахский, поэтому выбор языка интерфейса
 * только сбивал с толку. Казахский живёт в содержании уроков, а не в кнопках.
 */
export function getCharacterName(character: string): string {
  const names: Record<string, string> = {
    AUTO: 'Учитель',
    TEACHER: 'Учитель',
    AISHA: 'Айша',
    DIMA: 'Дима',
    GIRL: 'Айша',
    BOY: 'Дима',
  };
  return names[character.toUpperCase()] ?? 'Учитель';
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

/**
 * Кто говорит в реплике.
 *
 * У урока есть общее поле character, но реплики принадлежат разным людям:
 * урок может быть «за Диму», а первую фразу произносит учитель. Имя стоит
 * в начале самой реплики, поэтому берём его оттуда, а поле урока оставляем
 * как запасной вариант.
 */
const SPEAKERS: Record<string, 'teacher' | 'girl' | 'boy'> = {
  'мұғалім': 'teacher',
  'учитель': 'teacher',
  'айша': 'girl',
  'дима': 'boy',
};

export function speakerOf(dialogue: string, fallback: string): 'teacher' | 'girl' | 'boy' {
  const match = dialogue.trimStart().match(/^([^:\n]{2,20}):/);
  const name = match?.[1].trim().toLowerCase();
  return (name && SPEAKERS[name]) || getCharacterSvgName(fallback);
}

/** Имя говорящего для подписи под портретом. */
export function speakerName(dialogue: string, fallback: string): string {
  const svg = speakerOf(dialogue, fallback);
  return { teacher: 'Учитель', girl: 'Айша', boy: 'Дима' }[svg];
}

