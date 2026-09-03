import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { playClickSound } from '../utils/sounds';
import { plural } from '../utils/helpers';
import { lessons, levels, LEVEL_IDS, lessonsOfLevel, totalSteps } from '../data';
import type { LevelId } from '../data';

/**
 * Первый экран.
 *
 * Построен вокруг одной мысли, а не вокруг набора блоков.
 *
 * Мысль такая: девяти казахских букв нет на русской клавиатуре, и именно
 * из-за них ученик получал «неверно» за правильный ответ. Это и находка
 * проекта, и причина, по которой он существует. Поэтому экран открывается
 * не портретом и не заголовком, а самими буквами — сеткой три на три,
 * где «қ» выделена: она стоит на иконке приложения.
 *
 * Прежняя раскладка — портрет, заголовок, абзац, карточка с цифрами, две
 * кнопки — собиралась из готовых блоков и выглядела как любое другое
 * приложение. Полировка теней этого не меняет: экран становится интересным
 * от идеи, а не от отделки.
 */

/** Порядок как в алфавите. «қ» помечена: она на иконке приложения. */
const LETTERS = ['ә', 'ғ', 'қ', 'ң', 'ө', 'ұ', 'ү', 'һ', 'і'];

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { state, updateSettings } = useApp();
  const started = Object.keys(state.progress).length > 0 || state.xp > 0;

  const start = () => {
    playClickSound();
    navigate('/learn');
  };

  return (
    <div className="page">
      <div className="shell stack--loose">

        {/* Буквы — не украшение, а сам довод. Их девять, и сетка три на три
            получается ровной без подгонки. */}
        <section className="alphabet">
          <ul className="alphabet__grid" aria-hidden>
            {LETTERS.map(ch => (
              <li key={ch} className={`alphabet__cell${ch === 'қ' ? ' alphabet__cell--key' : ''}`}>
                {ch}
              </li>
            ))}
          </ul>
          <p className="alphabet__note">
            Девять букв казахского алфавита, которых&nbsp;нет на русской клавиатуре.
            <strong> С них всё и началось.</strong>
          </p>
        </section>

        <header className="stack--tight">
          <h1 className="wordmark">
            <span className="wordmark__name">Тілашар</span>
            <span className="wordmark__tag">Казахский язык — шаг за шагом</span>
          </h1>
          <p className="t-body prose t-mut">
            «Тіл» — язык, «ашар» — откроет. Приложение учит казахскому тех,
            кто говорит по-русски: диалог, правило, задание — и разбор каждой ошибки.
          </p>
        </header>

        {/* Цифры строкой, а не карточкой: это подпись к продукту,
            а не показатели, за которыми возвращаются. */}
        <p className="facts">
          <span><b>{lessons.length}</b> {plural(lessons.length, 'урок', 'урока', 'уроков')}</span>
          <span><b>{totalSteps()}</b> {plural(totalSteps(), 'задание', 'задания', 'заданий')}</span>
          <span><b>7</b> типов упражнений</span>
        </p>

        {/* Устройство урока показано на первом же экране.
            Порядок диалог → правило → задание был в приложении всегда,
            но снаружи его было не видно: чтобы убедиться, нужно было
            открыть урок и дойти до третьего экрана. */}
        <section className="lesson-map" aria-label="Как устроен урок">
          <h2 className="t-sub">Каждый урок — три шага</h2>
          <ol className="lesson-map__steps">
            <li>
              <b>Диалог</b>
              <span>Живая сцена на казахском с переводом</span>
            </li>
            <li>
              <b>Правило</b>
              <span>Грамматика, которая в этом диалоге работает</span>
            </li>
            <li>
              <b>Задание</b>
              <span>Применить правило самому и разобрать ошибку</span>
            </li>
          </ol>
        </section>

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
