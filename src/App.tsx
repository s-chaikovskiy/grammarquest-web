import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './hooks/useApp';
import WelcomeScreen from './screens/WelcomeScreen';
import MenuScreen from './screens/MenuScreen';
import LessonScreen from './screens/LessonScreen';
import RulesScreen from './screens/RulesScreen';
import ReferenceScreen from './screens/ReferenceScreen';
import LessonListScreen from './screens/LessonListScreen';
import ReviewScreen from './screens/ReviewScreen';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/menu" element={<MenuScreen />} />
      <Route path="/lessons" element={<LessonListScreen />} />
      <Route path="/lesson/:id" element={<LessonScreen />} />
      <Route path="/rules" element={<RulesScreen />} />
      <Route path="/reference" element={<ReferenceScreen />} />
      <Route path="/review" element={<ReviewScreen />} />
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
