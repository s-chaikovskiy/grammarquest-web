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
  const currentRef = useRef<HTMLDivElement>(null);

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
              {due.length} {plural(due.length, 'задание', 'задания', 'заданий')} ждут с прошлых уроков
            </span>
          </span>
          <span aria-hidden>→</span>
        </button>
      )}

      <div className="path">
        {units.map(({ unit, lessons: unitLessons }) => (
          <section key={unit} className="path__unit">
            <h2 className="path__unit-title">{unit}</h2>
            {unitLessons.map(lesson => {
              const idx = flat.indexOf(lesson);
              const st = nodeState(lesson, idx);
              const p = state.progress[lesson.id];
              const accuracy = p?.correct != null && p.totalSteps
                ? Math.round((p.correct / p.totalSteps) * 100)
                : null;

              return (
                <div
                  key={lesson.id}
                  ref={st === 'current' ? currentRef : undefined}
                  className={`node node--${st}`}
                  // Смещение по горизонтали делает дорожку дорожкой, а не столбцом.
                  style={{ marginLeft: `${(idx % 3) * 1.75}rem` }}
                >
                  <button
                    type="button"
                    className="node__dot"
                    onClick={() => { playClickSound(); navigate(`/lesson/${lesson.id}`); }}
                    aria-label={`${lesson.shortRu}, ${st === 'done' ? 'пройден' : st === 'current' ? 'следующий' : 'ещё не начат'}`}
                  >
                    {/* Пройденный — галочка, текущий — звезда, остальные — номер.
                        Пустой кружок читался как незагрузившийся элемент. */}
                    {st === 'done' ? '✓' : st === 'current' ? '★' : idx + 1}
                  </button>
                  <div className="node__body">
                    <button
                      type="button"
                      className="node__title"
                      onClick={() => { playClickSound(); navigate(`/lesson/${lesson.id}`); }}
                    >
                      {lesson.shortRu}
                    </button>
                    <p className="node__sub">
                      {lesson.shortKz}
                      {accuracy !== null && ` · ${accuracy}% верно`}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
