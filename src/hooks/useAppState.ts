import { useState, useEffect, useCallback } from 'react';
import type { AppState, Lang, LessonProgress, Settings } from '../types';

/**
 * Ключ хранилища не переименовывать: под ним сохранён прогресс всех, кто уже
 * занимался. Новое имя означало бы, что приложение молча всё забыло.
 */
const STORAGE_KEY = 'grammarquest_state';
const STATE_VERSION = 3;

const defaultSettings: Settings = {
  sound: true,
  lang: 'kz',
  reducedMotion: false,
};

/**
 * Поля прежних версий — очки, серия, карточки повторения, журнал ответов.
 *
 * Разделов, которым они принадлежали, больше нет, но сами записи не
 * стираются: при сохранении они возвращаются в хранилище как были. Если
 * убранные разделы когда-нибудь вернут, ученик не начнёт с нуля.
 */
let legacy: Record<string, unknown> = {};

function isProgress(value: unknown): value is LessonProgress {
  const p = value as LessonProgress;
  return !!p && typeof p.correct === 'number' && typeof p.total === 'number';
}

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { progress: {}, settings: defaultSettings };
    const { progress, settings, version: _version, ...rest } = JSON.parse(saved) ?? {};
    legacy = rest;
    const s = (settings ?? {}) as Partial<Settings>;
    const lang: Lang = s.lang === 'ru' ? 'ru' : 'kz';
    return {
      // Прогресс прежних уроков лежит под другими id и никому не мешает:
      // экран читает только записи своих тем.
      progress: progress && typeof progress === 'object' ? progress : {},
      settings: {
        sound: typeof s.sound === 'boolean' ? s.sound : defaultSettings.sound,
        reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : false,
        lang,
      },
    };
  } catch {
    return { progress: {}, settings: defaultSettings };
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...legacy, ...state, version: STATE_VERSION }));
  } catch {
    // Приватный режим или переполнение — занятие не должно падать из-за этого.
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.reducedMotion) root.dataset.motion = 'reduced';
    else delete root.dataset.motion;
    root.lang = state.settings.lang === 'ru' ? 'ru' : 'kk';
  }, [state.settings.reducedMotion, state.settings.lang]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  /** Результат пройденной темы. Засчитывается последний проход. */
  const saveResult = useCallback((lessonId: string, correct: number, total: number) => {
    setState(s => ({
      ...s,
      progress: { ...s.progress, [lessonId]: { correct, total, lastPlayed: new Date().toISOString() } },
    }));
  }, []);

  /** Прогресс темы — только если запись в нынешнем формате. */
  const progressOf = useCallback((lessonId: string): LessonProgress | null => {
    const p = state.progress[lessonId];
    return isProgress(p) ? p : null;
  }, [state.progress]);

  return { state, updateSettings, saveResult, progressOf };
}
