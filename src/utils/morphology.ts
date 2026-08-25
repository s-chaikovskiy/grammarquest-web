/**
 * Казахская морфология: склонение существительных и спряжение глаголов.
 *
 * Окончание в казахском выбирается по двум признакам сразу:
 *   1. Сингармонизм — последняя гласная основы задаёт твёрдый или мягкий ряд.
 *   2. Последний звук основы — гласный, звонкий, сонорный или глухой.
 *
 * Правила покрывают регулярные случаи школьной программы. Исключения и
 * заимствования встречаются, поэтому в интерфейсе таблица подписана как
 * построенная по правилу, а не как словарная.
 */

const BACK_VOWELS = new Set('аоыұуя');      // жуан дауыстылар
const FRONT_VOWELS = new Set('әөіүеиё');    // жіңішке дауыстылар
const VOWELS = new Set([...BACK_VOWELS, ...FRONT_VOWELS]);

/** Қатаң — глухие. */
const VOICELESS = new Set('кқпстфхһцчшщ');
/** Ұяң — звонкие шумные. */
const VOICED = new Set('бвгғджз');
/** Үнді — сонорные. */
const SONORANT = new Set('лмнңрйу');
/** Носовые ведут себя иначе, чем остальные сонорные, — им нужен отдельный набор. */
const NASAL = new Set('мнң');

export type SoundClass = 'vowel' | 'nasal' | 'sonorant' | 'voiced' | 'voiceless';

export function isBack(word: string): boolean {
  for (const ch of [...word.toLowerCase()].reverse()) {
    if (BACK_VOWELS.has(ch)) return true;
    if (FRONT_VOWELS.has(ch)) return false;
  }
  return true;
}

export function lastSound(word: string): SoundClass {
  const ch = word.toLowerCase().trim().slice(-1);
  if (VOWELS.has(ch)) return 'vowel';
  if (NASAL.has(ch)) return 'nasal';
  if (SONORANT.has(ch)) return 'sonorant';
  if (VOICED.has(ch)) return 'voiced';
  if (VOICELESS.has(ch)) return 'voiceless';
  return 'vowel';
}

/** Пара «твёрдый / мягкий»: выбор делает сингармонизм. */
type Pair = [back: string, front: string];

function pick(pair: Pair, word: string): string {
  return isBack(word) ? pair[0] : pair[1];
}

/**
 * Озвончение конечного согласного перед гласным окончанием.
 *
 * «кітап» + «ым» даёт «кітабым», а не «кітапым»: конечные қ, к, п между
 * гласными переходят в ғ, г, б. Правило срабатывает только для окончаний,
 * начинающихся с гласной, — у падежных окончаний такого не происходит.
 */
const VOICING: Record<string, string> = { 'қ': 'ғ', 'к': 'г', 'п': 'б' };

export function joinWithVoicing(stem: string, suffix: string): string {
  if (!suffix || !VOWELS.has(suffix[0])) return stem + suffix;
  const last = stem.slice(-1);
  const voiced = VOICING[last];
  return voiced ? stem.slice(0, -1) + voiced + suffix : stem + suffix;
}

export interface CaseForm {
  id: string;
  nameKz: string;
  nameRu: string;
  question: string;
  suffix: string;
  form: string;
}

/**
 * Семь септіктер.
 * Для каждого падежа задан выбор окончания по классу последнего звука.
 */
export function declension(rawWord: string): CaseForm[] {
  const word = rawWord.trim();
  if (!word) return [];
  const cls = lastSound(word);

  const byClass = (map: Partial<Record<SoundClass, Pair>>, fallback: Pair): string =>
    pick(map[cls] ?? fallback, word);

  const ilik = byClass(
    { vowel: ['ның', 'нің'], nasal: ['ның', 'нің'], sonorant: ['дың', 'дің'], voiced: ['дың', 'дің'] },
    ['тың', 'тің']
  );
  const barys = byClass(
    { vowel: ['ға', 'ге'], nasal: ['ға', 'ге'], sonorant: ['ға', 'ге'], voiced: ['ға', 'ге'] },
    ['қа', 'ке']
  );
  const tabys = byClass(
    { vowel: ['ны', 'ні'], nasal: ['ды', 'ді'], sonorant: ['ды', 'ді'], voiced: ['ды', 'ді'] },
    ['ты', 'ті']
  );
  const jatys = byClass(
    { vowel: ['да', 'де'], nasal: ['да', 'де'], sonorant: ['да', 'де'], voiced: ['да', 'де'] },
    ['та', 'те']
  );
  const shygys = byClass(
    { vowel: ['дан', 'ден'], nasal: ['нан', 'нен'], sonorant: ['дан', 'ден'], voiced: ['дан', 'ден'] },
    ['тан', 'тен']
  );
  // Көмектес не подчиняется сингармонизму — только озвончению.
  const komektes =
    cls === 'voiceless' ? 'пен' : cls === 'voiced' ? 'бен' : 'мен';

  const rows: [string, string, string, string, string][] = [
    ['atau', 'Атау септік', 'Именительный', 'кім? не?', ''],
    ['ilik', 'Ілік септік', 'Родительный', 'кімнің? ненің?', ilik],
    ['barys', 'Барыс септік', 'Дательный', 'кімге? неге? қайда?', barys],
    ['tabys', 'Табыс септік', 'Винительный', 'кімді? нені?', tabys],
    ['jatys', 'Жатыс септік', 'Местный', 'кімде? неде? қайда?', jatys],
    ['shygys', 'Шығыс септік', 'Исходный', 'кімнен? неден? қайдан?', shygys],
    ['komektes', 'Көмектес септік', 'Творительный', 'кіммен? немен?', komektes],
  ];

  return rows.map(([id, nameKz, nameRu, question, suffix]) => ({
    id, nameKz, nameRu, question, suffix,
    form: word + suffix,
  }));
}

export interface PersonForm {
  id: string;
  pronoun: string;
  pronounRu: string;
  suffix: string;
  form: string;
}

/** Тәуелдік жалғау — чьё это. */
export function possessive(rawWord: string): PersonForm[] {
  const word = rawWord.trim();
  if (!word) return [];
  const vowelEnding = lastSound(word) === 'vowel';

  const rows: [string, string, string, Pair, Pair][] = [
    ['my',     'менің',  'мой',   ['ым', 'ім'],       ['м', 'м']],
    ['your',   'сенің',  'твой',  ['ың', 'ің'],       ['ң', 'ң']],
    ['yourF',  'сіздің', 'ваш',   ['ыңыз', 'іңіз'],   ['ңыз', 'ңіз']],
    ['his',    'оның',   'его',   ['ы', 'і'],         ['сы', 'сі']],
    ['our',    'біздің', 'наш',   ['ымыз', 'іміз'],   ['мыз', 'міз']],
  ];

  return rows.map(([id, pronoun, pronounRu, afterConsonant, afterVowel]) => {
    const suffix = pick(vowelEnding ? afterVowel : afterConsonant, word);
    return { id, pronoun, pronounRu, suffix, form: joinWithVoicing(word, suffix) };
  });
}

/**
 * Основа настоящего-будущего времени.
 *
 * Ждём именно основу глагола («жаз», «кел», «оқы»), а не инфинитив на -у:
 * по инфинитиву основу однозначно не восстановить — «жазу» даёт «жаз»,
 * но «оқу» даёт «оқы», а не «оқ». В интерфейсе это сказано прямо.
 */
export function presentBase(stem: string): string {
  const last = stem.slice(-1);
  // «оқы» + «й» превращается в «оқи»: сочетание ы/і с «й» даёт «и».
  if (last === 'ы' || last === 'і') return stem.slice(0, -1) + 'и';
  if (lastSound(stem) === 'vowel') return stem + 'й';
  return stem + pick(['а', 'е'], stem);
}

/**
 * Ауыспалы осы шақ — настоящее-будущее время.
 * Основа получает соединительный гласный, затем личное окончание.
 */
export function presentTense(rawStem: string): PersonForm[] {
  const stem = rawStem.trim().toLowerCase();
  if (!stem) return [];
  const base = presentBase(stem);

  const rows: [string, string, string, Pair][] = [
    ['i',       'мен',     'я',      ['мын', 'мін']],
    ['you',     'сен',     'ты',     ['сың', 'сің']],
    ['youF',    'сіз',     'вы',     ['сыз', 'сіз']],
    ['he',      'ол',      'он',     ['ды', 'ді']],
    ['we',      'біз',     'мы',     ['мыз', 'міз']],
    ['youPl',   'сендер',  'вы',     ['сыңдар', 'сіңдер']],
    ['they',    'олар',    'они',    ['ды', 'ді']],
  ];

  return rows.map(([id, pronoun, pronounRu, pair]) => {
    // Ряд определяет исходная основа, а не преобразованная: «оқы» → «оқи»,
    // и по букве «и» ряд восстановить нельзя — она нейтральна.
    const suffix = pick(pair, stem);
    return { id, pronoun, pronounRu, suffix, form: base + suffix };
  });
}

/** Жедел өткен шақ — прошедшее время. */
export function pastTense(rawStem: string): PersonForm[] {
  const stem = rawStem.trim().toLowerCase();
  if (!stem) return [];

  const cls = lastSound(stem);
  const marker = cls === 'voiceless' ? pick(['ты', 'ті'], stem) : pick(['ды', 'ді'], stem);
  const base = stem + marker;

  const rows: [string, string, string, Pair][] = [
    ['i',     'мен',    'я',    ['м', 'м']],
    ['you',   'сен',    'ты',   ['ң', 'ң']],
    ['youF',  'сіз',    'вы',   ['ңыз', 'ңіз']],
    ['he',    'ол',     'он',   ['', '']],
    ['we',    'біз',    'мы',   ['қ', 'к']],
    ['youPl', 'сендер', 'вы',   ['ңдар', 'ңдер']],
    ['they',  'олар',   'они',  ['', '']],
  ];

  return rows.map(([id, pronoun, pronounRu, pair]) => {
    const suffix = pick(pair, stem);
    return { id, pronoun, pronounRu, suffix, form: base + suffix };
  });
}

/**
 * Көптік жалғау — множественное число.
 *
 * Здесь сонорные расходятся: после р, й, у ставится -лар/-лер
 * («дәптерлер», «таулар»), а после л, м, н, ң — -дар/-дер
 * («жылдар», «адамдар», «күндер»). Общего правила «все сонорные одинаково»
 * нет, поэтому набор задан отдельно.
 */
export function plural(rawWord: string): { suffix: string; form: string } {
  const word = rawWord.trim();
  if (!word) return { suffix: '', form: '' };
  const ch = word.toLowerCase().slice(-1);
  const cls = lastSound(word);

  const suffix =
    cls === 'voiceless' ? pick(['тар', 'тер'], word)
    : cls === 'vowel' || 'рйу'.includes(ch) ? pick(['лар', 'лер'], word)
    : pick(['дар', 'дер'], word);

  return { suffix, form: word + suffix };
}
