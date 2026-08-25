import index from '../data/audio-index.json';

/**
 * Озвучка казахских фраз.
 *
 * Записи лежат отдельными файлами в public/audio и подтягиваются по коду
 * фразы. Приложение не обязано иметь их все: если записи нет, кнопка
 * просто не показывается — звук здесь дополнение, а не условие работы.
 *
 * Встроенный в браузер синтез намеренно не используется: казахских голосов
 * в системе, как правило, нет вовсе, и вместо казахской речи получается
 * текст, прочитанный чужим языком.
 */

/**
 * В сборку попадает только пара «код — текст»: переводы и пометки типа
 * нужны скриптам записи, но не браузеру, а весят втрое больше.
 */
const DATA = index as unknown as { items: [string, string][]; available?: string[] };
const ITEMS = DATA.items;

/**
 * Какие записи действительно лежат в сборке.
 *
 * Список составляется при сборке содержания, а не выясняется по сети.
 * Раньше приложение спрашивало сам файл: пока записей нет, каждая фраза
 * на экране порождала запрос, который заканчивался ошибкой. Обещание
 * «работает без интернета и не ходит в сеть» переставало быть правдой,
 * а на слабой связи экран ещё и подтормаживал.
 *
 * Список обновляется командой `npm run data`. Положили записи в
 * public/audio — прогоните её, иначе приложение о них не узнает.
 */
const AVAILABLE = new Set(DATA.available ?? []);

/** Текст → код записи. Строится один раз при загрузке модуля. */
const BY_TEXT = new Map<string, string>(
  ITEMS.map(([id, text]) => [normalize(text), id])
);

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

let current: HTMLAudioElement | null = null;

export function audioIdFor(text: string): string | null {
  return BY_TEXT.get(normalize(text)) ?? null;
}

export function audioUrl(id: string): string {
  return `${import.meta.env.BASE_URL}audio/${id}.mp3`;
}

/** Есть ли запись для этой фразы. Ответ известен заранее, в сеть не ходим. */
export function hasAudio(text: string): boolean {
  const id = audioIdFor(text);
  return id !== null && AVAILABLE.has(id);
}

/** Проигрывает фразу. Возвращает false, если записи нет. */
export async function speak(text: string): Promise<boolean> {
  const id = audioIdFor(text);
  if (!id || !AVAILABLE.has(id)) return false;

  current?.pause();
  const audio = new Audio(audioUrl(id));
  current = audio;
  try {
    await audio.play();
    return true;
  } catch {
    // Браузер не дал воспроизвести — тишина, но не ошибка.
    return false;
  }
}

export function stopSpeaking() {
  current?.pause();
  current = null;
}

/** Сколько фраз вообще предусмотрено к озвучке — для экрана статистики. */
export const TOTAL_PHRASES = ITEMS.length;

/** Сколько из них уже записано. */
export const RECORDED_PHRASES = AVAILABLE.size;
