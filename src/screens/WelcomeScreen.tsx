import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t, plural } from '../utils/helpers';
import { playClickSound } from '../utils/sounds';
import Character from '../components/Character';
import { lessons, totalSteps } from '../data';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { state, setLang } = useApp();
  const { lang } = state;
  const started = Object.keys(state.progress).length > 0 || state.xp > 0;

  return (
    <div className="page" style={{ display: 'grid', alignContent: 'center' }}>
      <div className="shell stack--loose">
        <div className="stack--tight">
          <Character name="teacher" size={96} />
          <h1 className="t-title">GrammarQuest</h1>
          <p className="t-body prose t-mut">
            {t(
              'Диалог арқылы қазақ тілінің грамматикасын үйрен.',
              'Тренажёр казахской грамматики: диалог, правило, задание — и разбор каждой ошибки.',
              lang
            )}
          </p>
        </div>

        <dl className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(7rem, 1fr))', gap: '1rem' }}>
          <Fact value={String(lessons.length)} label={t('сабақ', plural(lessons.length, 'урок', 'урока', 'уроков'), lang)} />
          <Fact value={String(totalSteps)} label={t('тапсырма', plural(totalSteps, 'задание', 'задания', 'заданий'), lang)} />
          <Fact value="7" label={t('түрі', 'типов упражнений', lang)} />
        </dl>

        <div className="stack--tight">
          <button
            className="btn btn--primary btn--block"
            onClick={() => { playClickSound(); navigate('/menu'); }}
          >
            {started ? t('Жалғастыру', 'Продолжить', lang) : t('Бастау', 'Начать', lang)}
          </button>

          <div className="tabs" role="group" aria-label={t('Интерфейс тілі', 'Язык интерфейса', lang)}>
            <button
              className={`tab${lang === 'ru' ? ' tab--active' : ''}`}
              onClick={() => setLang('ru')}
            >
              Русский
            </button>
            <button
              className={`tab${lang === 'kz' ? ' tab--active' : ''}`}
              onClick={() => setLang('kz')}
            >
              Қазақша
            </button>
          </div>
        </div>
      </div>
    </div>
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
