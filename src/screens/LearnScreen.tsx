import { useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { playClickSound } from '../utils/sounds';
import { plural } from '../utils/helpers';
import Character from '../components/Character';
import { levels, LEVEL_IDS, unitsOfLevel } from '../data';
import type { LevelId } from '../data';
import type { Lesson } from '../types';

type NodeState = 'done' | 'current' | 'locked' | 'open';

/**
 * Путь обучения — главный экран.
 *
 * Список уроков не показывал, где ученик находится и что делать дальше.
 * Дорожка с узлами отвечает на оба вопроса сразу: пройденное позади,
 * следующий шаг подсвечен, дальше видно, что ещё впереди.
 *
 * Уроки не блокируются жёстко: следующий доступен всегда, а «замок» —
 * это подсказка «сюда рано», а не запрет. Школьник, которому тема уже
 * знакома, не должен продираться через всё подряд.
 */
export default function LearnScreen() {
  const navigate = useNavigate();
  const { state, updateSettings, due } = useApp();
  const level = state.settings.level as LevelId;
  const units = useMemo(() => unitsOfLevel(level), [level]);
  const currentRef = useRef<HTMLLIElement>(null);

  const isDone = (lesson: Lesson) => {
    const p = state.progress[lesson.id];
    return !!p && p.completedSteps >= p.totalSteps;
  };

  // Текущий урок — первый непройденный. Он же точка прокрутки при входе.
  const flat = units.flatMap(u => u.lessons);
  const currentId = flat.find(l => !isDone(l))?.id ?? null;

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [level]);

  const nodeState = (lesson: Lesson, indexInFlat: number): NodeState => {
    if (isDone(lesson)) return 'done';
    if (lesson.id === currentId) return 'current';
    const firstUndone = flat.findIndex(l => !isDone(l));
    return indexInFlat <= firstUndone + 2 ? 'open' : 'locked';
  };

  const doneCount = flat.filter(isDone).length;

  return (
    <div className="stack">
      <header className="stack--tight">
        {/* Заголовок первого уровня: без него разметка страницы начиналась
            сразу с H2, и экранный диктор не мог назвать, где находится. */}
        <h1 className="t-head">{levels[String(level)].titleRu}</h1>
        <div className="tabs" role="group" aria-label="Уровень">
          {LEVEL_IDS.map(id => (
            <button
              key={id}
              className={`tab${level === id ? ' tab--active' : ''}`}
              onClick={() => { playClickSound(); updateSettings({ level: id }); }}
            >
              {levels[String(id)].titleRu}
            </button>
          ))}
        </div>
        <p className="t-small">
          {levels[String(level)].grades} · пройдено {doneCount} из {flat.length}
        </p>
        <div className="progress" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={flat.length}>
          <div className="progress__fill" style={{ width: `${flat.length ? (doneCount / flat.length) * 100 : 0}%` }} />
        </div>
      </header>

      {due.length > 0 && (
        <button className="callout" onClick={() => { playClickSound(); navigate('/review'); }}>
          <Character name="teacher" size={40} />
          <span>
            <strong style={{ display: 'block' }}>Пора повторить</strong>
            <span className="t-small">
              {due.length} {plural(due.length, 'задание', 'задания', 'заданий')}{' '}
              {plural(due.length, 'ждёт', 'ждут', 'ждут')} с прошлых уроков
            </span>
          </span>
          <span aria-hidden>→</span>
        </button>
      )}

      <div className="path">
        {units.map(({ unit, lessons: unitLessons }, unitIndex) => {
          const doneHere = unitLessons.filter(isDone).length;
          return (
            <section key={unit} className="chapter">
              {/* Глава пути. Раньше здесь был безымянный заголовок тонким серым:
                  блоки не отличались друг от друга, и путь читался одним
                  длинным столбцом без структуры. */}
              <header className="chapter__head">
                <span className="chapter__title">
                  <span className="chapter__num" aria-hidden>{unitIndex + 1}</span>
                  {unit}
                </span>
                <span className="chapter__count">{doneHere}/{unitLessons.length}</span>
              </header>

              <ol className="trail">
                {unitLessons.map(lesson => {
                  const idx = flat.indexOf(lesson);
                  const st = nodeState(lesson, idx);
                  const p = state.progress[lesson.id];
                  const accuracy = p?.correct != null && p.totalSteps
                    ? Math.round((p.correct / p.totalSteps) * 100)
                    : null;
                  const open = () => { playClickSound(); navigate(`/lesson/${lesson.id}`); };

                  return (
                    <li
                      key={lesson.id}
                      ref={st === 'current' ? currentRef : undefined}
                      className={`step step--${st}`}
                    >
                      {/* Вся строка — одна кнопка: попасть пальцем легче,
                          а на широком экране строка перестала обрываться
                          на трети ширины. */}
                      <button
                        type="button"
                        className="step__hit"
                        onClick={open}
                        aria-label={`${lesson.shortRu}. ${
                          st === 'done' ? `Пройден${accuracy !== null ? `, ${accuracy} процентов верно` : ''}`
                          : st === 'current' ? 'Следующий урок' : 'Ещё не начат'}`}
                      >
                        <span className="step__dot" aria-hidden>
                          {st === 'done' ? '✓' : idx + 1}
                        </span>
                        <span className="step__body">
                          <span className="step__title">{lesson.shortRu}</span>
                          <span className="step__sub">{lesson.shortKz}</span>
                        </span>
                        <span className="step__tail" aria-hidden>
                          {st === 'current' && <span className="step__cta">Начать</span>}
                          {st === 'done' && accuracy !== null && (
                            <span className="step__score">{accuracy}%</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
