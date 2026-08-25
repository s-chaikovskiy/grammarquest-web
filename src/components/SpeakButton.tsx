import { useEffect, useState } from 'react';
import { hasAudio, speak } from '../utils/speech';

/**
 * Кнопка «послушать».
 *
 * Показывается только тогда, когда запись действительно есть: пустая кнопка,
 * которая ничего не делает, хуже её отсутствия. Пока озвучка не записана,
 * интерфейс выглядит так, будто её и не задумывали.
 */
export default function SpeakButton({ text, label = 'Послушать' }: { text: string; label?: string }) {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let alive = true;
    hasAudio(text).then(ok => { if (alive) setReady(ok); });
    return () => { alive = false; };
  }, [text]);

  if (!ready) return null;

  const play = async () => {
    setPlaying(true);
    await speak(text);
    setTimeout(() => setPlaying(false), 600);
  };

  return (
    <button
      type="button"
      className={`speak${playing ? ' speak--playing' : ''}`}
      onClick={play}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  );
}
