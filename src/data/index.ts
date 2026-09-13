import lessonsData from './lessons.json';
import type { Lesson, LessonsData } from '../types';

/** Темы в порядке листочка учителя — так их выстраивает сборка содержания. */
export const lessons = (lessonsData as unknown as LessonsData).lessons;

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find(l => l.id === id);
}

export function totalSteps(): number {
  return lessons.reduce((sum, l) => sum + l.steps.length, 0);
}
