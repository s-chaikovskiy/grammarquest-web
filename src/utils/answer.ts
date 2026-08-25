/**
 * Движок проверки ответов GrammarQuest.
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

/** Сколько опечаток прощаем: чем длиннее ответ, тем больше. */
function typoBudget(len: number): number {
  if (len <= 4) return 0;
  if (len <= 8) return 1;
  if (len <= 20) return 2;
  return 3;
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

  // Слой 3 — опечатки поверх свёртки.
  let best: { dist: number; variant: string } | null = null;
  for (const v of variants) {
    const target = foldKazakh(normalizeAnswer(v));
    const budget = typoBudget(target.length);
    if (budget === 0) continue;
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
