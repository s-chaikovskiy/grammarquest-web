import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { pluralize } from '../utils/helpers';
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
          <button className="btn btn--quiet" onClick={() => navigate('/learn')} aria-label={'Назад'}>
            ←
          </button>
          <h1 className="t-head" style={{ flex: 1 }}>Повторение</h1>
          {!finished && (
            <span className="t-small">{position + 1} / {queue.length}</span>
          )}
        </header>

        {finished ? (
          <EmptyOrDone
            reviewed={position}
            tally={tally}
            forecast={forecast}
            onLessons={() => navigate('/learn')}
            onMenu={() => navigate('/learn')}
          />
        ) : (
          <>
            <div className="progress" role="progressbar" aria-valuenow={position} aria-valuemin={0} aria-valuemax={queue.length}>
              <div className="progress__fill" style={{ width: `${(position / queue.length) * 100}%` }} />
            </div>

            {card.lapses > 0 && (
              <p className="t-small">
                {'Это задание уже забывалось'} · {card.lapses}×
              </p>
            )}

            <>
              {!result && step && (
                <TaskInput
                  key={card.id}
                  step={step}
                        onSubmit={handleSubmit}
                  onSkip={() => handleSubmit({ verdict: 'wrong', userAnswer: '', hintsUsed: 0 })}
                />
              )}

              {result && step && (
                <div
                  key={`${card.id}-verdict`}
                  className="stack rise"
                >
                  <section className={`verdict ${result.verdict === 'wrong' ? 'verdict--no' : 'verdict--ok'}`}>
                    <span className="verdict__title">
                      {result.verdict === 'wrong' ? 'Не совпало' : 'Верно!'}
                    </span>
                    {result.verdict !== 'correct' && (
                      <div>
                        <p className="t-small">Правильный ответ</p>
                        <p className="verdict__answer">{step.answerKz}</p>
                        <p className="t-ru">{step.answerRu}</p>
                      </div>
                    )}
                    {result.note && <p className="t-small">{result.note}</p>}
                  </section>
                  <button className="btn btn--primary btn--block" onClick={next}>
                    {position + 1 >= queue.length ? 'Итоги' : 'Дальше'}
                  </button>
                </div>
              )}
            </>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyOrDone({ reviewed, tally, forecast, onLessons, onMenu }: {
  reviewed: number;
  tally: { correct: number; wrong: number };
  forecast: number[];
  onLessons: () => void;
  onMenu: () => void;
}) {
  const upcoming = forecast.slice(1).reduce((a, b) => a + b, 0);

  if (reviewed === 0) {
    return (
      <section className="panel panel--raised stack--tight">
        <h2 className="t-sub">На сегодня повторять нечего</h2>
        <p className="t-small">Задания попадают сюда после уроков: приложение возвращает их ровно тогда, когда их пора вспомнить.</p>
        {upcoming > 0 && (
          <p className="t-small">
            {'В ближайшие дни'}: {pluralize(upcoming, 'задание', 'задания', 'заданий')}
          </p>
        )}
        <button className="btn btn--primary btn--block" onClick={onLessons}>Перейти к урокам</button>
      </section>
    );
  }

  return (
    <section className="panel panel--raised stack--tight">
      <h2 className="t-sub">Повторение завершено</h2>
      <p className="t-body">
        {'Верно'}: <strong>{tally.correct}</strong> / {reviewed}
      </p>
      <p className="t-small">То, что не вспомнилось, вернётся завтра. Остальное — через несколько дней.</p>
      <p className="t-small">{'Сегодня'}: {todayISO()}</p>
      <button className="btn btn--primary btn--block" onClick={onMenu}>В меню</button>
    </section>
  );
}
