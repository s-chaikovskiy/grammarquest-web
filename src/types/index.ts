export type Lang = 'kz' | 'ru';

export type TaskType = 'input' | 'choice' | 'matching' | 'fill_blank' | 'translate';

export interface Step {
  dialogueKz: string;
  dialogueRu: string;
  grammarKz: string;
  grammarRu: string;
  taskKz: string;
  taskRu: string;
  answerKz: string;
  answerRu: string;
  teacherKz1: string;
  teacherKz2: string;
  teacherRu1: string;
  teacherRu2: string;
  taskType?: TaskType;
  options?: string[];
  pairs?: { left: string; right: string }[];
}

export interface Lesson {
  id: string;
  titleKz: string;
  titleRu: string;
  character: string;
  tags?: string[];
  steps: Step[];
}

export interface LessonsData {
  version: number;
  lessons: Lesson[];
}

export interface ReferenceTopic {
  id: string;
  categoryKz: string;
  categoryRu: string;
  titleKz: string;
  titleRu: string;
  bodyKz: string;
  bodyRu: string;
  examplesKz?: string[];
  examplesRu?: string[];
  mistakesKz?: string[];
  mistakesRu?: string[];
}

export interface ReferenceData {
  version: number;
  topics: ReferenceTopic[];
}

export interface Rule {
  id: string;
  titleKz: string;
  titleRu: string;
  kz: string;
  ru: string;
  examplesKz?: string[];
  examplesRu?: string[];
  tags?: string[];
}

export interface LessonProgress {
  lessonId: string;
  completedSteps: number;
  totalSteps: number;
  score: number;
  lastPlayed: string;
}

export interface Achievement {
  id: string;
  titleKz: string;
  titleRu: string;
  descriptionKz: string;
  descriptionRu: string;
  icon: string;
  condition: (state: AppState) => boolean;
}

export interface AppState {
  lang: Lang;
  progress: Record<string, LessonProgress>;
  xp: number;
  streak: number;
  achievements: string[];
  lastActiveDate: string;
  level: number;
}
