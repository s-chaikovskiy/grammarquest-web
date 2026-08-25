import { useNavigate } from 'react-router-dom';
import { useTilt } from '../hooks/useTilt';
import { useApp } from '../hooks/useApp';
import { playClickSound } from '../utils/sounds';
import { plural } from '../utils/helpers';
import Character from '../components/Character';
import { lessons, levels, LEVEL_IDS, lessonsOfLevel, totalSteps } from '../data';
import type { LevelId } from '../data';

/**
 * Первый экран.
 *
 * Раньше здесь стоял выбор языка интерфейса — и он сбивал с толку: приложение
 * с самого начала сделано для тех, кто говорит по-русски и учит казахский,
 * так что выбирать было нечего. Вместо него — выбор уровня, который
 * действительно меняет то, с чего начнётся обучение.
 */
export default function WelcomeScreen() {
  const navigate = useNavigate();
  const tilt = useTilt<HTMLDivElement>();
  const { state, updateSettings } = useApp();
  const started = Object.keys(state.progress).length > 0 || state.xp > 0;

  const start = () => {
    playClickSound();
    navigate('/learn');
  };

  return (
    <div className="page">
      <div className="shell stack--loose">
        <header className="stack--tight">
          <div ref={tilt} className="tilt" style={{ width: 'fit-content' }}>
            <Character name="girl" size={88} />
          </div>
          {/* Имя приложения объяснено прямо здесь: «тіл» — язык, «ашар» — откроет.
              Название, которое надо гуглить, работает против продукта. */}
          <h1 className="wordmark">
            <span className="wordmark__glyph" aria-hidden>қ</span>
            <span className="wordmark__text">
              <span className="wordmark__name">Тілашар</span>
              <span className="wordmark__tag">Казахский язык — шаг за шагом</span>
            </span>
          </h1>
          <p className="t-body prose t-mut">
            «Тіл» — язык, «ашар» — откроет. Тілашар учит казахскому тех,
            кто говорит по-русски: диалог, правило, задание — и разбор каждой ошибки.
          </p>
        </header>

        <dl className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(6.5rem, 1fr))', gap: '1rem' }}>
          <Fact value={String(lessons.length)} label={plural(lessons.length, 'урок', 'урока', 'уроков')} />
          <Fact value={String(totalSteps())} label={plural(totalSteps(), 'задание', 'задания', 'заданий')} />
          <Fact value="7" label="типов упражнений" />
        </dl>

        {!started && (
          <section className="stack--tight">
            <h2 className="t-sub">С чего начать</h2>
            <p className="t-small">
              Уровень можно поменять в любой момент — это ориентир, а не ограничение.
            </p>
            <div className="stack--tight">
              {LEVEL_IDS.map(id => (
                <LevelCard
                  key={id}
                  id={id}
                  selected={state.settings.level === id}
                  onSelect={() => { playClickSound(); updateSettings({ level: id }); }}
                />
              ))}
            </div>
          </section>
        )}

        <div className="stack--tight">
          <button className="btn btn--primary btn--block" onClick={start}>
            {started ? 'Продолжить' : 'Начать'}
          </button>
          <button
            className="btn btn--ghost btn--block"
            onClick={() => { playClickSound(); navigate('/help'); }}
          >
            Как это работает
          </button>
        </div>
      </div>
    </div>
  );
}

function LevelCard({ id, selected, onSelect }: { id: LevelId; selected: boolean; onSelect: () => void }) {
  const info = levels[String(id)];
  const count = lessonsOfLevel(id).length;

  return (
    <button
      type="button"
      className={`option${selected ? ' option--picked' : ''}`}
      style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.25rem', minHeight: 'auto', padding: '1rem' }}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'baseline' }}>
        <strong>{info.titleRu}</strong>
        <span className="t-small">{info.grades}</span>
      </span>
      <span className="t-small" style={{ fontWeight: 400 }}>{info.aboutRu}</span>
      <span className="t-small" style={{ fontWeight: 400 }}>
        {count} {plural(count, 'урок', 'урока', 'уроков')}
      </span>
    </button>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="t-head" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</dt>
      <dd className="t-small">{label}</dd>
    </div>
  );
}
