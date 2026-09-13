import type { Task } from '../types';

/**
 * Верен ли ответ.
 *
 * Засчитывается только точное совпадение набора: в задании «отметь все»
 * пропущенный верный вариант — такая же ошибка, как отмеченный лишний.
 * Иначе ученик, отметивший всё подряд, получал бы «верно».
 */
export function isCorrect(task: Task, picked: string[]): boolean {
  const want = new Set(task.answers);
  const got = new Set(picked);
  return want.size === got.size && [...want].every(a => got.has(a));
}
