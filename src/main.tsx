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
 * То же и для «уменьшить движение»: если ждать, пока состояние поднимется
 * из хранилища, первый экран успеет проиграть анимацию появления — ровно
 * то, что настройка и должна была предотвратить.
 */
try {
  const saved = localStorage.getItem('grammarquest_state');
  if (saved && JSON.parse(saved)?.settings?.reducedMotion) {
    document.documentElement.dataset.motion = 'reduced';
  }
} catch {
  // Испорченное хранилище не должно мешать запуску: без атрибута
  // приложение просто анимируется как обычно.
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
/**
 * Регистрируем только по http и https.
 *
 * В настольной оболочке страница открывается по собственной схеме app://,
 * где service worker не поддерживается, — и он там не нужен: файлы лежат
 * внутри приложения. Проверка избавляет от необработанной ошибки в консоли.
 */
const вебКонтекст = location.protocol === 'http:' || location.protocol === 'https:';

if ('serviceWorker' in navigator && вебКонтекст) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    }).catch(() => {
      // Без service worker приложение работает, просто теряет офлайн.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
