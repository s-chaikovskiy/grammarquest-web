import lessonsData from './lessons.json';
import rulesData from './rules.json';
import referenceData from './reference.json';
import type { LessonsData, ReferenceData, Rule } from '../types';

export const lessons = (lessonsData as LessonsData).lessons;
export const reference = (referenceData as ReferenceData).topics;
export const rules = rulesData as Rule[];

export function getLessonById(id: string) {
  return lessons.find(l => l.id === id);
}

export function getLessonsByTag(tag: string) {
  return lessons.filter(l => l.tags?.includes(tag));
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  lessons.forEach(l => l.tags?.forEach(t => tags.add(t)));
  return Array.from(tags);
}
