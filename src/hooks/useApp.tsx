import { createContext, useContext, type ReactNode } from 'react';
import { useAppState } from './useAppState';
import type { AppState, Lang } from '../types';

interface AppContextType {
  state: AppState;
  setLang: (lang: Lang) => void;
  updateProgress: (lessonId: string, progress: import('../types').LessonProgress) => void;
  addXp: (amount: number) => void;
  resetProgress: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const appState = useAppState();
  return (
    <AppContext.Provider value={appState}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
