import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t, pluralize } from '../utils/helpers';
import { playClickSound } from '../utils/sounds';
import { lessons } from '../data';

export default function LessonListScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { lang, progress } = state;

  return (
    <div className="page">
      <div className="shell stack">
        <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn--quiet" onClick={() => navigate('/menu')} aria-label={t('Артқа', 'Назад', lang)}>
            ←
          </button>
          <h1 className="t-head">{t('Сабақтар', 'Уроки', lang)}</h1>
        </header>

        {/* Список, а не сетка карточек: у уроков есть порядок, и его видно. */}
        <ul style={{ listStyle: 'none' }}>
          {lessons.map((lesson, i) => {
            const done = progress[lesson.id];
            const complete = done && done.completedSteps >= done.totalSteps;
            const accuracy = done?.correct != null && done.totalSteps
              ? Math.round((done.correct / done.totalSteps) * 100)
              : null;

            return (
              <li key={lesson.id}>
                <button
                  className="lesson-row"
                  onClick={() => { playClickSound(); navigate(`/lesson/${lesson.id}`); }}
                >
                  <span className="lesson-row__num">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="lesson-row__title" style={{ display: 'block' }}>
                      {lang === 'kz' ? lesson.titleKz : lesson.titleRu}
                    </span>
                    <span className="lesson-row__sub">
                      {lang === 'kz' ? `${lesson.steps.length} тапсырма` : pluralize(lesson.steps.length, 'задание', 'задания', 'заданий')}
                      {accuracy !== null && ` · ${accuracy}% ${t('дұрыс', 'верно', lang)}`}
                    </span>
                  </span>
                  <span className="t-small" style={{ color: complete ? 'var(--success)' : 'var(--ink-2)' }}>
                    {complete ? t('өтілді', 'пройден', lang) : done ? t('басталды', 'начат', lang) : '→'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
