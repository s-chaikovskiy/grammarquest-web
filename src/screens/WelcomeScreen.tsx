import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useStrings } from '../i18n';
import { playClickSound } from '../utils/sounds';
import { lessons, totalSteps } from '../data';
import Character from '../components/Character';
import LangSwitch from '../components/LangSwitch';

/**
 * Первый экран.
 *
 * Показывает ровно то, из чего состоит приложение: двух героев из заданий
 * учителя — Айшу и мұғалім — и порядок каждого задания: диалог, правило,
 * задание. Порядок виден до первого нажатия: в сентябре учитель решила, что
 * он нарушен, потому что не дошла до урока.
 */
export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { t } = useStrings();
  const started = lessons.some(l => state.progress[l.id]);
  const flow = [t.flow.dialogue, t.flow.rule, t.flow.task];

  return (
    <div className="page">
      <div className="shell stack--loose">
        <div className="welcome__top">
          <LangSwitch />
        </div>

        {/* Герои дышат в покое и оживают, когда звучит их реплика. */}
        <section className="heroes" aria-hidden>
          <figure className="heroes__one">
            <Character name="girl" size={150} />
            <figcaption>{t.names.girl}</figcaption>
          </figure>
          <figure className="heroes__one">
            <Character name="teacher" size={150} />
            <figcaption>{t.names.teacher}</figcaption>
          </figure>
        </section>

        <header className="stack--tight">
          <h1 className="wordmark">
            <span className="wordmark__name">Тілашар</span>
            <span className="wordmark__tag">{t.appTag}</span>
          </h1>
          <p className="t-body prose t-mut">{t.intro}</p>
        </header>

        <section className="lesson-map" aria-label={t.threeSteps}>
          <h2 className="t-sub">{t.threeSteps}</h2>
          <ol className="lesson-map__steps">
            {flow.map(([title, about]) => (
              <li key={title}>
                <b>{title}</b>
                <span>{about}</span>
              </li>
            ))}
          </ol>
        </section>

        <p className="facts"><span>{t.facts(lessons.length, totalSteps())}</span></p>

        <button
          className="btn btn--primary btn--block"
          onClick={() => { playClickSound(); navigate('/learn'); }}
        >
          {started ? t.continue : t.start}
        </button>
      </div>
    </div>
  );
}
