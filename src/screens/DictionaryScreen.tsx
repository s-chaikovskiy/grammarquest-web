import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { foldKazakh, normalizeAnswer } from '../utils/answer';
import { plural } from '../utils/helpers';
import { vocabulary, levels } from '../data';
import SpeakButton from '../components/SpeakButton';
import type { VocabWord } from '../types';

/**
 * Словарь.
 *
 * Собирается из самих уроков (tools/enrich_lessons.py), поэтому не может
 * разойтись с содержанием курса: в нём ровно те слова, которые встречаются
 * в заданиях.
 *
 * Поиск работает с русской раскладки: «косемше» находит «көсемше». Без этого
 * словарём нельзя было бы пользоваться на школьном компьютере.
 */
export default function DictionaryScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [onlyLearned, setOnlyLearned] = useState(false);

  // Слово считается знакомым, если хотя бы одно задание с ним отвечено верно.
  const learned = useMemo(() => {
    const ids = new Set<string>();
    for (const card of Object.values(state.cards)) {
      if (card.reps > 0) ids.add(card.id);
    }
    return ids;
  }, [state.cards]);

  const isLearned = (w: VocabWord) =>
    w.lessons.some(ref => learned.has(`${ref.lessonId}:${ref.stepIndex}`));

  const found = useMemo(() => {
    const q = foldKazakh(normalizeAnswer(query));
    return vocabulary.filter(w => {
      if (levelFilter && w.level !== levelFilter) return false;
      if (onlyLearned && !isLearned(w)) return false;
      if (!q) return true;
      return foldKazakh(normalizeAnswer(`${w.kz} ${w.ru}`)).includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, levelFilter, onlyLearned, learned]);

  const learnedCount = useMemo(() => vocabulary.filter(isLearned).length, [learned]);

  return (
    <div className="stack">
      <header className="stack--tight">
        <h1 className="t-head">Словарь</h1>
        <p className="t-small">
          {vocabulary.length} {plural(vocabulary.length, 'слово', 'слова', 'слов')} из уроков ·
          знакомых {learnedCount}
        </p>
      </header>

      <input
        type="search"
        className="field"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск — можно с русской раскладки"
        aria-label="Поиск по словарю"
      />

      <div className="tabs" role="group" aria-label="Отбор">
        <button className={`tab${levelFilter === null ? ' tab--active' : ''}`} onClick={() => setLevelFilter(null)}>
          Все уровни
        </button>
        {[1, 2, 3].map(l => (
          <button
            key={l}
            className={`tab${levelFilter === l ? ' tab--active' : ''}`}
            onClick={() => setLevelFilter(levelFilter === l ? null : l)}
          >
            {levels[String(l)].titleRu}
          </button>
        ))}
        <button className={`tab${onlyLearned ? ' tab--active' : ''}`} onClick={() => setOnlyLearned(v => !v)}>
          Только знакомые
        </button>
      </div>

      {found.length === 0 ? (
        <p className="t-small">
          {query ? 'Ничего не нашлось. Попробуй другое слово.' : 'В этом отборе пока пусто.'}
        </p>
      ) : (
        <ul className="words">
          {found.map(word => (
            <li key={word.kz} className="word">
              <div className="word__main">
                <span className="word__kz" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {word.kz}
                  <SpeakButton text={word.kz} label={`Послушать: ${word.kz}`} />
                </span>
                <span className="word__ru">{word.ru}</span>
              </div>
              <div className="word__meta">
                {isLearned(word) && <span className="pill pill--ok">знакомо</span>}
                <span className="t-small">{word.unit}</span>
                {word.lessons[0] && (
                  <button
                    type="button"
                    className="btn btn--quiet"
                    style={{ minHeight: '2.75rem', padding: '0.25rem 0.5rem', fontSize: 'var(--text-sm)' }}
                    onClick={() => navigate(`/lesson/${word.lessons[0].lessonId}`)}
                  >
                    к уроку →
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
