import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './hooks/useApp';
import { setSoundEnabled } from './utils/sounds';
import AppShell from './components/AppShell';
import WelcomeScreen from './screens/WelcomeScreen';
import LearnScreen from './screens/LearnScreen';
import LessonScreen from './screens/LessonScreen';
import ReviewScreen from './screens/ReviewScreen';

// Разделы, до которых доходят не в первую минуту, грузятся отдельными частями:
// первый урок не должен ждать загрузки словаря и справочника.
const PracticeScreen = lazy(() => import('./screens/PracticeScreen'));
const DictionaryScreen = lazy(() => import('./screens/DictionaryScreen'));
const ReferenceHubScreen = lazy(() => import('./screens/ReferenceHubScreen'));
const RulesScreen = lazy(() => import('./screens/RulesScreen'));
const ReferenceScreen = lazy(() => import('./screens/ReferenceScreen'));
const TablesScreen = lazy(() => import('./screens/TablesScreen'));
const StatsScreen = lazy(() => import('./screens/StatsScreen'));
const CardsScreen = lazy(() => import('./screens/CardsScreen'));
const SprintScreen = lazy(() => import('./screens/SprintScreen'));
const HelpScreen = lazy(() => import('./screens/HelpScreen'));

/* Экран во время подгрузки раздела. Надпись «Загрузка…» на пустой странице
   читается как поломка; скелетон занимает место будущего содержимого, и
   страница не прыгает, когда оно приходит. */
function Loading() {
  return (
    <div className="page">
      <div className="shell skeleton" role="status" aria-label="Загрузка раздела">
        <div className="skeleton__bar skeleton__bar--title" />
        <div className="skeleton__bar skeleton__bar--half" />
        <div className="skeleton__block" />
        <div className="skeleton__block" />
      </div>
    </div>
  );
}

function AppRoutes() {
  const { state } = useApp();

  // Настройка звука живёт в состоянии, а проигрыватель — отдельный модуль:
  // синхронизируем их в одном месте, а не в каждом обработчике.
  useEffect(() => { setSoundEnabled(state.settings.sound); }, [state.settings.sound]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />

        {/* Разделы с нижней панелью */}
        <Route element={<AppShell />}>
          <Route path="/learn" element={<LearnScreen />} />
          <Route path="/practice" element={<PracticeScreen />} />
          <Route path="/dictionary" element={<DictionaryScreen />} />
          <Route path="/reference" element={<ReferenceHubScreen />} />
          <Route path="/reference/rules" element={<RulesScreen />} />
          <Route path="/reference/topics" element={<ReferenceScreen />} />
          <Route path="/reference/tables" element={<TablesScreen />} />
          <Route path="/stats" element={<StatsScreen />} />
          <Route path="/help" element={<HelpScreen />} />
        </Route>

        {/* Занятия идут на весь экран: панель отвлекала бы от задания */}
        <Route path="/lesson/:id" element={<LessonScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/cards" element={<CardsScreen />} />
        <Route path="/sprint" element={<SprintScreen />} />

        <Route path="/menu" element={<Navigate to="/learn" replace />} />
        <Route path="/lessons" element={<Navigate to="/learn" replace />} />
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
