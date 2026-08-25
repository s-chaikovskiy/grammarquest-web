import { useState, useMemo, useEffect } from 'react';

import { foldKazakh, normalizeAnswer } from '../utils/answer';
import { loadRules } from '../data';
import type { Rule } from '../types';
import ScreenHeader from '../components/ScreenHeader';

export default function RulesScreen() {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[] | null>(null);

  useEffect(() => { loadRules().then(setRules); }, []);

  /**
   * Поиск игнорирует казахские буквы: ученик ищет «косемше» с русской
   * раскладки и должен найти «көсемше».
   */
  const found = useMemo(() => {
    if (!rules) return [];
    const q = foldKazakh(normalizeAnswer(query));
    if (!q) return rules;
    return rules.filter(r =>
      foldKazakh(normalizeAnswer(`${r.titleKz} ${r.titleRu} ${r.kz} ${r.ru}`)).includes(q)
    );
  }, [query, rules]);

  return (
    <div className="stack">
        <ScreenHeader
          back={{ to: '/reference', label: 'Справка' }}
          title="Правила"
          subtitle="Поиск по всем правилам курса"
        />

        <input
          type="search"
          className="field"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск по правилам..."
          aria-label="Поиск"
        />

        {rules === null ? (
          <p className="t-small">Загружаем правила...</p>
        ) : found.length === 0 ? (
          <p className="t-small">Ничего не нашлось. Попробуй другое слово.</p>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {found.map(rule => {
              const open = openId === rule.id;
              return (
                <li key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    className="lesson-row"
                    style={{ gridTemplateColumns: '1fr auto', borderBottom: 'none' }}
                    onClick={() => setOpenId(open ? null : rule.id)}
                    aria-expanded={open}
                  >
                    <span>
                      <span className="lesson-row__title" style={{ display: 'block' }}>
                        {rule.titleRu}
                      </span>
                      <span className="lesson-row__sub">{rule.titleKz}</span>
                    </span>
                    <span className="t-small">{open ? '−' : '+'}</span>
                  </button>

                  {open && (
                    <div className="stack--tight" style={{ padding: '0 0.5rem 1.25rem' }}>
                      <p className="t-kz prose" style={{ whiteSpace: 'pre-line' }}>{rule.kz}</p>
                      <hr className="divider" />
                      <p className="t-ru prose" style={{ whiteSpace: 'pre-line' }}>{rule.ru}</p>
                      {rule.examplesKz?.length ? (
                        <ul style={{ listStyle: 'none' }} className="stack--tight">
                          {rule.examplesKz.map((ex, i) => (
                            <li key={i} className="panel" style={{ padding: '0.75rem 1rem' }}>
                              <p className="t-body">{ex}</p>
                              {rule.examplesRu?.[i] && <p className="t-ru">{rule.examplesRu[i]}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
}
