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

/**
 * Кто сейчас говорит — и говорит ли вообще.
 *
 * Нужно персонажам: учитель должен шевелиться ровно столько, сколько звучит
 * его реплика. Хранить это в состоянии приложения незачем — звук живёт
 * доли секунды и к прогрессу отношения не имеет, поэтому здесь простая
 * подписка вместо ещё одного поля в localStorage.
 */
type SpeechListener = (speakingId: string | null) => void;
const listeners = new Set<SpeechListener>();
let speakingId: string | null = null;

function setSpeaking(id: string | null): void {
  if (speakingId === id) return;
  speakingId = id;
  for (const cb of listeners) cb(id);
}

/** Подписка на «сейчас звучит реплика». Возвращает функцию отписки. */
export function onSpeaking(cb: SpeechListener): () => void {
  listeners.add(cb);
  cb(speakingId);
  return () => { listeners.delete(cb); };
}

/** Звучит ли прямо сейчас именно эта фраза. */
export function isSpeaking(text: string): boolean {
  const id = audioIdFor(text);
  return id !== null && id === speakingId;
}

function audioIdFor(text: string): string | null {
  return BY_TEXT.get(normalize(text)) ?? null;
}

function audioUrl(id: string): string {
  return `${import.meta.env.BASE_URL}audio/${id}.mp3`;
}

/**
 * Запись сначала скачивается, и только потом играет.
 *
 * Казалось бы, лишний шаг: можно отдать адрес прямо в Audio. Но тег media
 * просит файл кусками — с заголовком Range, — и сервер отвечает «206,
 * частичное содержимое». Service worker такие ответы не кэширует и правильно
 * делает: в кэш попал бы обрывок. Из-за этого озвучка не сохранялась совсем,
 * и обещание «работает без интернета» на звук не распространялось.
 *
 * Обычный fetch получает честные 200 и полный файл: он и оседает в кэше,
 * а играем мы уже из памяти. Файлы по 20–40 КБ, задержки на слух нет.
 */
const BLOBS = new Map<string, string>();
const BLOB_LIMIT = 24;

async function playableUrl(id: string): Promise<string> {
  const ready = BLOBS.get(id);
  if (ready) return ready;
  try {
    const resp = await fetch(audioUrl(id));
    if (!resp.ok) return audioUrl(id);
    const url = URL.createObjectURL(await resp.blob());
    // Ссылки на blob держат файл в памяти, пока их не отозвать.
    // Двух десятков хватает на занятие, а память не растёт весь сеанс.
    if (BLOBS.size >= BLOB_LIMIT) {
      const oldest = BLOBS.keys().next().value;
      if (oldest) { URL.revokeObjectURL(BLOBS.get(oldest)!); BLOBS.delete(oldest); }
    }
    BLOBS.set(id, url);
    return url;
  } catch {
    // Сети нет и в кэше пусто — пробуем обычный адрес, вдруг повезёт.
    return audioUrl(id);
  }
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
  const audio = new Audio(await playableUrl(id));
  current = audio;

  // Снимаем признак «говорит» только если с тех пор не начали другую реплику:
  // иначе быстрое переключение между фразами гасило бы анимацию новой.
  const done = () => { if (current === audio) setSpeaking(null); };
  audio.addEventListener('ended', done);
  audio.addEventListener('error', done);
  audio.addEventListener('pause', done);

  try {
    await audio.play();
    setSpeaking(id);
    return true;
  } catch {
    // Браузер не дал воспроизвести — тишина, но не ошибка.
    done();
    return false;
  }
}

/** Останавливает воспроизведение: при уходе с экрана звук не должен продолжаться. */
export function stopSpeaking(): void {
  current?.pause();
  current = null;
  setSpeaking(null);
}

/*
 * Наружу торчит ровно то, что вызывается: «есть ли запись», «проиграть»,
 * «остановить» и подписка на состояние речи. Экспорт, который никто
 * не вызывает, со временем начинает выглядеть как обещанная возможность:
 * именно так прежняя версия и разошлась с собственным описанием.
 */
