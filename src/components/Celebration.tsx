import { useEffect, useRef, useState } from 'react';

/**
 * Праздничная сцена на экране итогов.
 *
 * Загружается по требованию и только там, где устройство её потянет.
 * Основное приложение от неё не тяжелеет: код шейдера уезжает отдельным
 * файлом и скачивается лишь в момент показа.
 *
 * Если сцена недоступна — ничего не ломается: под ней и без неё лежит
 * обычная карточка с результатом, сцена только добавляет фон.
 */
export function canRunScene(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  // Слабые устройства пропускаем: лучше вовсе без сцены, чем рывками.
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores <= 2 || memory <= 2) return false;

  // Проверяем не наличие WebGL2 в принципе, а возможность создать контекст:
  // на части машин он объявлен, но недоступен.
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Цвета сцены заданы жёстко и не берутся из темы.
 *
 * Панель победы намеренно выглядит одинаково в светлом и тёмном оформлении:
 * это отдельный момент, а не очередная карточка интерфейса. Золото по тёмному
 * читается всегда, и не нужно подгонять контраст под две темы сразу.
 */
const GOLD: [number, number, number] = [0.98, 0.80, 0.42];
const DEEP: [number, number, number] = [0.06, 0.09, 0.16];

export default function Celebration({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enabled] = useState(() => active && canRunScene());

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let stop: (() => void) | undefined;
    let cancelled = false;

    // Динамический импорт: шейдер скачивается только сейчас.
    import('../effects/shanyrak')
      .then(({ mountShanyrak }) => {
        if (cancelled || !canvasRef.current) return;
        stop = mountShanyrak(canvasRef.current, { gold: GOLD, deep: DEEP });
      })
      .catch(() => {
        // Не загрузилось — сцены просто не будет, экран остаётся рабочим.
      });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="celebration"
      aria-hidden="true"
    />
  );
}
