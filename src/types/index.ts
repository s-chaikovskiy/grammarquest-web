import type { Card } from '../utils/srs';
import type { AnswerEvent } from '../utils/metrics';

export type Lang = 'kz' | 'ru';

export type TaskType =
  | 'input'        // свободный ввод
  | 'choice'       // выбор из 4 вариантов
  | 'matching'     // сопоставление формы и перевода
  | 'fill_blank'   // пропуск внутри предложения
  | 'translate'    // перевод с русского на казахский
  | 'word_order'   // сборка предложения из слов
  | 'open';        // развёрнутый ответ с самопроверкой

export interface BlankTask {
  sentence: string;   // предложение с «...» на месте пропуска
  hint: string | null; // инфинитив-подсказка из скобок
  prompt: string;     // формулировка до предложения
}

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
  tokens?: string[];   // перемешанные слова для word_order
  blank?: BlankTask;   // разобранный пропуск для fill_blank
  prompt?: string;     // русская фраза для translate
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
  /** Верных ответов из totalSteps — нужно для «звёзд» и отбора на повторение. */
  correct?: number;
}

export interface Settings {
  sound: boolean;
  music: boolean;
  reducedMotion: boolean;
  /** Подпись ученика в выгрузке CSV. Персональные данные не собираем. */
  participantId: string;
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
  /** Карточки интервального повторения, ключ — `${lessonId}:${stepIndex}`. */
  cards: Record<string, Card>;
  /** Журнал ответов для статистики и выгрузки. */
  events: AnswerEvent[];
  settings: Settings;
  /** Дни, в которые были занятия, — для календаря серии. */
  activeDays: string[];
}
