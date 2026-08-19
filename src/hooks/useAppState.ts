import { useState, useEffect, useCallback } from 'react';
import type { Lang, AppState, LessonProgress } from '../types';
import { achievements, getLevelFromXp } from '../data/achievements';

const STORAGE_KEY = 'grammarquest_state';

const defaultState: AppState = {
  lang: 'ru',
  progress: {},
  xp: 0,
  streak: 0,
  achievements: [],
  lastActiveDate: '',
  level: 1,
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = { ...defaultState, ...JSON.parse(saved) };
      state.level = getLevelFromXp(state.xp);
      return state;
    }
  } catch {}
  return defaultState;
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function checkStreak(lastActiveDate: string, currentStreak: number): number {
  if (!lastActiveDate) return 1;
  
  const today = new Date().toDateString();
  const lastDate = new Date(lastActiveDate).toDateString();
  
  if (today === lastDate) return currentStreak;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastDate === yesterday.toDateString()) {
    return currentStreak + 1;
  }
  
  return 1;
}

function checkAchievements(state: AppState): string[] {
  const newAchievements: string[] = [];
  
  achievements.forEach(achievement => {
    if (!state.achievements.includes(achievement.id) && achievement.condition(state)) {
      newAchievements.push(achievement.id);
    }
  });
  
  return newAchievements;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setLang = useCallback((lang: Lang) => {
    setState(s => ({ ...s, lang }));
  }, []);

  const updateProgress = useCallback((lessonId: string, progress: LessonProgress) => {
    setState(s => {
      const newXp = s.xp + (progress.score - (s.progress[lessonId]?.score || 0));
      const newLevel = getLevelFromXp(newXp);
      const newStreak = checkStreak(s.lastActiveDate, s.streak);
      
      const newState = {
        ...s,
        progress: { ...s.progress, [lessonId]: progress },
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: new Date().toDateString(),
      };
      
      const newAchievements = checkAchievements(newState);
      if (newAchievements.length > 0) {
        newState.achievements = [...s.achievements, ...newAchievements];
      }
      
      return newState;
    });
  }, []);

  const addXp = useCallback((amount: number) => {
    setState(s => {
      const newXp = s.xp + amount;
      const newLevel = getLevelFromXp(newXp);
      const newStreak = checkStreak(s.lastActiveDate, s.streak);
      
      const newState = {
        ...s,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: new Date().toDateString(),
      };
      
      const newAchievements = checkAchievements(newState);
      if (newAchievements.length > 0) {
        newState.achievements = [...s.achievements, ...newAchievements];
      }
      
      return newState;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setState(s => ({ ...s, progress: {}, xp: 0, streak: 0, achievements: [], lastActiveDate: '', level: 1 }));
  }, []);

  return { state, setLang, updateProgress, addXp, resetProgress };
}