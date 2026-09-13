import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useStrings } from '../i18n';
import { playCorrectSound, playWrongSound, playClickSound } from '../utils/sounds';
import { stopSpeaking } from '../utils/speech';
import { isCorrect } from '../utils/verdict';
import Character from '../components/Character';
import SpeakButton from '../components/SpeakButton';
import TaskInput from '../components/TaskInput';
import ScreenHeader from '../components/ScreenHeader';
import { getLessonById, lessons } from '../data';

type Phase = 'dialogue' | 'rule' | 'task' | 'summary';

/**
 * Тема: каждое задание проходит три шага в порядке учителя —
 * диалог Айши и мұғалім, правило, задание с выбором ответа.
 */
export default function LessonScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { saveResult } = useApp();
  const { t, ru } = useStrings();

  const lesson = getLessonById(id ?? '');
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('dialogue');
  const [checked, setChecked] = useState<string[] | null>(null);
  const [correct, setCorrect] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);

  /** Уходя с темы, глушим звук: иначе реплика звучала бы уже на списке тем. */
  useEffect(() => stopSpeaking, []);

  if (!lesson) {
    return (
      <div className="page">
        <div className="shell stack">
          <h1 className="t-head">{t.notFound}</h1>
          <button className="btn btn--primary" onClick={() => navigate('/learn')}>{t.toLessons}</button>
        </div>
      </div>
    );
  }

  const step = lesson.steps[stepIndex];
  const total = lesson.steps.length;
  const isLast = stepIndex === total - 1;
  const ok = checked !== null && isCorrect(step.task, checked);
  const nextLesson = lessons[lessons.findIndex(l => l.id === lesson.id) + 1];

  const go = (next: Phase) => {
    playClickSound();
    stopSpeaking();
    setPhase(next);
  };

  const check = (picked: string[]) => {
    const right = isCorrect(step.task, picked);
    setChecked(picked);
    if (right) {
      setCorrect(c => c + 1);
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  const goNext = () => {
    playClickSound();
    stopSpeaking();
    if (isLast) {
      saveResult(lesson.id, correct, total);
      setPhase('summary');
      return;
    }
    setStepIndex(i => i + 1);
    setChecked(null);
    setPhase('dialogue');
  };

  const restart = () => {
    playClickSound();
    setStepIndex(0);
    setChecked(null);
    setCorrect(0);
    setPhase('dialogue');
  };

  const answered = stepIndex + (checked !== null || phase === 'summary' ? 1 : 0);
  const flow: [Phase, string][] = [['dialogue', t.flow.dialogue[0]], ['rule', t.flow.rule[0]], ['task', t.flow.task[0]]];
  const at = flow.findIndex(([p]) => p === phase);

  return (
    <div className="page">
      <div className="shell stack">
        <h1 className="sr-only">{lesson.titleKz}</h1>

        <ScreenHeader
          back={{ to: '/learn', label: t.toLessons }}
          right={<span className="t-small">{lesson.titleKz} · {Math.min(stepIndex + 1, total)} / {total}</span>}
          onLeave={() => {
            // Спрашиваем, только если есть что терять.
            if (phase === 'summary' || answered === 0) return true;
            setConfirmLeave(true);
            return false;
          }}
        />

        <div className="progress" role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total}>
          <div className="progress__fill" style={{ transform: `scaleX(${answered / total})` }} />
        </div>

        {phase !== 'summary' && (
          <ol className="flow" aria-label={t.threeSteps}>
            {flow.map(([key, label], i) => (
              <li
                key={key}
                className={`flow__step${i < at ? ' flow__step--done' : i === at ? ' flow__step--now' : ''}`}
                aria-current={i === at ? 'step' : undefined}
              >
                {label}
              </li>
            ))}
          </ol>
        )}

        {confirmLeave && (
          <section className="panel panel--raised stack--tight" role="alertdialog" aria-label={t.leaveTitle}>
            <strong>{t.leaveTitle}</strong>
            <p className="t-small">{t.leaveText}</p>
            <div className="task__actions">
              <button className="btn btn--ghost" onClick={() => setConfirmLeave(false)}>{t.stay}</button>
              <button className="btn btn--primary" onClick={() => { playClickSound(); navigate('/learn'); }}>{t.leave}</button>
            </div>
          </section>
        )}

        <div key={`${stepIndex}-${phase}`} className="stack rise">
          {phase === 'dialogue' && (
            <>
              <section className="panel panel--raised">
                <ul className="dialogue">
                  {step.dialogue.map((line, i) => (
                    <li key={i} className="dialogue__line">
                      {/* Пока звучит реплика, её герой покачивается в такт. */}
                      <Character name={line.who} size={56} speaks={line.kz} />
                      <div className="dialogue__body">
                        <span className="dialogue__who">{t.names[line.who]}</span>
                        <div className="dialogue__say">
                          <p className="t-kz">{line.kz}</p>
                          <SpeakButton text={line.kz} label={`${t.listen}: ${t.names[line.who]}`} />
                        </div>
                        {ru && <p className="t-ru">{line.ru}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <button className="btn btn--primary btn--block" onClick={() => go('rule')}>{t.toRule}</button>
            </>
          )}

          {phase === 'rule' && (
            <>
              <section className="panel panel--raised stack--tight">
                <div className="rule__head">
                  <Character name="teacher" size={48} emotion="finger_up" />
                  <span className="task__badge">{t.flow.rule[0]}</span>
                </div>
                <p className="t-kz" style={{ whiteSpace: 'pre-line' }}>{step.ruleKz}</p>
                {ru && (
                  <>
                    <hr className="divider" />
                    <p className="t-ru" style={{ whiteSpace: 'pre-line' }}>{step.ruleRu}</p>
                  </>
                )}
              </section>
              <button className="btn btn--primary btn--block" onClick={() => go('task')}>{t.toTask}</button>
            </>
          )}

          {phase === 'task' && (
            <>
              <TaskInput key={stepIndex} task={step.task} checked={checked} onCheck={check} />

              {checked !== null && (
                <section className={`verdict ${ok ? 'verdict--ok' : 'verdict--no'}`} aria-live="polite">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Учитель реагирует на ответ: одобрение или «обрати внимание». */}
                    <Character
                      name="teacher"
                      size={56}
                      mood={ok ? 'correct' : 'wrong'}
                      emotion={ok ? 'like' : 'finger_up'}
                    />
                    <span className="verdict__title">{ok ? t.correct : t.wrong}</span>
                  </div>
                  {!ok && <p className="t-small">{t.rightAnswer}</p>}
                  {/* Окончание само по себе не произносится: после «-нші» звучит
                      готовое слово «Жетінші». Остальные ответы показаны один раз,
                      у каждого своя кнопка — в задании «отметь все» их несколько. */}
                  {!ok && step.task.result && (
                    <p className="verdict__answer">{step.task.answers.join(', ')}</p>
                  )}
                  {(step.task.result ? [step.task.result] : step.task.answers.filter(a => !a.startsWith('-'))).map(word => (
                    <p key={word} className="verdict__answer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {word}
                      <SpeakButton text={word} label={`${t.listen}: ${word}`} />
                    </p>
                  ))}
                </section>
              )}

              {checked !== null && (
                <button className="btn btn--primary btn--block" onClick={goNext}>
                  {isLast ? t.finish : t.next}
                </button>
              )}
            </>
          )}

          {phase === 'summary' && (
            <>
              <section className={`summary-hero summary-hero--${correct === total ? 'perfect' : correct * 10 >= total * 7 ? 'good' : 'weak'}`}>
                <div className="summary-hero__figure">
                  <Character
                    name="teacher"
                    size={72}
                    mood={correct * 10 >= total * 7 ? 'correct' : 'hint'}
                    emotion={correct * 10 >= total * 7 ? 'like' : 'finger_up'}
                  />
                </div>
                <div className="summary-hero__text">
                  <p className="summary-hero__score">{correct} / {total}</p>
                  {/* Счёт крупно стоит строкой выше; подпись словами нужна
                      экранному диктору, но не глазу — второй раз он не показывается. */}
                  <p className="t-small">{t.summary}<span className="sr-only"> · {t.score(correct, total)}</span></p>
                </div>
              </section>

              <div className="task__actions">
                <button className="btn btn--ghost" onClick={restart}>{t.again}</button>
                {nextLesson
                  ? <button className="btn btn--primary" onClick={() => { playClickSound(); navigate(`/lesson/${nextLesson.id}`); }}>{t.nextLesson}</button>
                  : <button className="btn btn--primary" onClick={() => { playClickSound(); navigate('/learn'); }}>{t.toLessons}</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
