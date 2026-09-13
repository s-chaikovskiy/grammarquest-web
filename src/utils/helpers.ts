/**
 * Согласование существительного с числом по-русски:
 * 1 задание, 2 задания, 5 заданий.
 *
 * Без этого интерфейс выдаёт «1 заданий» — мелочь, которая сразу читается
 * как машинный перевод.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
