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
const ITEMS = (index as unknown as { items: [string, string][] }).items;

/** Текст → код записи. Строится один раз при загрузке модуля. */
const BY_TEXT = new Map<string, string>(
  ITEMS.map(([id, text]) => [normalize(text), id])
);

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Какие записи реально лежат в сборке — проверяется один раз, лениво. */
const available = new Map<string, boolean>();
let current: HTMLAudioElement | null = null;

export function audioIdFor(text: string): string | null {
  return BY_TEXT.get(normalize(text)) ?? null;
}

export function audioUrl(id: string): string {
  return `${import.meta.env.BASE_URL}audio/${id}.mp3`;
}

/**
 * Есть ли запись для этой фразы.
 * Первая проверка обращается к файлу, дальше ответ берётся из памяти.
 */
export async function hasAudio(text: string): Promise<boolean> {
  const id = audioIdFor(text);
  if (!id) return false;
  const known = available.get(id);
  if (known !== undefined) return known;
  try {
    const res = await fetch(audioUrl(id), { method: 'HEAD' });
    available.set(id, res.ok);
    return res.ok;
  } catch {
    available.set(id, false);
    return false;
  }
}

/** Проигрывает фразу. Возвращает false, если записи нет. */
export async function speak(text: string): Promise<boolean> {
  const id = audioIdFor(text);
  if (!id) return false;

  current?.pause();
  const audio = new Audio(audioUrl(id));
  current = audio;
  try {
    await audio.play();
    available.set(id, true);
    return true;
  } catch {
    // Файла нет или браузер не дал воспроизвести — тишина, но не ошибка.
    available.set(id, false);
    return false;
  }
}

export function stopSpeaking() {
  current?.pause();
  current = null;
}

/** Сколько фраз вообще предусмотрено к озвучке — для экрана статистики. */
export const TOTAL_PHRASES = ITEMS.length;
