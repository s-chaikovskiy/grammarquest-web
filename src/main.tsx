import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

/**
 * Тема применяется до первого кадра, иначе при тёмной теме успевает
 * мигнуть светлый фон.
 */
const savedTheme = localStorage.getItem('grammarquest_theme');
if (savedTheme === 'light' || savedTheme === 'dark') {
  document.documentElement.dataset.theme = savedTheme;
}

/**
 * Обновление приложения.
 *
 * Service worker отдаёт закешированную версию, поэтому после выкладки
 * вернувшийся ученик сначала видел старое приложение, а новое получал
 * только со второго захода. Здесь страница перезагружается один раз,
 * как только управление перешло к новой версии.
 *
 * Защита от цикла: перезагружаем ровно один раз за жизнь вкладки.
 */
if ('serviceWorker' in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
