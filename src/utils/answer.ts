/**
 * Движок проверки ответов «Тілашар».
 *
 * Задача, которую он решает: у школьника на клавиатуре русская раскладка,
 * а 166 из 187 правильных ответов содержат буквы ә ө ұ ү қ ғ ң і һ.
 * Строгое сравнение строк засчитывало бы «окып жатырмын» как ошибку,
 * хотя грамматически ученик ответил верно. Поэтому проверка многослойная:
 * сначала точное совпадение, потом свёртка казахских букв к русским,
 * потом расстояние Левенштейна для опечаток.
 */

export type Verdict =
  | 'correct'        // точное совпадение
  | 'correct_kz'     // верно по грамматике, но написано без казахских букв
  | 'almost'         // опечатка в 1–2 символах: засчитываем, показываем эталон
  | 'wrong';

export interface CheckResult {
  verdict: Verdict;
  /** Вариант эталона, к которому ответ оказался ближе всего. */
  matched: string;
  /** true, если ответ принят (correct | correct_kz | almost). */
  accepted: boolean;
  /** Подсказка для показа ученику, когда написание отличается от эталона. */
  note?: string;
}

/** Казахские буквы → ближайшие русские. Ученик без каз. раскладки печатает правый столбец. */
const KZ_FOLD: Record<string, string> = {
  'ә': 'а', 'ғ': 'г', 'қ': 'к', 'ң': 'н',
  'ө': 'о', 'ұ': 'у', 'ү': 'у', 'һ': 'х', 'і': 'и',
};

const KZ_LETTERS = Object.keys(KZ_FOLD);

/** Базовая нормализация: регистр, пунктуация, кавычки, кратные пробелы. */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'`]/g, '')
    .replace(/[.,!?;:—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Свёртка казахских букв к русским — снимает проблему раскладки. */
export function foldKazakh(text: string): string {
  let out = '';
  for (const ch of text) out += KZ_FOLD[ch] ?? ch;
  return out;
}

/** Убирает пояснения в скобках: «Толық емес (процесс)» → «Толық емес». */
function stripParens(text: string): string {
  return text.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Разбирает эталон на допустимые варианты.
 * Разделитель — только «/»: слово «немесе» встречается внутри самих ответов.
 */
export function answerVariants(correct: string): string[] {
  const parts = correct.split('/').map(p => p.trim()).filter(Boolean);
  const out = new Set<string>();
  for (const p of parts) {
    out.add(p);
    const bare = stripParens(p);
    if (bare && bare !== p) out.add(bare);
  }
  return [...out];
}

/** Расстояние Левенштейна с ранним выходом по лимиту. */
export function levenshtein(a: string, b: string, limit = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limit) return limit + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > limit) return limit + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Сколько опечаток прощаем.
 *
 * Ровно одну, и только в ответах длиннее четырёх символов.
 *
 * Соблазн прощать больше на длинных фразах здесь опасен: казахский
 * агглютинативен, и грамматика живёт в окончаниях. Два символа — это уже
 * целая морфема: «жатырсың» вместо «жатырмын» отличается двумя буквами,
 * но это «ты читаешь» вместо «я читаю». Допуск в два символа означал бы,
 * что приложение хвалит за перепутанное лицо.
 *
 * Одна буква — честная граница: столько стоит промах по клавише, но не
 * смена формы.
 */
function typoBudget(len: number): number {
  return len <= 4 ? 0 : 1;
}

export function checkAnswerDetailed(userAnswer: string, correct: string): CheckResult {
  const user = normalizeAnswer(userAnswer);
  const variants = answerVariants(correct);

  if (!user) return { verdict: 'wrong', matched: variants[0] ?? correct, accepted: false };

  // Слой 1 — точное совпадение с любым из вариантов.
  for (const v of variants) {
    if (user === normalizeAnswer(v)) {
      return { verdict: 'correct', matched: v, accepted: true };
    }
  }

  // Слой 2 — совпадение после свёртки казахских букв (проблема раскладки).
  const userFolded = foldKazakh(user);
  for (const v of variants) {
    const vNorm = normalizeAnswer(v);
    if (userFolded === foldKazakh(vNorm)) {
      const missing = [...new Set([...vNorm].filter(c => KZ_LETTERS.includes(c)))];
      return {
        verdict: 'correct_kz',
        matched: v,
        accepted: true,
        note: missing.length
          ? `Грамматика верна. В казахском написании: ${missing.join(', ')} — «${v}»`
          : undefined,
      };
    }
  }

  /*
   * Слой 3 — опечатки.
   *
   * Прощаем только пропущенную или лишнюю букву, то есть случаи, когда длина
   * ответа не совпала с эталоном. Замена буквы при той же длине опиской не
   * считается: в казахском это, как правило, другая форма.
   *
   * Различие принципиальное. «жатырмн» вместо «жатырмын» — палец не дожал
   * клавишу. «жатырсың» вместо «жатырмын» — «ты читаешь» вместо «я читаю»,
   * и после свёртки казахских букв эти две формы расходятся ровно на один
   * символ, как и описка. Отличить их можно только по тому, потерялась буква
   * или подменилась.
   */
  let best: { dist: number; variant: string } | null = null;
  for (const v of variants) {
    const target = foldKazakh(normalizeAnswer(v));
    const budget = typoBudget(target.length);
    if (budget === 0) continue;
    if (userFolded.length === target.length) continue;   // замена, а не описка
    const dist = levenshtein(userFolded, target, budget);
    if (dist <= budget && (!best || dist < best.dist)) best = { dist, variant: v };
  }
  if (best) {
    return {
      verdict: 'almost',
      matched: best.variant,
      accepted: true,
      note: `Почти точно — верное написание: «${best.variant}»`,
    };
  }

  return { verdict: 'wrong', matched: variants[0] ?? correct, accepted: false };
}

/** Совместимость со старым кодом: булев ответ. */
export function checkAnswer(userAnswer: string, correct: string): boolean {
  return checkAnswerDetailed(userAnswer, correct).accepted;
}

/**
 * Оценка развёрнутого ответа на открытый вопрос: доля ключевых слов эталона,
 * встретившихся у ученика. Используется как подсказка при самопроверке.
 */
export function openAnswerOverlap(userAnswer: string, correct: string): number {
  const words = (s: string) =>
    new Set(foldKazakh(normalizeAnswer(s)).split(' ').filter(w => w.length > 3));
  const target = words(correct);
  if (!target.size) return 0;
  const user = words(userAnswer);
  let hit = 0;
  for (const w of target) if (user.has(w)) hit++;
  return hit / target.size;
}

/**
 * Проверка задания с пропуском.
 *
 * Ученик не обязан угадывать, чего от него хотят: вписать только пропущенную
 * часть, дописать окончание или набрать предложение целиком. В самих уроках
 * это устроено по-разному — где-то эталон «оқыдым», где-то «Менің атым — Дима»,
 * где-то только суффикс. Требовать одного варианта значило бы наказывать за
 * верно понятую грамматику.
 *
 * Поэтому собираем разумные прочтения ввода и сравниваем их и с самим
 * эталоном, и с собранным по эталону предложением. Принимаем лучшее
 * совпадение из подошедших.
 */
export function checkBlank(userAnswer: string, correct: string, sentence: string): CheckResult {
  const raw = userAnswer.trim();
  const miss: CheckResult = { verdict: 'wrong', matched: correct, accepted: false };
  if (!raw) return miss;

  const SLOT = /\.\.\.|…/;
  if (!SLOT.test(sentence)) return checkAnswerDetailed(raw, correct);

  const at = sentence.search(SLOT);
  const before = sentence.slice(0, at);
  // Пробел перед пропуском означает отдельное слово, его отсутствие —
  // дописывание окончания к предыдущему.
  const attached = at > 0 && before.slice(-1) !== ' ';

  const fill = (value: string) => sentence.replace(SLOT, value);

  /**
   * Эталонное предложение целиком. Если эталон уже содержит начало
   * предложения — как «Менің атым — Дима» при пропуске «Менің атым — ...» —
   * подставлять его ещё раз нельзя, иначе начало удвоится.
   */
  const stem = normalizeAnswer(before);
  const full = stem && normalizeAnswer(correct).startsWith(stem) ? correct : fill(correct);

  // Что мог иметь в виду ученик: только пропущенная часть либо собранное
  // вокруг неё предложение. Второе помечаем — к нему другие требования.
  const readings: [text: string, assembled: boolean][] = [
    [raw, false],
    [fill(raw), true],
    [attached ? fill(raw) : `${before}${raw}`, true],
  ];
  const targets = [correct, full];

  const rank: Record<Verdict, number> = { correct: 3, correct_kz: 2, almost: 1, wrong: 0 };
  let best: CheckResult | null = null;

  for (const [reading, assembled] of readings) {
    for (const target of targets) {
      const res = checkAnswerDetailed(reading, target);
      if (!res.accepted) continue;

      /*
       * Опечатки прощаются только при прямом сравнении с эталоном, где допуск
       * рассчитан по длине самого ответа. В собранном предложении почти весь
       * текст дан заранее, и допуск, посчитанный по его длине, начинает
       * покрывать целую морфему: «атың» вместо «атым» — это другое лицо,
       * а не описка, но отличается оно одной буквой в семнадцати.
       */
      if (assembled && res.verdict === 'almost') continue;

      if (!best || rank[res.verdict] > rank[best.verdict]) {
        best = { ...res, matched: correct };
      }
    }
  }

  // То же ограничение для прямого сравнения с собранным эталоном.
  if (best?.verdict === 'almost' && normalizeAnswer(raw).length > normalizeAnswer(correct).length + 2) {
    return miss;
  }

  return best ?? miss;
}
