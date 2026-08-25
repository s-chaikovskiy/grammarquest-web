import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useCountUp } from '../hooks/useCountUp';
import { getCharacterSvgName, speakerOf, speakerName } from '../utils/helpers';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/sounds';
import { fireSuccess } from '../utils/confetti';
import Character from '../components/Character';
import Celebration from '../components/Celebration';
import SpeakButton from '../components/SpeakButton';
import TaskInput, { type TaskResult } from '../components/TaskInput';
import { getLessonById } from '../data';
import type { Step } from '../types';
import type { Verdict } from '../utils/answer';

type Phase = 'dialogue' | 'grammar' | 'task' | 'verdict' | 'summary';

/** Сколько XP стоит ответ. Подсказка уменьшает награду, но не обнуляет её. */
function xpFor(verdict: Verdict, hintsUsed: number): number {
  const base = { correct: 10, correct_kz: 8, almost: 6, wrong: 0 }[verdict];
  return Math.max(verdict === 'wrong' ? 0 : 2, base - hintsUsed * 2);
}

/**
 * Делит форму на основу и окончание по общему началу всех вариантов ответа.
 * Работает только там, где варианты отличаются именно окончанием, — тогда
 * подсветка показывает настоящую морфему, а не произвольные последние буквы.
 */
function splitMorph(answer: string, options?: string[]): { stem: string; suffix: string } | null {
  if (!options || options.length < 2) return null;
  let prefix = options[0];
  for (const o of options.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < o.length && prefix[i].toLowerCase() === o[i].toLowerCase()) i++;
    prefix = prefix.slice(0, i);
  }
  if (prefix.length < 3 || prefix.length >= answer.length) return null;
  if (!answer.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  return { stem: answer.slice(0, prefix.length), suffix: answer.slice(prefix.length) };
}

export default function LessonScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, recordAnswer, updateProgress } = useApp();

  const lesson = getLessonById(id ?? '');
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('dialogue');
  const [result, setResult] = useState<TaskResult | null>(null);
  const [tally, setTally] = useState({ correct: 0, almost: 0, wrong: 0, xp: 0 });
  /** Шаги, где ученик ошибся: из них собирается разбор в конце урока. */
  const [mistakes, setMistakes] = useState<{ stepIndex: number; given: string }[]>([]);
  const taskShownAt = useRef<number>(Date.now());
  /** Короткая подсветка счётчика в момент начисления. */
  const [bumpXp, setBumpXp] = useState(false);
  useEffect(() => {
    if (tally.xp === 0) return;
    setBumpXp(true);
    const t = setTimeout(() => setBumpXp(false), 450);
    return () => clearTimeout(t);
  }, [tally.xp]);

  /** Очередь повторного прохода по ошибкам; пустая — идёт обычный урок. */
  const [redoQueue, setRedoQueue] = useState<number[]>([]);
  const [redoPos, setRedoPos] = useState(0);

  const finishLesson = useCallback((final: typeof tally) => {
    if (!lesson) return;
    updateProgress(lesson.id, {
      lessonId: lesson.id,
      completedSteps: lesson.steps.length,
      totalSteps: lesson.steps.length,
      score: final.xp,
      correct: final.correct,
      lastPlayed: new Date().toISOString(),
    });
  }, [lesson, updateProgress]);

  if (!lesson) {
    return (
      <div className="page">
        <div className="shell stack">
          <h1 className="t-head">Урок не найден</h1>
          <button className="btn btn--primary" onClick={() => navigate('/learn')}>К урокам</button>
        </div>
      </div>
    );
  }

  const step: Step = lesson.steps[stepIndex];
  const total = lesson.steps.length;
  const isLast = stepIndex === total - 1;
  const morph = result?.verdict !== 'wrong' ? splitMorph(step.answerKz, step.options) : null;

  const handleSubmit = (r: TaskResult) => {
    const isRedo = redoQueue.length > 0;
    const xp = isRedo ? 0 : xpFor(r.verdict, r.hintsUsed);
    setResult(r);
    setPhase('verdict');

    recordAnswer({
      lessonId: lesson.id,
      stepIndex,
      taskType: step.taskType ?? 'input',
      verdict: r.verdict,
      msToAnswer: Date.now() - taskShownAt.current,
      hintsUsed: r.hintsUsed,
      xp,
    });

    // Итоги урока считаются один раз. Повторный проход по ошибкам их не
    // меняет: иначе разбор задним числом улучшал бы результат урока.
    if (!isRedo) {
      setTally(prev => ({
        correct: prev.correct + (r.verdict === 'correct' || r.verdict === 'correct_kz' ? 1 : 0),
        almost: prev.almost + (r.verdict === 'almost' ? 1 : 0),
        wrong: prev.wrong + (r.verdict === 'wrong' ? 1 : 0),
        xp: prev.xp + xp,
      }));
      if (r.verdict === 'wrong') {
        setMistakes(m => [...m, { stepIndex, given: r.userAnswer }]);
      }
    }

    if (r.verdict === 'wrong') {
      playWrongSound();
    } else {
      playCorrectSound();
      if (r.verdict === 'correct') fireSuccess();
    }
  };

  const handleSkip = () => {
    playClickSound();
    handleSubmit({ verdict: 'wrong', userAnswer: '', hintsUsed: 0 });
  };

  const goNext = () => {
    playClickSound();

    // Режим разбора ошибок идёт по своей очереди и не трогает прогресс урока.
    if (redoQueue.length) {
      const next = redoPos + 1;
      setResult(null);
      if (next >= redoQueue.length) {
        setRedoQueue([]);
        setPhase('summary');
        return;
      }
      setRedoPos(next);
      setStepIndex(redoQueue[next]);
      setPhase('task');
      taskShownAt.current = Date.now();
      return;
    }

    if (isLast) {
      setTally(final => { finishLesson(final); return final; });
      setPhase('summary');
      return;
    }
    setStepIndex(i => i + 1);
    setResult(null);
    setPhase('dialogue');
  };

  /**
   * Разбор ошибок.
   *
   * Урок не заканчивается на цифрах «столько-то верно»: ученик возвращается
   * к тем заданиям, где ошибся, и решает их заново. Повторный проход не
   * начисляет XP — он нужен, чтобы разобраться, а не чтобы набрать очки.
   */
  const redoMistakes = () => {
    playClickSound();
    const queue = mistakes.map(m => m.stepIndex);
    if (!queue.length) return;
    setRedoQueue(queue);
    setRedoPos(0);
    setStepIndex(queue[0]);
    setMistakes([]);
    setResult(null);
    setPhase('task');
    taskShownAt.current = Date.now();
  };

  const startTask = () => {
    playClickSound();
    taskShownAt.current = Date.now();
    setPhase('task');
  };

  const answered = stepIndex + (phase === 'verdict' || phase === 'summary' ? 1 : 0);
  const shownXp = useCountUp(tally.xp);

  return (
    <div className="page">
      <div className="shell stack">
        <header className="stack--tight">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn--quiet"
              onClick={() => { playClickSound(); navigate('/learn'); }}
              aria-label="Назад"
            >
              ←
            </button>
            <div style={{ flex: 1 }}>
              <p className="t-small">
                {'Шаг'} {Math.min(stepIndex + 1, total)} / {total}
              </p>
            </div>
            <span className={`meta meta--gold${bumpXp ? ' meta--bump' : ''}`}>{shownXp} XP</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={answered}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div className="progress__fill" style={{ width: `${(answered / total) * 100}%` }} />
          </div>
        </header>

        <PhaseSwitch phase={phase}>
          {phase === 'dialogue' && (
            <Fade key="dialogue">
              <section className="panel panel--raised stack--tight">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Character name={speakerOf(step.dialogueKz, lesson.character)} size={44} />
                  <span className="t-small" style={{ fontWeight: 600 }}>
                    {speakerName(step.dialogueKz, lesson.character)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                  <p className="t-kz" style={{ whiteSpace: 'pre-line', flex: 1 }}>{step.dialogueKz}</p>
                  <SpeakButton text={step.dialogueKz} label="Послушать реплику" />
                </div>
                <hr className="divider" />
                <p className="t-ru" style={{ whiteSpace: 'pre-line' }}>{step.dialogueRu}</p>
              </section>
              <button className="btn btn--primary btn--block" onClick={() => { playClickSound(); setPhase('grammar'); }}>К правилу</button>
            </Fade>
          )}

          {phase === 'grammar' && (
            <Fade key="grammar">
              <section className="panel panel--raised stack--tight">
                <span className="task__badge">Правило</span>
                <p className="t-kz" style={{ whiteSpace: 'pre-line' }}>{step.grammarKz}</p>
                <hr className="divider" />
                <p className="t-ru" style={{ whiteSpace: 'pre-line' }}>{step.grammarRu}</p>
              </section>
              <section className="panel stack--tight">
                <span className="t-small" style={{ fontWeight: 600 }}>Совет учителя</span>
                <p className="t-body">{step.teacherKz1}</p>
                <p className="t-ru">{step.teacherRu1}</p>
              </section>
              <button className="btn btn--primary btn--block" onClick={startTask}>К заданию</button>
            </Fade>
          )}

          {phase === 'task' && (
            <TaskInput
              key={`task-${stepIndex}`}
              step={step}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
              instantCheck={state.settings.instantCheck}
            />
          )}

          {phase === 'verdict' && result && (
            <Fade key="verdict">
              <section className={`verdict ${result.verdict === 'wrong' ? 'verdict--no' : 'verdict--ok'}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Персонаж меняет позу в зависимости от результата: одобрение
                      или «обрати внимание». Реакция живого собеседника читается
                      быстрее, чем цвет рамки. */}
                  <Character
                    name={getCharacterSvgName(lesson.character)}
                    size={48}
                    emotion={result.verdict === 'wrong' ? 'finger_up' : 'like'}
                  />
                  <span className="verdict__title">{verdictTitle(result.verdict)}</span>
                </div>

                {result.verdict !== 'correct' && (
                  <div>
                    <p className="t-small">Правильный ответ</p>
                    {morph ? (
                      <p className="morph">
                        <span className="morph__stem">{morph.stem}</span>
                        <span className="morph__suffix">{morph.suffix}</span>
                      </p>
                    ) : (
                      <p className="verdict__answer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {step.answerKz}
                        <SpeakButton text={step.answerKz} label="Послушать ответ" />
                      </p>
                    )}
                    <p className="t-ru">{step.answerRu}</p>
                  </div>
                )}

                {result.note && <p className="t-small">{result.note}</p>}
              </section>

              <section className="panel stack--tight">
                <span className="t-small" style={{ fontWeight: 600 }}>Учитель</span>
                <p className="t-body">{step.teacherKz2}</p>
                <p className="t-ru">{step.teacherRu2}</p>
              </section>

              <button className="btn btn--primary btn--block" onClick={goNext}>
                {isLast ? 'Итоги урока' : 'Дальше'}
              </button>
            </Fade>
          )}

          {phase === 'summary' && (
            <Fade key="summary">
              {/* Момент победы: единственное место, где движение работает
                  на впечатление. Мешать оно не может — работа уже закончена. */}
              {(() => {
                // Вид итога соответствует результату. Праздновать ноль верных
                // зелёным цветом — нечестная обратная связь: ученик перестаёт
                // доверять оценке, а вместе с ней и похвале за настоящий успех.
                const share = total ? tally.correct / total : 0;
                const tone = share === 1 ? 'perfect' : share >= 0.7 ? 'good' : 'weak';
                const caption = {
                  perfect: 'Без единой ошибки',
                  good: 'Хороший результат',
                  weak: 'Пока тяжело — стоит разобрать ошибки ниже',
                }[tone];
                return (
                  <section className={`summary-hero summary-hero--${tone}`}>
                    {/* Сцена появляется только за отличный результат: если
                        показывать её всегда, она перестаёт что-либо значить. */}
                    <Celebration active={tone === 'perfect'} />
                    <div className="summary-hero__figure">
                      <Character
                        name={getCharacterSvgName(lesson.character)}
                        size={64}
                        emotion={tone === 'weak' ? 'finger_up' : 'like'}
                      />
                    </div>
                    <div className="summary-hero__text">
                      <p className="summary-hero__score">{tally.correct} / {total}</p>
                      <p className="t-small">{caption}</p>
                    </div>
                  </section>
                );
              })()}

              <section className="panel panel--raised stack--tight">
                <h1 className="t-head">{lesson.titleRu}</h1>
                <p className="t-small">{lesson.titleKz}</p>
                <hr className="divider" />
                <dl className="stack--tight">
                  <SummaryRow label={'Верно'} value={`${tally.correct} / ${total}`} />
                  <SummaryRow label={'Почти верно'} value={String(tally.almost)} />
                  <SummaryRow label={'Ошибок'} value={String(tally.wrong)} />
                  <SummaryRow label="XP" value={`+${tally.xp}`} />
                </dl>
                <p className="t-small">Задания с ошибками добавлены в повторение — приложение вернёт их через день.</p>
              </section>

              {mistakes.length > 0 && (
                <section className="panel stack--tight">
                  <h2 className="t-sub">Что не получилось</h2>
                  {mistakes.map(({ stepIndex: si, given }) => {
                    const m = lesson.steps[si];
                    return (
                      <div key={si} className="mistake">
                        <p className="t-small">{m.taskRu}</p>
                        <p className="mistake__given">
                          {given ? `Ты написал: ${given}` : 'Задание пропущено'}
                        </p>
                        <p className="mistake__right">{m.answerKz}</p>
                        <p className="t-ru">{m.answerRu}</p>
                      </div>
                    );
                  })}
                  <button className="btn btn--primary btn--block" onClick={redoMistakes}>
                    Разобрать ошибки ({mistakes.length})
                  </button>
                  <p className="t-small">Повторный проход не начисляет XP — он нужен, чтобы разобраться.</p>
                </section>
              )}

              <div className="task__actions">
                <button className="btn btn--ghost" onClick={() => navigate('/learn')}>К урокам</button>
                <button className="btn btn--primary" onClick={() => navigate('/review')}>Повторить</button>
              </div>
            </Fade>
          )}
        </PhaseSwitch>
      </div>
    </div>
  );
}

function verdictTitle(verdict: Verdict): string {
  switch (verdict) {
    case 'correct': return 'Верно!';
    case 'correct_kz': return 'Грамматика верна';
    case 'almost': return 'Почти верно';
    default: return 'Не совпало';
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <dt className="t-small">{label}</dt>
      <dd style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{value}</dd>
    </div>
  );
}

/**
 * Смена фазы урока.
 *
 * Анимируется только появление нового экрана — анимации ухода нет намеренно.
 * AnimatePresence снимает предыдущий экран лишь после того, как доиграет его
 * exit-анимация, а на неактивной вкладке браузер тормозит requestAnimationFrame:
 * анимация не завершается, экран не размонтируется, и урок либо застревает,
 * либо накапливает мёртвые узлы. Содержимое урока не должно зависеть от того,
 * успела ли отработать анимация.
 */
function PhaseSwitch({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <div
      key={phase}
      className="stack rise"
    >
      {children}
    </div>
  );
}

/** Обёртка содержимого одной фазы. Появление анимирует PhaseSwitch. */
function Fade({ children }: { children: React.ReactNode }) {
  return <div className="stack">{children}</div>;
}
