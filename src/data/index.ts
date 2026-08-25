import lessonsData from './lessons.json';
import type { LessonsData, ReferenceData, Rule } from '../types';

export const lessons = (lessonsData as LessonsData).lessons;

export function getLessonById(id: string) {
  return lessons.find(l => l.id === id);
}

export const totalSteps = lessons.reduce((sum, l) => sum + l.steps.length, 0);

/**
 * Правила и справочник грузятся отдельно, по требованию.
 *
 * Вместе эти два файла занимают около 250 КБ. Они нужны только на своих
 * экранах, и держать их в основном бандле значит заставлять телефон
 * скачивать справочник ради того, чтобы открыть первый урок.
 */
export async function loadRules(): Promise<Rule[]> {
  const module = await import('./rules.json');
  return module.default as Rule[];
}

export async function loadReference(): Promise<ReferenceData['topics']> {
  const module = await import('./reference.json');
  return (module.default as ReferenceData).topics;
}
