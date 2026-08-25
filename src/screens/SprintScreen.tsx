import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/sounds';
import { foldKazakh } from '../utils/answer';
import { plural } from '../utils/helpers';
import { vocabulary } from '../data';
import type { VocabWord } from '../types';
import ScreenHeader from '../components/ScreenHeader';

const DURATION = 60;
const OPTIONS = 4;

interface Round {
  word: VocabWord;
  options: string[];
}

/**
 * Спринт — шестьдесят секунд на как можно больше верных ответов.
 *
 * Единственный режим, где важна скорость: он превращает узнавание слова
 * в рефлекс. Ошибка не заканчивает игру, а отнимает три секунды — это
 * подталкивает думать, а не жать наугад.
 *
 * Рекорд хранится на устройстве, никакого сервера и таблицы лидеров:
 * школьник соревнуется сам с собой.
 */
export default function SprintScreen() {
  const navigate = useNavigate();
  const { state, setRecord, recordAnswer } = useApp();

  const pool = useMemo(
    () => vocabulary.filter(w => w.level <= state.settings.level && w.ru && w.lessons.length > 0),
    [state.settings.level]
  );

  const [phase, setPhase] = useState<'intro' | 'run' | 'over'>('intro');
  const [left, setLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState<Round | null>(null);
  const [flash, setFlash] = useState<'ok' | 'no' | null>(null);
  const endsAt = useRef(0);
  const shownAt = useRef(0);

  const nextRound = useCallback(() => {
    if (pool.length < OPTIONS) return;
    const word = pool[Math.floor(Math.random() * pool.length)];
    const wrong = new Set<string>();
    let guard = 0;
    while (wrong.size < OPTIONS - 1 && guard++ < 200) {
      const cand = pool[Math.floor(Math.random() * pool.length)];
      if (foldKazakh(cand.ru) !== foldKazakh(word.ru)) wrong.add(cand.ru);
    }
    const options = [...wrong, word.ru].sort(() => Math.random() - 0.5);
    setRound({ word, options });
    shownAt.current = Date.now();
  }, [pool]);

  const start = () => {
    playClickSound();
    setScore(0);
    setStreak(0);
    setLeft(DURATION);
    endsAt.current = Date.now() + DURATION * 1000;
    setPhase('run');
    nextRound();
  };

  // Таймер считает по абсолютному времени: если вкладка засыпает,
  // счётчик не «замораживается» и игра не растягивается.
  useEffect(() => {
    if (phase !== 'run') return;
    const tick = setInterval(() => {
      const remain = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(tick);
        setPhase('over');
      }
    }, 200);
    return () => clearInterval(tick);
  }, [phase]);

  useEffect(() => {
    if (phase === 'over') setRecord('sprint', score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const pick = (option: string) => {
    if (!round || phase !== 'run') return;
    const correct = foldKazakh(option) === foldKazakh(round.word.ru);
    const ref = round.word.lessons[0];
    if (ref) {
      recordAnswer({
        lessonId: ref.lessonId,
        stepIndex: ref.stepIndex,
        taskType: 'sprint',
        verdict: correct ? 'correct' : 'wrong',
        msToAnswer: Date.now() - shownAt.current,
        hintsUsed: 0,
        xp: correct ? 1 : 0,
      });
    }

    if (correct) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      playCorrectSound();
      setFlash('ok');
    } else {
      setStreak(0);
      playWrongSound();
      setFlash('no');
      // Ошибка стоит трёх секунд — иначе выгоднее жать наугад.
      endsAt.current -= 3000;
    }
    setTimeout(() => setFlash(null), 220);
    nextRound();
  };

  const best = state.records.sprint;

  return (
    <div className={`page sprint${flash ? ` sprint--${flash}` : ''}`}>
      <div className="shell stack">
        <ScreenHeader
          back={{ to: '/practice', label: 'Практика' }}
          home
          title="Спринт"
          subtitle="Шестьдесят секунд на скорость"
          right={phase === 'run' && (
            <span className="sprint__timer" style={{ color: left <= 10 ? 'var(--error)' : undefined }}>
              {left}
            </span>
          )}
        />

        {phase === 'intro' && (
          <section className="panel panel--raised stack--tight">
            <h2 className="t-sub">Шестьдесят секунд</h2>
            <p className="t-body prose">
              Показывается казахское слово — выбери верный перевод.
              Верный ответ добавляет очко, ошибка отнимает три секунды.
            </p>
            {best > 0 && <p className="t-small">Твой рекорд: <strong>{best}</strong></p>}
            <button className="btn btn--primary btn--block" onClick={start} disabled={pool.length < OPTIONS}>
              {pool.length < OPTIONS ? 'Нужно пройти больше уроков' : 'Поехали'}
            </button>
          </section>
        )}

        {phase === 'run' && round && (
          <>
            <div className="progress">
              <div
                className="progress__fill"
                style={{
                  width: `${(left / DURATION) * 100}%`,
                  background: left <= 10 ? 'var(--error)' : 'var(--accent)',
                  transition: 'width 200ms linear',
                }}
              />
            </div>

            <div className="sprint__score">
              <span><strong>{score}</strong> очков</span>
              {streak >= 3 && <span className="pill pill--warn">{streak} подряд</span>}
            </div>

                          <p
                key={round.word.kz}
                className="sprint__word rise"
              >
                {round.word.kz}
              </p>
      
            <div className="options">
              {round.options.map(option => (
                <button key={option} type="button" className="option" onClick={() => pick(option)}>
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === 'over' && (
          <section className="panel panel--raised stack--tight">
            <h2 className="t-sub">Время вышло</h2>
            <p className="t-title" style={{ fontVariantNumeric: 'tabular-nums' }}>{score}</p>
            <p className="t-small">
              {score} {plural(score, 'верный ответ', 'верных ответа', 'верных ответов')} за минуту
            </p>
            {score >= best && score > 0
              ? <p className="t-body" style={{ color: 'var(--success)', fontWeight: 600 }}>Новый рекорд!</p>
              : <p className="t-small">Рекорд: {best}</p>}
            <div className="task__actions">
              <button className="btn btn--ghost" onClick={() => navigate('/practice')}>К практике</button>
              <button className="btn btn--primary" onClick={start}>Ещё раз</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
