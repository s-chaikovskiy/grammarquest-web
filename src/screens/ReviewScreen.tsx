import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../hooks/useApp';
import { t, pluralize } from '../utils/helpers';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/sounds';
import TaskInput, { type TaskResult } from '../components/TaskInput';
import { getLessonById } from '../data';
import { todayISO } from '../utils/srs';
import type { Step } from '../types';

/**
 * Экран повторения работает по очереди интервального повторения.
 * Прежняя версия просто прогоняла пройденное подряд; теперь приложение
 * показывает то, что пора вспомнить именно сегодня, и вперёд ставит
 * задания, которые ученик уже забывал.
 */
export default function ReviewScreen() {
  const navigate = useNavigate();
  const { state, due, forecast, recordAnswer } = useApp();
  const { lang } = state;

  // Очередь фиксируется на входе: если пересчитывать её после каждого ответа,
  // карточка, отвеченная неверно, тут же выпрыгнет снова.
  const [queue] = useState(() => due);
  const [position, setPosition] = useState(0);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [tally, setTally] = useState({ correct: 0, wrong: 0 });
  const shownAt = useRef(Date.now());

  const card = queue[position];
  const step: Step | undefined = useMemo(() => {
    if (!card) return undefined;
    return getLessonById(card.lessonId)?.steps[card.stepIndex];
  }, [card]);

  const handleSubmit = (r: TaskResult) => {
    if (!card || !step) return;
    setResult(r);
    recordAnswer({
      lessonId: card.lessonId,
      stepIndex: card.stepIndex,
      taskType: step.taskType ?? 'input',
      verdict: r.verdict,
      msToAnswer: Date.now() - shownAt.current,
      hintsUsed: r.hintsUsed,
      xp: r.verdict === 'wrong' ? 0 : 5,
    });
    setTally(prev => ({
      correct: prev.correct + (r.verdict === 'wrong' ? 0 : 1),
      wrong: prev.wrong + (r.verdict === 'wrong' ? 1 : 0),
    }));
    r.verdict === 'wrong' ? playWrongSound() : playCorrectSound();
  };

  const next = () => {
    playClickSound();
    setResult(null);
    shownAt.current = Date.now();
    setPosition(p => p + 1);
  };

  const finished = !card || position >= queue.length;

  return (
    <div className="page">
      <div className="shell stack">
        <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn--quiet" onClick={() => navigate('/menu')} aria-label={t('Артқа', 'Назад', lang)}>
            ←
          </button>
          <h1 className="t-head" style={{ flex: 1 }}>{t('Қайталау', 'Повторение', lang)}</h1>
          {!finished && (
            <span className="t-small">{position + 1} / {queue.length}</span>
          )}
        </header>

        {finished ? (
          <EmptyOrDone
            reviewed={position}
            tally={tally}
            forecast={forecast}
            lang={lang}
            onLessons={() => navigate('/lessons')}
            onMenu={() => navigate('/menu')}
          />
        ) : (
          <>
            <div className="progress" role="progressbar" aria-valuenow={position} aria-valuemin={0} aria-valuemax={queue.length}>
              <div className="progress__fill" style={{ width: `${(position / queue.length) * 100}%` }} />
            </div>

            {card.lapses > 0 && (
              <p className="t-small">
                {t('Бұл тапсырманы бұрын ұмытқансың', 'Это задание уже забывалось', lang)} · {card.lapses}×
              </p>
            )}

            <>
              {!result && step && (
                <TaskInput
                  key={card.id}
                  step={step}
                  lang={lang}
                  onSubmit={handleSubmit}
                  onSkip={() => handleSubmit({ verdict: 'wrong', userAnswer: '', hintsUsed: 0 })}
                />
              )}

              {result && step && (
                <motion.div
                  key={`${card.id}-verdict`}
                  className="stack"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                >
                  <section className={`verdict ${result.verdict === 'wrong' ? 'verdict--no' : 'verdict--ok'}`}>
                    <span className="verdict__title">
                      {result.verdict === 'wrong' ? t('Қате', 'Не совпало', lang) : t('Дұрыс!', 'Верно!', lang)}
                    </span>
                    {result.verdict !== 'correct' && (
                      <div>
                        <p className="t-small">{t('Дұрыс жауап', 'Правильный ответ', lang)}</p>
                        <p className="verdict__answer">{step.answerKz}</p>
                        <p className="t-ru">{step.answerRu}</p>
                      </div>
                    )}
                    {result.note && <p className="t-small">{result.note}</p>}
                  </section>
                  <button className="btn btn--primary btn--block" onClick={next}>
                    {position + 1 >= queue.length ? t('Қорытынды', 'Итоги', lang) : t('Келесі', 'Дальше', lang)}
                  </button>
                </motion.div>
              )}
            </>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyOrDone({ reviewed, tally, forecast, lang, onLessons, onMenu }: {
  reviewed: number;
  tally: { correct: number; wrong: number };
  forecast: number[];
  lang: 'kz' | 'ru';
  onLessons: () => void;
  onMenu: () => void;
}) {
  const upcoming = forecast.slice(1).reduce((a, b) => a + b, 0);

  if (reviewed === 0) {
    return (
      <section className="panel panel--raised stack--tight">
        <h2 className="t-sub">{t('Бүгінге қайталау жоқ', 'На сегодня повторять нечего', lang)}</h2>
        <p className="t-small">
          {t(
            'Тапсырмалар сабақтан кейін қайталауға түседі.',
            'Задания попадают сюда после уроков: приложение возвращает их ровно тогда, когда их пора вспомнить.',
            lang
          )}
        </p>
        {upcoming > 0 && (
          <p className="t-small">
            {t('Жақын күндері', 'В ближайшие дни', lang)}: {lang === 'kz' ? `${upcoming} тапсырма` : pluralize(upcoming, 'задание', 'задания', 'заданий')}
          </p>
        )}
        <button className="btn btn--primary btn--block" onClick={onLessons}>
          {t('Сабаққа өту', 'Перейти к урокам', lang)}
        </button>
      </section>
    );
  }

  return (
    <section className="panel panel--raised stack--tight">
      <h2 className="t-sub">{t('Қайталау аяқталды', 'Повторение завершено', lang)}</h2>
      <p className="t-body">
        {t('Дұрыс', 'Верно', lang)}: <strong>{tally.correct}</strong> / {reviewed}
      </p>
      <p className="t-small">
        {t(
          'Қателескендері ертең қайта келеді.',
          'То, что не вспомнилось, вернётся завтра. Остальное — через несколько дней.',
          lang
        )}
      </p>
      <p className="t-small">{t('Бүгін', 'Сегодня', lang)}: {todayISO()}</p>
      <button className="btn btn--primary btn--block" onClick={onMenu}>
        {t('Мәзірге', 'В меню', lang)}
      </button>
    </section>
  );
}
