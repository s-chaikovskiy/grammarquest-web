import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadReference, loadRules } from '../data';
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
    // «Семь септіктер» было ошибкой в обоих языках сразу: русское
    // числительное с казахским множественным числом, которого после
    // числа в казахском не бывает («жеті септік», а не «септіктер»).
    sub: 'Падежи, число, принадлежность, глагол',
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
    title: 'Темы курса',
    sub: '22 темы подробно',
    hint: 'Разбор с примерами и частыми ошибками',
  },
  {
    to: '/help',
    title: 'Как устроено приложение',
    sub: 'Разделы, урок, проверка ответов',
    hint: 'Почему «почти верно» — это почти верно',
  },
];

export default function ReferenceHubScreen() {
  const navigate = useNavigate();

  /**
   * Правила и темы грузятся отдельно от основной сборки: вместе они около
   * 240 КБ и держали бы первый урок. Но и ждать их на самом экране плохо —
   * на школьном телефоне надпись «Загружаем справочник…» успевает попасть
   * в кадр. Начинаем загрузку здесь: пока ученик выбирает раздел, файлы
   * уже в пути, и внутри открывается сразу.
   */
  useEffect(() => {
    void loadRules().catch(() => {});
    void loadReference().catch(() => {});
  }, []);

  return (
    <div className="stack">
      <header className="stack--tight">
        <h1 className="t-head">Справка</h1>
        <p className="t-small">Правила, таблицы и объяснения. Сюда можно заглядывать прямо во время урока.</p>
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
