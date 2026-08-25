import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './hooks/useApp';
import { setSoundEnabled } from './utils/sounds';
import WelcomeScreen from './screens/WelcomeScreen';
import MenuScreen from './screens/MenuScreen';
import LessonScreen from './screens/LessonScreen';
import LessonListScreen from './screens/LessonListScreen';
import ReviewScreen from './screens/ReviewScreen';

// Экраны, которые открывают не на каждом занятии, грузятся отдельными кусками:
// правила и справочник тянут за собой около 250 КБ данных, и держать их
// в основном бандле — значит замедлять запуск первого урока.
const RulesScreen = lazy(() => import('./screens/RulesScreen'));
const ReferenceScreen = lazy(() => import('./screens/ReferenceScreen'));
const StatsScreen = lazy(() => import('./screens/StatsScreen'));

function AppRoutes() {
  const { state } = useApp();

  // Настройка звука живёт в состоянии, а проигрыватель — отдельный модуль:
  // синхронизируем их в одном месте, а не в каждом обработчике.
  useEffect(() => { setSoundEnabled(state.settings.sound); }, [state.settings.sound]);

  return (
    <Suspense fallback={<div className="page" />}>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/menu" element={<MenuScreen />} />
        <Route path="/lessons" element={<LessonListScreen />} />
        <Route path="/lesson/:id" element={<LessonScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/rules" element={<RulesScreen />} />
        <Route path="/reference" element={<ReferenceScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
