import { useNavigate } from 'react-router-dom';
import { playClickSound } from '../utils/sounds';

/**
 * Справочный раздел собран из трёх частей, потому что школьник приходит
 * сюда с разными вопросами: «какое правило», «как это устроено вообще»
 * и «какое окончание поставить прямо сейчас».
 */
const SECTIONS = [
  {
    to: '/reference/tables',
    title: 'Таблицы окончаний',
    sub: 'Семь септіктер и спряжение глагола',
    hint: 'Подставь своё слово — увидишь все его формы',
  },
  {
    to: '/reference/rules',
    title: 'Правила',
    sub: '33 правила с примерами',
    hint: 'Коротко: что и когда используется',
  },
  {
    to: '/reference/topics',
    title: 'Справочник',
    sub: '22 темы подробно',
    hint: 'Разбор с примерами и частыми ошибками',
  },
];

export default function ReferenceHubScreen() {
  const navigate = useNavigate();

  return (
    <div className="stack">
      <header className="stack--tight">
        <h1 className="t-head">Правила</h1>
        <p className="t-small">Сюда можно заглядывать прямо во время урока.</p>
      </header>

      <div className="stack--tight">
        {SECTIONS.map(s => (
          <button
            key={s.to}
            type="button"
            className="option"
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', minHeight: 'auto', padding: '1rem' }}
            onClick={() => { playClickSound(); navigate(s.to); }}
          >
            <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <strong>{s.title}</strong>
              <span aria-hidden>→</span>
            </span>
            <span className="t-small" style={{ fontWeight: 600 }}>{s.sub}</span>
            <span className="t-small" style={{ fontWeight: 400 }}>{s.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
