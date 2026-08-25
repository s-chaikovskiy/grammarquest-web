import { useEffect, useRef } from 'react';

/**
 * Лёгкий наклон элемента вслед за курсором.
 *
 * Даёт ощущение объёма, ради которого обычно тянут WebGL, — но это обычный
 * CSS-трансформ и два числа в переменных. Ни библиотеки, ни отрисовки кадров.
 *
 * На сенсорных экранах не включается: там нет наведения, а дёргать элемент
 * под пальцем незачем. Отключается и при prefers-reduced-motion.
 */
export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || calm) return;

    let frame = 0;

    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        // Координаты от -1 до 1 относительно центра элемента.
        el.style.setProperty('--tx', String(((e.clientX - r.left) / r.width - 0.5) * 2));
        el.style.setProperty('--ty', String(((e.clientY - r.top) / r.height - 0.5) * 2));
      });
    };

    const leave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--tx', '0');
      el.style.setProperty('--ty', '0');
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return ref;
}
