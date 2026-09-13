import { useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider, useApp } from './hooks/useApp';
import { setSoundEnabled } from './utils/sounds';
import AppShell from './components/AppShell';
import WelcomeScreen from './screens/WelcomeScreen';
import LearnScreen from './screens/LearnScreen';
import LessonScreen from './screens/LessonScreen';

/**
 * Тема пересоздаётся при смене адреса.
 *
 * Без ключа React оставляет экран смонтированным, когда меняется только id:
 * шаг и ответы оставались бы от предыдущей темы.
 */
function LessonRoute() {
  const { id } = useParams<{ id: string }>();
  return <LessonScreen key={id} />;
}

/*
 * Экранов три: первый, список тем и сама тема.
 *
 * 13 сентября 2026 учитель попросила оставить только грамматику в её порядке —
 * диалог, правило, задание — и говорящих героев. Практика, словарь, справочник,
 * профиль, карточки, спринт и повторение убраны. Старые адреса ведут на первый
 * экран: закладка на удалённый раздел не должна открывать пустоту.
 */
function AppRoutes() {
  const { state } = useApp();

  useEffect(() => { setSoundEnabled(state.settings.sound); }, [state.settings.sound]);

  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route element={<AppShell />}>
        <Route path="/learn" element={<LearnScreen />} />
      </Route>
      <Route path="/lesson/:id" element={<LessonRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
