import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/sounds';
import { plural } from '../utils/helpers';
import { vocabulary } from '../data';
import type { VocabWord } from '../types';
import ScreenHeader from '../components/ScreenHeader';

const DECK_SIZE = 15;

/**
 * Карточки слов.
 *
 * Лексика отдельно от грамматики: увидел казахское слово — вспомнил перевод —
 * проверил себя. Оценка честная, её ставит сам ученик, потому что «вспомнил»
 * машина проверить не может.
 *
 * Результат идёт в тот же алгоритм интервального повторения, что и уроки:
 * забытые слова возвращаются раньше.
 */
export default function CardsScreen() {
  const navigate = useNavigate();
  const { state, recordAnswer } = useApp();

  // Колода собирается один раз за заход: слова уровня, сначала незнакомые.
  const deck = useMemo<VocabWord[]>(() => {
    const seen = new Set(Object.values(state.cards).filter(c => c.reps > 0).map(c => c.id));
    const known = (w: VocabWord) => w.lessons.some(r => seen.has(`${r.lessonId}:${r.stepIndex}`));
    const pool = vocabulary.filter(w => w.level <= state.settings.level && w.lessons.length > 0);
    const fresh = pool.filter(w => !known(w));
    const rest = pool.filter(known);
    return [...fresh, ...rest].slice(0, DECK_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [tally, setTally] = useState({ knew: 0, forgot: 0 });
  const shownAt = useRef(Date.now());

  const word = deck[index];
  const finished = index >= deck.length;

  const answer = (knew: boolean) => {
    if (!word) return;
    const ref = word.lessons[0];
    if (ref) {
      recordAnswer({
        lessonId: ref.lessonId,
        stepIndex: ref.stepIndex,
        taskType: 'card',
        verdict: knew ? 'correct' : 'wrong',
        msToAnswer: Date.now() - shownAt.current,
        hintsUsed: 0,
        xp: knew ? 3 : 0,
      });
    }
    setTally(t => ({ knew: t.knew + (knew ? 1 : 0), forgot: t.forgot + (knew ? 0 : 1) }));
    knew ? playCorrectSound() : playWrongSound();
    setFlipped(false);
    setFlipping(false);
    shownAt.current = Date.now();
    setIndex(i => i + 1);
  };

  if (deck.length === 0) {
    return (
      <div className="page">
        <div className="shell stack">
          <ScreenHeader back={{ to: '/practice', label: 'Практика' }} home title="Карточки" />
          <p className="t-small">Слова появятся после первых уроков.</p>
          <button className="btn btn--primary btn--block" onClick={() => navigate('/learn')}>К урокам</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="shell stack">
        <ScreenHeader
          back={{ to: '/practice', label: 'Практика' }}
          home
          title="Карточки"
          subtitle="Слово на казахском — вспомни перевод"
          right={!finished && <span className="t-small">{index + 1} / {deck.length}</span>}
        />

        {finished ? (
          <section className="panel panel--raised stack--tight">
            <h2 className="t-sub">Колода пройдена</h2>
            <p className="t-body">
              Вспомнил: <strong>{tally.knew}</strong> из {deck.length}
            </p>
            {tally.forgot > 0 && (
              <p className="t-small">
                {tally.forgot} {plural(tally.forgot, 'слово вернётся', 'слова вернутся', 'слов вернутся')} завтра.
              </p>
            )}
            <div className="task__actions">
              <button className="btn btn--ghost" onClick={() => navigate('/practice')}>К практике</button>
              <button className="btn btn--primary" onClick={() => window.location.reload()}>Ещё колоду</button>
            </div>
          </section>
        ) : (
          <>
            <div className="progress" role="progressbar" aria-valuenow={index} aria-valuemin={0} aria-valuemax={deck.length}>
              <div className="progress__fill" style={{ width: `${(index / deck.length) * 100}%` }} />
            </div>

            <button
              type="button"
              className={`flashcard${flipping ? ' flashcard--flipping' : ''}`}
              onClick={() => {
                if (flipped) return;
                playClickSound();
                setFlipping(true);
                // Перевод показывается на середине переворота — как у настоящей карточки.
                setTimeout(() => setFlipped(true), 210);
                setTimeout(() => setFlipping(false), 430);
              }}
              aria-live="polite"
            >
              <span className="flashcard__kz">{word.kz}</span>
                              {flipped ? (
                  <span key="ru" className="flashcard__ru rise">
                    {word.ru}
                  </span>
                ) : (
                  <span key="hint" className="flashcard__hint">нажми, чтобы проверить</span>
                )}
                      <span className="t-small">{word.unit}</span>
            </button>

            {flipped && (
              <div className="task__actions">
                <button className="btn btn--ghost" onClick={() => answer(false)}>Не вспомнил</button>
                <button className="btn btn--primary" onClick={() => answer(true)}>Вспомнил</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
