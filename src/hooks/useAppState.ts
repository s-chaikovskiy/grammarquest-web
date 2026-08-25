import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppState, LessonProgress, Settings } from '../types';
import { achievements, getLevelFromXp } from '../data/achievements';
import { newCard, reviewCard, dueQueue, forecast, todayISO } from '../utils/srs';
import type { Card } from '../utils/srs';
import type { Verdict } from '../utils/answer';
import { pushEvent, eventsToCsv, downloadCsv, byDay, byTaskType, keyboardRescueRate } from '../utils/metrics';
import type { AnswerEvent } from '../utils/metrics';

const STORAGE_KEY = 'grammarquest_state';
const STATE_VERSION = 2;

const defaultSettings: Settings = {
  sound: true,
  level: 1,
  dailyGoal: 10,
  instantCheck: true,
  music: false,
  reducedMotion: false,
  participantId: '',
};

const defaultState: AppState = {
  progress: {},
  xp: 0,
  streak: 0,
  achievements: [],
  lastActiveDate: '',
  level: 1,
  cards: {},
  events: [],
  settings: defaultSettings,
  activeDays: [],
  records: { sprint: 0 },
};

/**
 * Читает сохранение и подтягивает его до текущей версии.
 * У версии 1 не было карточек, журнала и настроек — прогресс и XP при
 * обновлении не теряются, недостающие поля просто добираются значениями
 * по умолчанию.
 */
function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState;
    const parsed = JSON.parse(saved) as Partial<AppState> & { version?: number };
    const state: AppState = {
      ...defaultState,
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      cards: parsed.cards ?? {},
      events: parsed.events ?? [],
      activeDays: parsed.activeDays ?? [],
      records: { ...defaultState.records, ...(parsed.records ?? {}) },
    };
    state.level = getLevelFromXp(state.xp);
    return state;
  } catch {
    return defaultState;
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: STATE_VERSION }));
  } catch {
    // Приватный режим или переполнение — занятие не должно падать из-за этого.
  }
}

/** Серия считается по календарным дням: сегодня, вчера, иначе обрыв. */
function nextStreak(lastActiveDate: string, currentStreak: number): number {
  const today = todayISO();
  if (!lastActiveDate) return 1;
  if (lastActiveDate === today) return Math.max(currentStreak, 1);
  const yesterday = todayISO(new Date(Date.now() - 86_400_000));
  return lastActiveDate === yesterday ? currentStreak + 1 : 1;
}

function withEarnedAchievements(state: AppState): AppState {
  const earned = achievements
    .filter(a => !state.achievements.includes(a.id) && a.condition(state))
    .map(a => a.id);
  return earned.length ? { ...state, achievements: [...state.achievements, ...earned] } : state;
}

/** Отмечает день занятия: обновляет серию и календарь активности. */
function touchToday(state: AppState): AppState {
  const today = todayISO();
  if (state.lastActiveDate === today) return state;
  return {
    ...state,
    streak: nextStreak(state.lastActiveDate, state.streak),
    lastActiveDate: today,
    activeDays: [...new Set([...state.activeDays, today])].slice(-400),
  };
}

export interface RecordAnswerInput {
  lessonId: string;
  stepIndex: number;
  taskType: string;
  verdict: Verdict;
  msToAnswer: number;
  hintsUsed: number;
  xp: number;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  /**
   * Единая точка на любой ответ ученика: начисляет XP, двигает карточку
   * в интервальном повторении и пишет событие в журнал.
   */
  const recordAnswer = useCallback((input: RecordAnswerInput) => {
    setState(s => {
      const cardId = `${input.lessonId}:${input.stepIndex}`;
      const card: Card = s.cards[cardId] ?? newCard(input.lessonId, input.stepIndex);
      const event: AnswerEvent = {
        ts: Date.now(),
        lessonId: input.lessonId,
        stepIndex: input.stepIndex,
        taskType: input.taskType,
        verdict: input.verdict,
        msToAnswer: input.msToAnswer,
        hintsUsed: input.hintsUsed,
      };
      const xp = Math.max(0, s.xp + input.xp);
      let next: AppState = {
        ...s,
        xp,
        level: getLevelFromXp(xp),
        cards: { ...s.cards, [cardId]: reviewCard(card, input.verdict) },
        events: pushEvent(s.events, event),
      };
      next = touchToday(next);
      return withEarnedAchievements(next);
    });
  }, []);

  const updateProgress = useCallback((lessonId: string, progress: LessonProgress) => {
    setState(s => {
      const next = touchToday({
        ...s,
        progress: { ...s.progress, [lessonId]: progress },
      });
      return withEarnedAchievements(next);
    });
  }, []);

  const resetProgress = useCallback(() => {
    setState(s => ({ ...defaultState, settings: s.settings }));
  }, []);

  /** Обновляет рекорд, только если он действительно побит. */
  const setRecord = useCallback((key: keyof AppState['records'], value: number) => {
    setState(s => (value > s.records[key]
      ? { ...s, records: { ...s.records, [key]: value } }
      : s));
  }, []);

  const exportCsv = useCallback(() => {
    setState(s => {
      const csv = eventsToCsv(s.events, s.settings.participantId);
      downloadCsv(`tilashar-${todayISO()}.csv`, csv);
      return s;
    });
  }, []);

  // Производные величины считаем один раз на изменение состояния.
  const derived = useMemo(() => ({
    due: dueQueue(state.cards),
    forecast: forecast(state.cards),
    daily: byDay(state.events),
    perType: byTaskType(state.events),
    rescueRate: keyboardRescueRate(state.events),
  }), [state.cards, state.events]);

  return { state, updateSettings, recordAnswer, updateProgress, resetProgress, setRecord, exportCsv, ...derived };
}
