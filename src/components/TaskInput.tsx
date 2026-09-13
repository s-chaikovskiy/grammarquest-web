import { useState } from 'react';
import type { Task } from '../types';
import { useStrings } from '../i18n';
import { playClickSound } from '../utils/sounds';

interface Props {
  task: Task;
  /** Выбор после проверки; null — ответ ещё не дан. */
  checked: string[] | null;
  onCheck: (picked: string[]) => void;
}

/**
 * Задание — выбор верного ответа, как в документе учителя: там верный
 * вариант выделен жёлтым, здесь он подсвечивается после проверки.
 *
 * Один верный ответ засчитывается по нажатию — путь от решения до отклика
 * короче. Когда верных несколько, нужна кнопка «Тексеру»: иначе проверка
 * срабатывала бы на первом же отмеченном варианте.
 */
export default function TaskInput({ task, checked, onCheck }: Props) {
  const { t, ru } = useStrings();
  const [picked, setPicked] = useState<string[]>([]);
  const multi = task.kind === 'multi';
  const locked = checked !== null;
  const shown = checked ?? picked;

  const choose = (option: string) => {
    if (locked) return;
    playClickSound();
    if (multi) {
      setPicked(p => (p.includes(option) ? p.filter(x => x !== option) : [...p, option]));
      return;
    }
    setPicked([option]);
    // Пауза даёт увидеть свой выбор до того, как подсветится верный.
    setTimeout(() => onCheck([option]), 350);
  };

  const optionClass = (option: string) => {
    if (!locked) return shown.includes(option) ? ' option--picked' : '';
    if (task.answers.includes(option)) return ' option--right';
    return shown.includes(option) ? ' option--wrong' : '';
  };

  const slot = !multi && shown[0] ? shown[0] : '?';

  return (
    <section className="task">
      <div className="task__badge">{t.flow.task[0]}</div>
      <div className="task__prompt">
        <p className="task__prompt-kz">{task.kz}</p>
        {ru && <p className="task__prompt-ru">{task.ru}</p>}
      </div>

      {task.sentence && (
        <p className="blank-sentence">
          {task.sentence.split('...').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <span className="blank-slot">{slot}</span>}
            </span>
          ))}
        </p>
      )}

      <p className="t-small">{multi ? t.pickAll : t.pickOne}</p>

      <div className="options" role={multi ? 'group' : 'radiogroup'}>
        {task.options.map(option => (
          <button
            key={option}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={shown.includes(option)}
            disabled={locked}
            className={`option${optionClass(option)}`}
            onClick={() => choose(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {multi && !locked && (
        <button
          type="button"
          className="btn btn--primary btn--block"
          disabled={picked.length === 0}
          onClick={() => onCheck(picked)}
        >
          {t.check}
        </button>
      )}
    </section>
  );
}
