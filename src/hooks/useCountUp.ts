import { useEffect, useRef, useState } from 'react';

/**
 * Плавный счёт от прежнего значения к новому.
 *
 * Числа, которые меняются скачком, глаз не замечает: только что было 40,
 * стало 50 — и непонятно, что вообще произошло. Пробег по промежуточным
 * значениям показывает само изменение, поэтому начисление XP становится
 * заметным событием.
 */
export function useCountUp(target: number, duration = 550): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const frame = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || from.current === target) {
      from.current = target;
      setValue(target);
      return;
    }

    const start = performance.now();
    const initial = from.current;
    const delta = target - initial;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Тот же ease-out, что и у остальной анимации, — движение единообразно.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(initial + delta * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else from.current = target;
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}
