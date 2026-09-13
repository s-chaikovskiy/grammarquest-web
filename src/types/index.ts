/** Язык интерфейса. Содержание уроков всегда казахское; русский — подсказка под ним. */
export type Lang = 'kz' | 'ru';

/** Кто говорит: Айша — ученица, мұғалім — учитель. Так в образце учителя. */
export type Speaker = 'girl' | 'teacher';

export interface DialogueLine {
  who: Speaker;
  kz: string;
  ru: string;
}

export interface Task {
  /** choice — один верный вариант, multi — отметить все верные. */
  kind: 'choice' | 'multi';
  kz: string;
  ru: string;
  /** Предложение с пропуском «...», куда встаёт выбранный вариант. */
  sentence?: string;
  options: string[];
  answers: string[];
  /** Слово, которое получается из верного ответа: «-нші» → «Жетінші». */
  result?: string;
}

/** Один шаг урока — ровно в порядке учителя: диалог → правило → задание. */
export interface Step {
  dialogue: DialogueLine[];
  ruleKz: string;
  ruleRu: string;
  task: Task;
}

export interface Lesson {
  id: string;
  /** Номер темы на листочке учителя. */
  sheet: number;
  titleKz: string;
  titleRu: string;
  /** «учитель» — её текст из документа, «ассистент» — написано по её образцу. */
  author: string;
  steps: Step[];
}

export interface LessonsData {
  version: number;
  lessons: Lesson[];
}

export interface LessonProgress {
  correct: number;
  total: number;
  lastPlayed: string;
}

export interface Settings {
  sound: boolean;
  lang: Lang;
  reducedMotion: boolean;
}

export interface AppState {
  progress: Record<string, LessonProgress>;
  settings: Settings;
}
