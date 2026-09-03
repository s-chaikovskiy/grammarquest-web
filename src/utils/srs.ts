/**
 * Интервальное повторение (SM-2 в упрощённом виде).
 *
 * Каждый шаг урока — карточка. После ответа карточка получает дату следующего
 * показа: чем увереннее ответ, тем дальше срок. Ошибка возвращает карточку
 * в сегодняшнюю очередь. Это то, чего не хватало экрану «Повторение»:
 * раньше он показывал пройденное подряд, без учёта того, что ученик забывает.
 */
import type { Verdict } from './answer';

export interface Card {
  id: string;          // `${lessonId}:${stepIndex}`
  lessonId: string;
  stepIndex: number;
  ease: number;        // коэффициент лёгкости, 1.3…2.8
  interval: number;    // текущий интервал в днях
  due: string;         // ISO-дата следующего показа
  reps: number;        // сколько раз подряд отвечено верно
  lapses: number;      // сколько раз забыто
  lastVerdict: Verdict;
}

const DAY = 86_400_000;

export function todayISO(now = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function addDays(days: number, now = new Date()): string {
  return todayISO(new Date(now.getTime() + days * DAY));
}

/**
 * `now` принимается, как и во всех остальных функциях модуля.
 *
 * Раньше эта одна читала системные часы напрямую, и тест, закреплённый
 * на конкретной дате, разъезжался с ней на следующий же день: карточка
 * получала сегодняшнее число, а очередь фильтровалась по дате из теста.
 * Проверка молча ломалась не от изменения кода, а от смены суток.
 */
export function newCard(lessonId: string, stepIndex: number, now = new Date()): Card {
  return {
    id: `${lessonId}:${stepIndex}`,
    lessonId,
    stepIndex,
    ease: 2.5,
    interval: 0,
    due: todayISO(now),
    reps: 0,
    lapses: 0,
    lastVerdict: 'wrong',
  };
}

/** Вердикт проверки → оценка 0…5, как в SM-2. */
export function verdictQuality(verdict: Verdict): number {
  switch (verdict) {
    case 'correct': return 5;
    case 'correct_kz': return 4;   // грамматика верна, написание — нет
    case 'almost': return 3;
    default: return 0;
  }
}

export function reviewCard(card: Card, verdict: Verdict, now = new Date()): Card {
  const q = verdictQuality(verdict);
  const next = { ...card, lastVerdict: verdict };

  if (q < 3) {
    // Забыл — карточка возвращается в сегодняшнюю очередь, лёгкость падает.
    next.reps = 0;
    next.lapses = card.lapses + 1;
    next.interval = 0;
    next.ease = Math.max(1.3, card.ease - 0.2);
    next.due = todayISO(now);
    return next;
  }

  next.reps = card.reps + 1;
  next.ease = Math.min(2.8, Math.max(1.3,
    card.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (next.reps === 1) next.interval = 1;
  else if (next.reps === 2) next.interval = 3;
  else next.interval = Math.round(card.interval * next.ease);

  next.interval = Math.min(next.interval, 180);
  next.due = addDays(next.interval, now);
  return next;
}

export function isDue(card: Card, now = new Date()): boolean {
  return card.due <= todayISO(now);
}

/**
 * Очередь на повторение: сначала то, что забывалось чаще и просрочено дольше.
 */
export function dueQueue(cards: Record<string, Card>, now = new Date(), limit = 20): Card[] {
  const today = todayISO(now);
  return Object.values(cards)
    .filter(c => c.due <= today)
    .sort((a, b) => {
      if (a.lapses !== b.lapses) return b.lapses - a.lapses;
      if (a.due !== b.due) return a.due < b.due ? -1 : 1;
      return a.ease - b.ease;
    })
    .slice(0, limit);
}

/** Сколько карточек станет доступно в ближайшие дни — для календаря на экране. */
export function forecast(cards: Record<string, Card>, days = 7, now = new Date()): number[] {
  const out = Array(days).fill(0);
  const base = todayISO(now);
  for (const c of Object.values(cards)) {
    if (c.due <= base) { out[0]++; continue; }
    const diff = Math.round((new Date(c.due).getTime() - new Date(base).getTime()) / DAY);
    if (diff >= 0 && diff < days) out[diff]++;
  }
  return out;
}
