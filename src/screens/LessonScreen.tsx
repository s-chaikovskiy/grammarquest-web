import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t, getCharacterSvgName, getCharacterName } from '../utils/helpers';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/sounds';
import { fireSuccess } from '../utils/confetti';
import Character from '../components/Character';
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
  const { lang } = state;

  const lesson = getLessonById(id ?? '');
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('dialogue');
  const [result, setResult] = useState<TaskResult | null>(null);
  const [tally, setTally] = useState({ correct: 0, almost: 0, wrong: 0, xp: 0 });
  const taskShownAt = useRef<number>(Date.now());

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
          <h1 className="t-head">{t('Сабақ табылмады', 'Урок не найден', lang)}</h1>
          <button className="btn btn--primary" onClick={() => navigate('/lessons')}>
            {t('Сабақтарға', 'К урокам', lang)}
          </button>
        </div>
      </div>
    );
  }

  const step: Step = lesson.steps[stepIndex];
  const total = lesson.steps.length;
  const isLast = stepIndex === total - 1;
  const morph = result?.verdict !== 'wrong' ? splitMorph(step.answerKz, step.options) : null;

  const handleSubmit = (r: TaskResult) => {
    const xp = xpFor(r.verdict, r.hintsUsed);
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

    setTally(prev => ({
      correct: prev.correct + (r.verdict === 'correct' || r.verdict === 'correct_kz' ? 1 : 0),
      almost: prev.almost + (r.verdict === 'almost' ? 1 : 0),
      wrong: prev.wrong + (r.verdict === 'wrong' ? 1 : 0),
      xp: prev.xp + xp,
    }));

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
    if (isLast) {
      setTally(final => { finishLesson(final); return final; });
      setPhase('summary');
      return;
    }
    setStepIndex(i => i + 1);
    setResult(null);
    setPhase('dialogue');
  };

  const startTask = () => {
    playClickSound();
    taskShownAt.current = Date.now();
    setPhase('task');
  };

  const answered = stepIndex + (phase === 'verdict' || phase === 'summary' ? 1 : 0);

  return (
    <div className="page">
      <div className="shell stack">
        <header className="stack--tight">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn--quiet"
              onClick={() => { playClickSound(); navigate('/lessons'); }}
              aria-label={t('Артқа', 'Назад', lang)}
            >
              ←
            </button>
            <div style={{ flex: 1 }}>
              <p className="t-small">
                {t('Қадам', 'Шаг', lang)} {Math.min(stepIndex + 1, total)} / {total}
              </p>
            </div>
            <span className="meta meta--gold">{tally.xp} XP</span>
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
                  <Character name={getCharacterSvgName(lesson.character)} size={44} />
                  <span className="t-small" style={{ fontWeight: 600 }}>
                    {getCharacterName(lesson.character, lang)}
                  </span>
                </div>
                <p className="t-kz" style={{ whiteSpace: 'pre-line' }}>{step.dialogueKz}</p>
                <hr className="divider" />
                <p className="t-ru" style={{ whiteSpace: 'pre-line' }}>{step.dialogueRu}</p>
              </section>
              <button className="btn btn--primary btn--block" onClick={() => { playClickSound(); setPhase('grammar'); }}>
                {t('Ережеге', 'К правилу', lang)}
              </button>
            </Fade>
          )}

          {phase === 'grammar' && (
            <Fade key="grammar">
              <section className="panel panel--raised stack--tight">
                <span className="task__badge">{t('Ереже', 'Правило', lang)}</span>
                <p className="t-kz" style={{ whiteSpace: 'pre-line' }}>{step.grammarKz}</p>
                <hr className="divider" />
                <p className="t-ru" style={{ whiteSpace: 'pre-line' }}>{step.grammarRu}</p>
              </section>
              <section className="panel stack--tight">
                <span className="t-small" style={{ fontWeight: 600 }}>
                  {t('Мұғалімнің кеңесі', 'Совет учителя', lang)}
                </span>
                <p className="t-body">{step.teacherKz1}</p>
                <p className="t-ru">{step.teacherRu1}</p>
              </section>
              <button className="btn btn--primary btn--block" onClick={startTask}>
                {t('Тапсырмаға', 'К заданию', lang)}
              </button>
            </Fade>
          )}

          {phase === 'task' && (
            <TaskInput key={`task-${stepIndex}`} step={step} lang={lang} onSubmit={handleSubmit} onSkip={handleSkip} />
          )}

          {phase === 'verdict' && result && (
            <Fade key="verdict">
              <section className={`verdict ${result.verdict === 'wrong' ? 'verdict--no' : 'verdict--ok'}`}>
                <span className="verdict__title">{verdictTitle(result.verdict, lang)}</span>

                {result.verdict !== 'correct' && (
                  <div>
                    <p className="t-small">{t('Дұрыс жауап', 'Правильный ответ', lang)}</p>
                    {morph ? (
                      <p className="morph">
                        <span className="morph__stem">{morph.stem}</span>
                        <span className="morph__suffix">{morph.suffix}</span>
                      </p>
                    ) : (
                      <p className="verdict__answer">{step.answerKz}</p>
                    )}
                    <p className="t-ru">{step.answerRu}</p>
                  </div>
                )}

                {result.note && <p className="t-small">{result.note}</p>}
              </section>

              <section className="panel stack--tight">
                <span className="t-small" style={{ fontWeight: 600 }}>
                  {t('Мұғалім', 'Учитель', lang)}
                </span>
                <p className="t-body">{step.teacherKz2}</p>
                <p className="t-ru">{step.teacherRu2}</p>
              </section>

              <button className="btn btn--primary btn--block" onClick={goNext}>
                {isLast ? t('Қорытынды', 'Итоги урока', lang) : t('Келесі', 'Дальше', lang)}
              </button>
            </Fade>
          )}

          {phase === 'summary' && (
            <Fade key="summary">
              <section className="panel panel--raised stack--tight">
                <h1 className="t-head">{lesson.titleRu}</h1>
                <p className="t-small">{lesson.titleKz}</p>
                <hr className="divider" />
                <dl className="stack--tight">
                  <SummaryRow label={t('Дұрыс', 'Верно', lang)} value={`${tally.correct} / ${total}`} />
                  <SummaryRow label={t('Дерлік дұрыс', 'Почти верно', lang)} value={String(tally.almost)} />
                  <SummaryRow label={t('Қате', 'Ошибок', lang)} value={String(tally.wrong)} />
                  <SummaryRow label="XP" value={`+${tally.xp}`} />
                </dl>
                <p className="t-small">
                  {t(
                    'Қателескен тапсырмалар қайталауға түсті.',
                    'Задания с ошибками добавлены в повторение — приложение вернёт их через день.',
                    lang
                  )}
                </p>
              </section>
              <div className="task__actions">
                <button className="btn btn--ghost" onClick={() => navigate('/lessons')}>
                  {t('Сабақтарға', 'К урокам', lang)}
                </button>
                <button className="btn btn--primary" onClick={() => navigate('/review')}>
                  {t('Қайталау', 'Повторить', lang)}
                </button>
              </div>
            </Fade>
          )}
        </PhaseSwitch>
      </div>
    </div>
  );
}

function verdictTitle(verdict: Verdict, lang: 'kz' | 'ru'): string {
  switch (verdict) {
    case 'correct': return t('Дұрыс!', 'Верно!', lang);
    case 'correct_kz': return t('Грамматика дұрыс', 'Грамматика верна', lang);
    case 'almost': return t('Дерлік дұрыс', 'Почти верно', lang);
    default: return t('Қате', 'Не совпало', lang);
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
    <motion.div
      key={phase}
      className="stack"
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Обёртка содержимого одной фазы. Появление анимирует PhaseSwitch. */
function Fade({ children }: { children: React.ReactNode }) {
  return <div className="stack">{children}</div>;
}
