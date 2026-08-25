import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t } from '../utils/helpers';
import { loadReference } from '../data';
import type { ReferenceTopic } from '../types';

export default function ReferenceScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { lang } = state;
  const [category, setCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reference, setReference] = useState<ReferenceTopic[] | null>(null);

  useEffect(() => { loadReference().then(setReference); }, []);

  const categories = useMemo(
    () => [...new Set((reference ?? []).map(t => (lang === 'kz' ? t.categoryKz : t.categoryRu)))].sort(),
    [lang, reference]
  );

  const topics = !reference
    ? []
    : category
      ? reference.filter(t => (lang === 'kz' ? t.categoryKz : t.categoryRu) === category)
      : reference;

  return (
    <div className="page">
      <div className="shell stack">
        <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn--quiet" onClick={() => navigate('/menu')} aria-label={t('Артқа', 'Назад', lang)}>←</button>
          <h1 className="t-head">{t('Анықтамалық', 'Справочник', lang)}</h1>
        </header>

        <div className="tabs" role="group" aria-label={t('Санаттар', 'Категории', lang)}>
          <button className={`tab${category === null ? ' tab--active' : ''}`} onClick={() => setCategory(null)}>
            {t('Барлығы', 'Все', lang)}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`tab${category === cat ? ' tab--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {reference === null && (
          <p className="t-small">{t('Жүктелуде...', 'Загружаем справочник...', lang)}</p>
        )}

        <ul style={{ listStyle: 'none' }}>
          {topics.map(topic => {
            const open = openId === topic.id;
            return (
              <li key={topic.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  className="lesson-row"
                  style={{ gridTemplateColumns: '1fr auto', borderBottom: 'none' }}
                  onClick={() => setOpenId(open ? null : topic.id)}
                  aria-expanded={open}
                >
                  <span>
                    <span className="lesson-row__title" style={{ display: 'block' }}>
                      {lang === 'kz' ? topic.titleKz : topic.titleRu}
                    </span>
                    <span className="lesson-row__sub">{lang === 'kz' ? topic.categoryKz : topic.categoryRu}</span>
                  </span>
                  <span className="t-small">{open ? '−' : '+'}</span>
                </button>

                {open && (
                  <div className="stack--tight" style={{ padding: '0 0.5rem 1.25rem' }}>
                    <p className="t-kz prose" style={{ whiteSpace: 'pre-line' }}>{topic.bodyKz}</p>
                    <hr className="divider" />
                    <p className="t-ru prose" style={{ whiteSpace: 'pre-line' }}>{topic.bodyRu}</p>

                    {topic.examplesKz?.length ? (
                      <div className="panel stack--tight">
                        <span className="t-small" style={{ fontWeight: 600 }}>{t('Мысалдар', 'Примеры', lang)}</span>
                        {topic.examplesKz.map((ex, i) => (
                          <p key={i} className="t-body">
                            {ex}
                            {topic.examplesRu?.[i] && <span className="t-ru"> — {topic.examplesRu[i]}</span>}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    {/* Типичные ошибки — самая полезная часть справочника, поэтому отдельным блоком. */}
                    {topic.mistakesKz?.length ? (
                      <div className="verdict verdict--no">
                        <span className="t-small" style={{ fontWeight: 600 }}>{t('Жиі кездесетін қателер', 'Частые ошибки', lang)}</span>
                        {topic.mistakesKz.map((m, i) => (
                          <p key={i} className="t-body">
                            {m}
                            {topic.mistakesRu?.[i] && <span className="t-ru"> — {topic.mistakesRu[i]}</span>}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
