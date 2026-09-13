import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useStrings } from '../i18n';
import { playClickSound } from '../utils/sounds';
import { lessons } from '../data';

/**
 * Список тем — в порядке листочка учителя.
 *
 * Темы не запираются: учитель может открыть любую сразу, ученик — вернуться
 * к трудной. Следующая непройденная подсвечена, у пройденных — счёт.
 */
export default function LearnScreen() {
  const navigate = useNavigate();
  const { progressOf } = useApp();
  const { t, ru } = useStrings();
  const currentId = lessons.find(l => !progressOf(l.id))?.id ?? null;

  return (
    <div className="stack">
      <h1 className="t-head">{t.lessons}</h1>

      <section className="chapter panel panel--tray" style={{ '--chapter': 'var(--accent)' } as React.CSSProperties}>
        <ol className="trail">
          {lessons.map((lesson, i) => {
            const p = progressOf(lesson.id);
            const state = p ? 'done' : lesson.id === currentId ? 'current' : 'open';
            return (
              <li key={lesson.id} className={`step step--${state}`}>
                <button
                  type="button"
                  className="step__hit"
                  onClick={() => { playClickSound(); navigate(`/lesson/${lesson.id}`); }}
                >
                  <span className="step__dot" aria-hidden>{p ? '✓' : i + 1}</span>
                  <span className="step__body">
                    <span className="step__title">{lesson.titleKz}</span>
                    <span className="step__sub">
                      {ru ? `${lesson.titleRu} · ` : ''}{t.tasks(lesson.steps.length)}
                    </span>
                  </span>
                  <span className="step__tail">
                    {p && <span className="step__score">{p.correct}/{p.total}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
