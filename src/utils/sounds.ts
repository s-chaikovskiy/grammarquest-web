/**
 * Звуковая обратная связь на Web Audio API.
 *
 * Контекст создаётся лениво, при первом звуке: браузеры (особенно Safari
 * на iOS) не дают запустить AudioContext до действия пользователя, а
 * создание его на старте модуля оставляло контекст в состоянии suspended.
 */
let ctx: AudioContext | null = null;
let enabled = true;

/** Переключатель из настроек: беззвучный режим не должен ничего запускать. */
export function setSoundEnabled(value: boolean) {
  enabled = value;
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;

  const oscillator = audio.createOscillator();
  const gainNode = audio.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audio.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, audio.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + duration);

  oscillator.start(audio.currentTime);
  oscillator.stop(audio.currentTime + duration);
}

export function playCorrectSound() {
  // Приятная восходящая арпеджио - более музыкальная
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 80);
  });
}

export function playWrongSound() {
  // Мягкий нисходящий тон - не резкий
  playTone(350, 0.25, 'sine', 0.15);
  setTimeout(() => playTone(280, 0.35, 'sine', 0.12), 150);
}

export function playClickSound() {
  // Короткий приятный щелчок
  playTone(1200, 0.03, 'sine', 0.1);
}

/*
 * Что отсюда убрано и почему.
 *
 * Здесь жил браузерный синтез речи с подбором голоса и откатом на русский,
 * если казахского нет. Казахского в системе нет практически никогда, поэтому
 * такой откат читал бы казахский текст чужим языком — это учит неправильному
 * произношению. Озвучка работает только на записях: src/utils/speech.ts.
 *
 * Ещё здесь была фоновая мелодия на вечном setInterval. Её никто не включал,
 * а восемь нот по кругу в приложении для учёбы мешают, а не помогают.
 *
 * И четыре звука (переход, новый уровень, достижение, серия), которые ни один
 * экран не вызывал. Мёртвый код — это то, из-за чего прежняя версия
 * расходилась с собственным описанием.
 */
