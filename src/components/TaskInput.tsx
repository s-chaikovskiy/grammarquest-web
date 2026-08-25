import { useState, useMemo, useRef, useEffect } from 'react';
import type { Step } from '../types';
import type { Verdict } from '../utils/answer';
import { checkAnswerDetailed, openAnswerOverlap, foldKazakh, normalizeAnswer } from '../utils/answer';


export interface TaskResult {
  verdict: Verdict;
  userAnswer: string;
  hintsUsed: number;
  /** Подсказка от движка проверки: например, как пишется слово по-казахски. */
  note?: string;
}

interface Props {
  step: Step;
  onSubmit: (result: TaskResult) => void;
  onSkip: () => void;
  /** Засчитывать выбор сразу, без кнопки «Проверить». */
  instantCheck?: boolean;
}

/**
 * Каждый тип задания вынесен в отдельный компонент.
 * Так у каждого свои хуки на верхнем уровне — в прежней версии useState
 * вызывался внутри условной функции рендера, и переключение типа задания
 * ломало порядок хуков.
 */
export default function TaskInput({ step, onSubmit, onSkip, instantCheck = true }: Props) {
  const type = step.taskType ?? 'input';
  const common = { step, onSubmit };

  return (
    <div className="task rise">
      <div className="task__badge">{taskLabel(type)}</div>

      {type === 'choice' && <ChoiceTask key={step.answerKz} {...common} instant={instantCheck} />}
      {type === 'matching' && <MatchingTask key={step.answerKz} {...common} />}
      {type === 'word_order' && <WordOrderTask key={step.answerKz} {...common} />}
      {type === 'open' && <OpenTask key={step.answerKz} {...common} />}
      {(type === 'input' || type === 'fill_blank' || type === 'translate') && (
        <WrittenTask key={step.answerKz} {...common} type={type} />
      )}

      <button type="button" className="btn btn--ghost task__skip" onClick={onSkip}>Пропустить</button>
    </div>
  );
}

function taskLabel(type: string): string {
  const map: Record<string, [string, string]> = {
    choice: ['Дұрысын таңда', 'Выбери верную форму'],
    matching: ['Сәйкестендір', 'Сопоставь форму и перевод'],
    word_order: ['Сөйлем құра', 'Собери предложение'],
    open: ['Толық жауап бер', 'Ответь развёрнуто'],
    fill_blank: ['Бос орынды толтыр', 'Заполни пропуск'],
    translate: ['Қазақшаға аудар', 'Переведи на казахский'],
    input: ['Жауабыңды жаз', 'Напиши ответ'],
  };
  const pair = map[type] ?? map.input;
  return pair[1];
}

/** Формулировка задания: по-казахски, снизу русский как подсказка. */
function Prompt({ step }: { step: Step }) {
  return (
    <div className="task__prompt">
      <p className="task__prompt-kz">{step.taskKz}</p>
      <p className="task__prompt-ru">
        <span className="task__prompt-tag">по-русски</span>
        {step.taskRu}
      </p>
    </div>
  );
}

// --- письменные задания: свободный ввод, пропуск, перевод ---------------------

function WrittenTask({ step, onSubmit, type }: {
  step: Step; onSubmit: (r: TaskResult) => void; type: string;
}) {
  const [value, setValue] = useState('');
  const [hints, setHints] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const answer = step.answerKz;
  // Подсказка открывает буквы по одной, а не весь ответ целиком.
  const revealed = useMemo(() => answer.slice(0, hints), [answer, hints]);

  const submit = () => {
    if (!value.trim()) return;
    const res = checkAnswerDetailed(value, answer);
    onSubmit({ verdict: res.verdict, userAnswer: value, hintsUsed: hints, note: res.note });
  };

  return (
    <>
      {type === 'fill_blank' && step.blank ? (
        <div className="task__prompt">
          <p className="task__prompt-kz blank-sentence">
            {step.blank.sentence.split('...').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <span className="blank-slot">{value || '?'}</span>}
              </span>
            ))}
          </p>
          {step.blank.hint && (
            <p className="task__prompt-ru">
              <span className="task__prompt-tag">исходная форма</span>
              {step.blank.hint}
            </p>
          )}
          <p className="task__prompt-ru">
            <span className="task__prompt-tag">по-русски</span>
            {step.taskRu}
          </p>
        </div>
      ) : type === 'translate' ? (
        <div className="task__prompt">
          <p className="task__prompt-kz">{step.prompt ?? step.answerRu}</p>
          <p className="task__prompt-ru">
            <span className="task__prompt-tag">задание</span>Напиши это по-казахски</p>
        </div>
      ) : (
        <Prompt step={step} />
      )}

      <input
        ref={inputRef}
        type="text"
        className="field"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Напиши ответ..."
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Поле ответа"
      />

      <KazakhKeys onInsert={ch => setValue(v => v + ch)} />

      <div className="task__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setHints(h => Math.min(h + 1, answer.length - 1))}
          disabled={hints >= answer.length - 1}
        >
          Подсказка
          {hints > 0 && <span className="btn__hint">{revealed}…</span>}
        </button>
        <button type="button" className="btn btn--primary" onClick={submit} disabled={!value.trim()}>Проверить</button>
      </div>
    </>
  );
}

/**
 * Экранная клавиатура казахских букв.
 * Их нет на русской раскладке — без этого ряда ученик физически не может
 * набрать правильный ответ на школьном компьютере или телефоне.
 */
const KZ_KEYS = ['ә', 'ғ', 'қ', 'ң', 'ө', 'ұ', 'ү', 'һ', 'і'];

function KazakhKeys({ onInsert }: { onInsert: (ch: string) => void }) {
  return (
    <div className="kzkeys" role="group" aria-label={'Казахские буквы'}>
      {KZ_KEYS.map(ch => (
        <button key={ch} type="button" className="kzkeys__key" onClick={() => onInsert(ch)} tabIndex={-1}>
          {ch}
        </button>
      ))}
    </div>
  );
}

// --- выбор из вариантов -------------------------------------------------------

function ChoiceTask({ step, onSubmit, instant }: {
  step: Step; onSubmit: (r: TaskResult) => void; instant: boolean;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const options = step.options ?? [];

  const send = (choice: string) => {
    const res = checkAnswerDetailed(choice, step.answerKz);
    onSubmit({ verdict: res.verdict, userAnswer: choice, hintsUsed: 0, note: res.note });
  };

  /**
   * При мгновенной проверке ответ засчитывается по нажатию, без кнопки
   * «Проверить»: чем короче путь между решением и обратной связью, тем лучше
   * ученик связывает одно с другим. Небольшая задержка нужна, чтобы он успел
   * увидеть, какой вариант выбрал.
   */
  const choose = (option: string) => {
    if (locked) return;
    setPicked(option);
    if (!instant) return;
    setLocked(true);
    // Пауза даёт увидеть, какой вариант был верным, до перехода к разбору.
    setTimeout(() => send(option), 480);
  };

  /** После ответа верный вариант подсвечивается зелёным, ошибочный — красным. */
  const optionClass = (option: string) => {
    if (!locked) return picked === option ? ' option--picked' : '';
    const isRight = checkAnswerDetailed(option, step.answerKz).accepted;
    if (isRight) return ' option--right';
    return picked === option ? ' option--wrong' : '';
  };

  return (
    <>
      <Prompt step={step} />
      <div className="options" role="radiogroup">
        {options.map(option => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={picked === option}
            disabled={locked}
            className={`option${optionClass(option)}`}
            onClick={() => choose(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {!instant && (
        <div className="task__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => picked && send(picked)}
            disabled={picked === null}
          >
            Проверить
          </button>
        </div>
      )}
    </>
  );
}

// --- сопоставление ------------------------------------------------------------

function MatchingTask({ step, onSubmit }: { step: Step; onSubmit: (r: TaskResult) => void }) {
  const pairs = step.pairs ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  // Перемешиваем один раз: пересортировка на каждый рендер сбивала бы выбор.
  const rights = useMemo(
    () => pairs.map(p => p.right).sort((a, b) => (foldKazakh(a) < foldKazakh(b) ? -1 : 1)),
    [pairs]
  );

  const pickRight = (right: string) => {
    if (!selected) return;
    setMatches(m => {
      // Один перевод — одной форме: снимаем прежнюю привязку этого перевода.
      const cleaned = Object.fromEntries(Object.entries(m).filter(([, v]) => v !== right));
      return { ...cleaned, [selected]: right };
    });
    setSelected(null);
  };

  const done = Object.keys(matches).length === pairs.length;

  const submit = () => {
    const correct = pairs.filter(p => matches[p.left] === p.right).length;
    const verdict: Verdict =
      correct === pairs.length ? 'correct' : correct >= pairs.length - 1 ? 'almost' : 'wrong';
    const userAnswer = pairs.map(p => `${p.left}→${matches[p.left] ?? '—'}`).join(', ');
    onSubmit({
      verdict,
      userAnswer,
      hintsUsed: 0,
      note: verdict === 'correct' ? undefined : `Верно ${correct} из ${pairs.length}`,
    });
  };

  return (
    <>
      <div className="task__prompt">
        <p className="task__prompt-kz">Соедини форму с её переводом</p>
      </div>
      <div className="match">
        <div className="match__col">
          {pairs.map(p => (
            <button
              key={p.left}
              type="button"
              className={`option option--compact${selected === p.left ? ' option--picked' : ''}${matches[p.left] ? ' option--done' : ''}`}
              onClick={() => setSelected(selected === p.left ? null : p.left)}
            >
              <span>{p.left}</span>
              {matches[p.left] && <span className="option__echo">{matches[p.left]}</span>}
            </button>
          ))}
        </div>
        <div className="match__col">
          {rights.map(right => (
            <button
              key={right}
              type="button"
              disabled={!selected}
              className={`option option--compact${Object.values(matches).includes(right) ? ' option--done' : ''}`}
              onClick={() => pickRight(right)}
            >
              {right}
            </button>
          ))}
        </div>
      </div>
      <div className="task__actions">
        <button type="button" className="btn btn--ghost" onClick={() => { setMatches({}); setSelected(null); }}>Сбросить</button>
        <button type="button" className="btn btn--primary" onClick={submit} disabled={!done}>Проверить</button>
      </div>
    </>
  );
}

// --- сборка предложения -------------------------------------------------------

function WordOrderTask({ step, onSubmit }: { step: Step; onSubmit: (r: TaskResult) => void }) {
  const tokens = step.tokens ?? step.answerKz.split(' ');
  const [built, setBuilt] = useState<number[]>([]);

  const used = new Set(built);
  const sentence = built.map(i => tokens[i]).join(' ');

  const submit = () => {
    const res = checkAnswerDetailed(sentence, step.answerKz);
    onSubmit({ verdict: res.verdict, userAnswer: sentence, hintsUsed: 0, note: res.note });
  };

  return (
    <>
      <Prompt step={step} />
      <div className="assemble" aria-live="polite">
        {built.length === 0 ? (
          <span className="assemble__empty">Нажимай на слова, чтобы собрать предложение</span>
        ) : (
          built.map((tokenIndex, position) => (
            <button
              key={`${tokenIndex}-${position}`}
              type="button"
              className="chip chip--placed"
              onClick={() => setBuilt(b => b.filter((_, i) => i !== position))}
            >
              {tokens[tokenIndex]}
            </button>
          ))
        )}
      </div>
      <div className="bank">
        {tokens.map((token, i) => (
          <button
            key={`${token}-${i}`}
            type="button"
            className="chip"
            disabled={used.has(i)}
            onClick={() => setBuilt(b => [...b, i])}
          >
            {token}
          </button>
        ))}
      </div>
      <div className="task__actions">
        <button type="button" className="btn btn--ghost" onClick={() => setBuilt([])} disabled={!built.length}>Сбросить</button>
        <button type="button" className="btn btn--primary" onClick={submit} disabled={built.length !== tokens.length}>Проверить</button>
      </div>
    </>
  );
}

// --- развёрнутый ответ с самопроверкой ----------------------------------------

/**
 * Открытые вопросы («объясни разницу между формами») автоматически проверить
 * честно нельзя. Ученик пишет свободно, затем видит эталон и сам оценивает
 * ответ — приложение лишь подсказывает, сколько ключевых слов совпало.
 */
function OpenTask({ step, onSubmit }: { step: Step; onSubmit: (r: TaskResult) => void }) {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);

  const overlap = useMemo(
    () => (revealed ? Math.round(openAnswerOverlap(value, step.answerKz) * 100) : 0),
    [revealed, value, step.answerKz]
  );

  const finish = (matched: boolean) =>
    onSubmit({ verdict: matched ? 'correct' : 'wrong', userAnswer: value, hintsUsed: revealed ? 1 : 0 });

  return (
    <>
      <Prompt step={step} />
      <textarea
        className="field field--area"
        rows={4}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Напиши своими словами..."
        aria-label="Поле ответа"
      />
      <KazakhKeys onInsert={ch => setValue(v => v + ch)} />

      {!revealed ? (
        <div className="task__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setRevealed(true)}
            disabled={normalizeAnswer(value).length < 3}
          >Сверить с эталоном</button>
        </div>
      ) : (
        <div className="selfcheck">
          <div className="selfcheck__model">
            <span className="task__prompt-tag">эталон</span>
            <p>{step.answerKz}</p>
            <p className="task__prompt-ru">{step.answerRu}</p>
          </div>
          <p className="selfcheck__overlap">
            {'Совпало ключевых слов'}: <strong>{overlap}%</strong>
          </p>
          <p className="selfcheck__question">Твой ответ по смыслу верный?</p>
          <div className="task__actions">
            <button type="button" className="btn btn--ghost" onClick={() => finish(false)}>Нет, ошибся</button>
            <button type="button" className="btn btn--primary" onClick={() => finish(true)}>Да, верно</button>
          </div>
        </div>
      )}
    </>
  );
}
