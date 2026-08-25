import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../hooks/useApp';
import { t, pluralize, plural } from '../utils/helpers';
import { playClickSound } from '../utils/sounds';
import { lessons } from '../data';
import { achievements, getXpProgress } from '../data/achievements';

export default function MenuScreen() {
  const navigate = useNavigate();
  const { state, due, forecast } = useApp();
  const { lang } = state;

  const completed = Object.values(state.progress).filter(p => p.completedSteps >= p.totalSteps).length;
  const levelProgress = getXpProgress(state.xp);
  const earned = achievements.filter(a => state.achievements.includes(a.id));
  const upcoming = forecast.slice(1).reduce((a, b) => a + b, 0);

  const go = (path: string) => { playClickSound(); navigate(path); };

  return (
    <div className="page">
      <motion.div
        className="shell stack"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      >
        <header className="stack--tight">
          <h1 className="t-head">{t('Мәзір', 'Главное', lang)}</h1>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span className="meta meta--accent">{t('Деңгей', 'Уровень', lang)} {state.level}</span>
            <span className="meta meta--gold">{state.xp} XP</span>
            {state.streak > 0 && (
              <span className="meta">{t('Қатарынан', 'Серия', lang)}: {state.streak} {t('күн', 'дн.', lang)}</span>
            )}
          </div>
          <div className="progress" role="progressbar" aria-valuenow={Math.round(levelProgress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress__fill" style={{ width: `${levelProgress}%` }} />
          </div>
          <p className="t-small">
            {t('Келесі деңгейге', 'До следующего уровня', lang)}: {100 - Math.round(levelProgress)} XP
          </p>
        </header>

        {/* Повторение вынесено наверх: если карточки просрочены, это важнее нового урока. */}
        {due.length > 0 && (
          <section className="panel panel--raised stack--tight">
            <h2 className="t-sub">{t('Бүгін қайталау', 'Сегодня к повторению', lang)}</h2>
            <p className="t-small">
              {lang === 'kz' ? `${due.length} тапсырма` : pluralize(due.length, 'задание', 'задания', 'заданий')}
              {due.some(c => c.lapses > 0) && ` · ${t('оның ішінде ұмытылғандары', 'среди них уже забытые', lang)}`}
            </p>
            <button className="btn btn--primary btn--block" onClick={() => go('/review')}>
              {t('Қайталауды бастау', 'Начать повторение', lang)}
            </button>
          </section>
        )}

        <nav className="panel" style={{ padding: '0.25rem 1rem' }}>
          <ul style={{ listStyle: 'none' }}>
            <NavRow
              title={t('Сабақтар', 'Уроки', lang)}
              sub={`${completed} ${t('өтілді', 'пройдено', lang)} / ${lessons.length}`}
              onClick={() => go('/lessons')}
            />
            <NavRow
              title={t('Қайталау', 'Повторение', lang)}
              sub={due.length > 0
                ? `${lang === 'kz' ? due.length + ' тапсырма' : pluralize(due.length, 'задание', 'задания', 'заданий')} ${t('бүгін', 'на сегодня', lang)}`
                : upcoming > 0
                  ? `${t('жақын күндері', 'в ближайшие дни', lang)}: ${lang === 'kz' ? upcoming : pluralize(upcoming, 'задание', 'задания', 'заданий')}`
                  : t('бос', 'пока пусто', lang)}
              onClick={() => go('/review')}
            />
            <NavRow title={t('Ережелер', 'Правила', lang)} sub={t('33 ереже', '33 правила', lang)} onClick={() => go('/rules')} />
            <NavRow title={t('Анықтамалық', 'Справочник', lang)} sub={t('22 тақырып', '22 темы', lang)} onClick={() => go('/reference')} />
            <NavRow title={t('Статистика', 'Статистика', lang)} sub={t('прогресс және баптаулар', 'прогресс и настройки', lang)} onClick={() => go('/stats')} last />
          </ul>
        </nav>

        {earned.length > 0 && (
          <section className="panel stack--tight">
            <h2 className="t-sub">{t('Жетістіктер', 'Достижения', lang)} · {earned.length} / {achievements.length}</h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {earned.map(a => (
                <li key={a.id} className="tab" style={{ cursor: 'default' }}>
                  {lang === 'kz' ? a.titleKz : a.titleRu}
                </li>
              ))}
            </ul>
          </section>
        )}
      </motion.div>
    </div>
  );
}

function NavRow({ title, sub, onClick, last }: { title: string; sub: string; onClick: () => void; last?: boolean }) {
  return (
    <li>
      <button
        className="lesson-row"
        style={{ gridTemplateColumns: '1fr auto', borderBottom: last ? 'none' : undefined }}
        onClick={onClick}
      >
        <span>
          <span className="lesson-row__title" style={{ display: 'block' }}>{title}</span>
          <span className="lesson-row__sub">{sub}</span>
        </span>
        <span className="t-small">→</span>
      </button>
    </li>
  );
}
