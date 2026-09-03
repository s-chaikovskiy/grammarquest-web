import { useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { playClickSound } from '../utils/sounds';
import { plural } from '../utils/helpers';
import Character from '../components/Character';
import ProgressRing from '../components/ProgressRing';
import Ornament from '../components/Ornament';
import { levels, LEVEL_IDS, unitsOfLevel } from '../data';
import type { LevelId } from '../data';
import type { Lesson } from '../types';

type NodeState = 'done' | 'current' | 'locked' | 'open';

/**
 * Цвета глав.
 *
 * Три цвета по кругу, а не по одному на каждую главу: цветов должно быть
 * меньше, чем блоков, иначе экран становится пёстрым, а различение
 * перестаёт работать — глаз запоминает три оттенка, но не восемь.
 */
const CHAPTER_COLORS = ['var(--accent)', 'var(--success)', 'var(--amber)'];

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

  /* Обращение по времени суток.
     Мелочь, но именно от неё экран перестаёт выглядеть таблицей:
     приложение здоровается, а не открывает раздел.

     Пары были неверными: «Сәлеметсіз бе» — это «здравствуйте», а не
     «доброе утро», и рядом с русским переводом получалась неправда.
     В приложении, которое учит языку, подпись обязана быть переводом
     того, что написано выше. Здесь ровно тот ряд, которому учат
     в школе: таң — утро, күн — день, кеш — вечер, түн — ночь. */
  const hour = new Date().getHours();
  const [greetKz, greetRu] =
    hour < 5 ? ['Қайырлы түн!', 'Доброй ночи'] :
    hour < 12 ? ['Қайырлы таң!', 'Доброе утро'] :
    hour < 18 ? ['Қайырлы күн!', 'Добрый день'] :
    ['Қайырлы кеш!', 'Добрый вечер'];

  return (
    <div className="stack">
      <header className="stack--tight">
        {/* Заголовок первого уровня: без него разметка страницы начиналась
            сразу с H2, и экранный диктор не мог назвать, где находится. */}
        {/*
          Приветственный блок.

          Раньше экран начинался с заголовка уровня — служебной надписи,
          к которой не возвращаются. Теперь первым идёт то, ради чего
          открывают приложение: обращение, доля пройденного и кто ты сегодня.
          Цветная панель с орнаментом отделяет «кто я» от «что делать».
        */}
        <section className="greet">
          <Ornament opacity={0.1} tile={92} />
          <div className="greet__text">
            {/* Крупно — казахское приветствие, под ним перевод и уровень.
                Раньше крупнее всего стояло название уровня: надпись, которая
                тут же повторялась кнопкой ниже и без неё ничего не значила.
                Теперь самое заметное место занято тем, ради чего приложение
                и открывают, — живой казахской фразой. */}
            <h1 className="greet__title">{greetKz}</h1>
            <p className="greet__hi">{greetRu}</p>
            <p className="greet__sub">
              Уровень «{levels[String(level)].titleRu}» · {levels[String(level)].grades}
            </p>
          </div>
          <div className="greet__figure" aria-hidden>
            <Character name="girl" size={112} />
          </div>
        </section>

        {/* Показатели вынесены под приветствие отдельными плитками: в самой
            панели портрет и кольцо спорили за правый край. */}
        <div className="tiles">
          <div className="tile">
            <ProgressRing value={doneCount} total={flat.length} size={52} />
            <div className="tile__text">
              <strong>Пройдено</strong>
              <span>{doneCount} из {flat.length} уроков</span>
            </div>
          </div>
          <div className="tile">
            <span className="tile__num">{state.streak}</span>
            <div className="tile__text">
              <strong>{plural(state.streak, 'День', 'Дня', 'Дней')} подряд</strong>
              <span>{state.streak > 0 ? 'Серия идёт' : 'Начни сегодня'}</span>
            </div>
          </div>
        </div>

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

      <div className="path rise-in">
        {units.map(({ unit, lessons: unitLessons }, unitIndex) => {
          const doneHere = unitLessons.filter(isDone).length;
          return (
            <section
              key={unit}
              className={`chapter panel panel--tray${doneHere === unitLessons.length ? ' chapter--done' : ''}`}
              style={{ '--chapter': CHAPTER_COLORS[unitIndex % CHAPTER_COLORS.length] } as React.CSSProperties}
            >
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
                          {st === 'current' && (
                            /* Стрелка не стоит голой рядом с надписью: у неё
                               свой кружок, вложенный в кнопку. Так у элемента
                               появляется внутренняя структура, а при наведении
                               кружок сдвигается внутри неподвижной кнопки. */
                            <span className="cta">
                              Начать
                              <span className="cta__ring" aria-hidden>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                                     stroke="currentColor" strokeWidth="2.4"
                                     strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12h13M12 5l7 7-7 7" />
                                </svg>
                              </span>
                            </span>
                          )}
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
