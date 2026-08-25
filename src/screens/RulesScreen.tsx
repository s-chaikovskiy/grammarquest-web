import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t } from '../utils/helpers';
import { foldKazakh, normalizeAnswer } from '../utils/answer';
import { loadRules } from '../data';
import type { Rule } from '../types';

export default function RulesScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { lang } = state;
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
    <div className="page">
      <div className="shell stack">
        <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn--quiet" onClick={() => navigate('/menu')} aria-label={t('Артқа', 'Назад', lang)}>←</button>
          <h1 className="t-head">{t('Ережелер', 'Правила', lang)}</h1>
        </header>

        <input
          type="search"
          className="field"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('Ережеден іздеу...', 'Поиск по правилам...', lang)}
          aria-label={t('Іздеу', 'Поиск', lang)}
        />

        {rules === null ? (
          <p className="t-small">{t('Жүктелуде...', 'Загружаем правила...', lang)}</p>
        ) : found.length === 0 ? (
          <p className="t-small">{t('Ештеңе табылмады', 'Ничего не нашлось. Попробуй другое слово.', lang)}</p>
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
                        {lang === 'kz' ? rule.titleKz : rule.titleRu}
                      </span>
                      <span className="lesson-row__sub">{lang === 'kz' ? rule.titleRu : rule.titleKz}</span>
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
    </div>
  );
}
