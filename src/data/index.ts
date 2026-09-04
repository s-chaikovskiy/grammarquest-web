import lessonsData from './lessons.json';
import vocabularyData from './vocabulary.json';
import type { LessonsData, ReferenceData, Rule, VocabularyData, Lesson, LevelInfo, ReferenceTopic } from '../types';

export const lessons = (lessonsData as unknown as LessonsData).lessons;
export const levels = (lessonsData as unknown as LessonsData).levels;
export const vocabulary = (vocabularyData as unknown as VocabularyData).words;

/**
 * Правила и справочник грузятся по требованию: вместе они весят около 240 КБ,
 * а нужны только на своих экранах. Держать их в основном бандле — значит
 * задерживать первый урок ради текста, который большинство откроет позже.
 */
export async function loadRules(): Promise<Rule[]> {
  return (await import('./rules.json')).default as Rule[];
}

export async function loadReference(): Promise<ReferenceTopic[]> {
  const mod = await import('./reference.json');
  return (mod.default as unknown as ReferenceData).topics;
}

export const LEVEL_IDS = [1, 2, 3] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find(l => l.id === id);
}

export function levelInfo(level: LevelId): LevelInfo {
  return levels[String(level)];
}

export function lessonsOfLevel(level: LevelId): Lesson[] {
  return lessons.filter(l => l.level === level);
}

/**
 * Уроки уровня, сгруппированные по учебным блокам, в исходном порядке.
 * Порядок задаётся сборкой контента и означает последовательность изучения.
 */
export function unitsOfLevel(level: LevelId): { unit: string; lessons: Lesson[] }[] {
  const out: { unit: string; lessons: Lesson[] }[] = [];
  for (const lesson of lessonsOfLevel(level)) {
    const last = out[out.length - 1];
    if (last && last.unit === lesson.unit) last.lessons.push(lesson);
    else out.push({ unit: lesson.unit, lessons: [lesson] });
  }
  return out;
}

export function totalSteps(): number {
  return lessons.reduce((sum, l) => sum + l.steps.length, 0);
}
