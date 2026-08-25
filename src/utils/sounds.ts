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

export function playTransitionSound() {
  // Двойной тон для перехода - более мелодичный
  playTone(440, 0.1, 'sine', 0.15);
  setTimeout(() => playTone(554.37, 0.12, 'sine', 0.15), 80);
}

export function playLevelUpSound() {
  // Торжественный звук достижения уровня
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 100);
  });
}

export function playAchievementSound() {
  // Звук получения достижения
  const notes = [783.99, 1046.50, 1318.51, 1567.98]; // G5, C6, E6, G6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'triangle', 0.2), i * 120);
  });
}

export function playStreakSound() {
  // Звук серии дней
  playTone(880, 0.1, 'sine', 0.15);
  setTimeout(() => playTone(1108.73, 0.1, 'sine', 0.15), 100);
  setTimeout(() => playTone(1318.51, 0.15, 'sine', 0.2), 200);
}

// Улучшенная озвучка текста
let voicesCache: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesCache = voices;
  }
}

// Предзагрузка голосов
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function findBestVoice(lang: 'kk' | 'ru'): SpeechSynthesisVoice | null {
  const voices = voicesCache.length > 0 ? voicesCache : window.speechSynthesis.getVoices();
  
  // Приоритет голосов для казахского
  if (lang === 'kk') {
    // Ищем казахский женский голос
    const kkFemale = voices.find(v => 
      v.lang === 'kk-KZ' && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('айгерім') || v.name.toLowerCase().includes('айгуль'))
    );
    if (kkFemale) return kkFemale;
    
    // Любой казахский голос
    const kkVoice = voices.find(v => v.lang === 'kk-KZ');
    if (kkVoice) return kkVoice;
    
    // fallback на русский
    return findBestVoice('ru');
  }
  
  // Для русского
  const ruFemale = voices.find(v => 
    v.lang.startsWith('ru') && 
    (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('milena') || v.name.toLowerCase().includes('алена') || v.name.toLowerCase().includes('irina'))
  );
  if (ruFemale) return ruFemale;
  
  const ruVoice = voices.find(v => v.lang.startsWith('ru'));
  if (ruVoice) return ruVoice;
  
  // fallback на английский
  const enVoice = voices.find(v => v.lang.startsWith('en'));
  return enVoice || null;
}

export function speakText(text: string, lang: 'kk' | 'ru' = 'kk') {
  // Озвучка отключена
}

// Фоновая музыка
let bgMusic: HTMLAudioElement | null = null;
let bgMusicVolume = 0.15;

export function startBackgroundMusic() {
  if (typeof window === 'undefined') return;
  
  if (!bgMusic) {
    // Используем встроенную мелодию через Web Audio API
    playBackgroundMelody();
  }
}

export function stopBackgroundMusic() {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

export function setBackgroundMusicVolume(volume: number) {
  bgMusicVolume = Math.max(0, Math.min(1, volume));
  if (bgMusic) {
    bgMusic.volume = bgMusicVolume;
  }
}

// Простая фоновая мелодия через Web Audio API
let melodyInterval: number | null = null;

function playBackgroundMelody() {
  if (!getContext()) return;
  
  const notes = [
    { freq: 261.63, duration: 0.5 }, // C4
    { freq: 293.66, duration: 0.5 }, // D4
    { freq: 329.63, duration: 0.5 }, // E4
    { freq: 349.23, duration: 0.5 }, // F4
    { freq: 392.00, duration: 0.5 }, // G4
    { freq: 440.00, duration: 0.5 }, // A4
    { freq: 493.88, duration: 0.5 }, // B4
    { freq: 523.25, duration: 0.5 }, // C5
  ];
  
  let noteIndex = 0;
  
  melodyInterval = window.setInterval(() => {
    const note = notes[noteIndex % notes.length];
    playTone(note.freq, note.duration * 0.8, 'sine', bgMusicVolume * 0.3);
    noteIndex++;
  }, 800);
}

export function stopBackgroundMelody() {
  if (melodyInterval) {
    clearInterval(melodyInterval);
    melodyInterval = null;
  }
}