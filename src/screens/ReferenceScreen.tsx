import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';

import { loadReference } from '../data';
import type { ReferenceTopic } from '../types';
import ScreenHeader from '../components/ScreenHeader';

export default function ReferenceScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [category, setCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reference, setReference] = useState<ReferenceTopic[] | null>(null);

  useEffect(() => { loadReference().then(setReference); }, []);

  const categories = useMemo(
    () => [...new Set((reference ?? []).map(t => t.categoryRu))].sort(),
    [reference]
  );

  const topics = !reference
    ? []
    : category
      ? reference.filter(t => t.categoryRu === category)
      : reference;

  return (
    <div className="stack">
        <ScreenHeader
          back={{ to: '/reference', label: 'Справка' }}
          title="Темы курса"
          subtitle="Темы курса с примерами"
        />

        <div className="tabs" role="group" aria-label={'Категории'}>
          <button className={`tab${category === null ? ' tab--active' : ''}`} onClick={() => setCategory(null)}>Все</button>
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
          <p className="t-small">Загружаем справочник...</p>
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
                      {topic.titleRu}
                    </span>
                    <span className="lesson-row__sub">{topic.categoryRu}</span>
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
                        <span className="t-small" style={{ fontWeight: 600 }}>Примеры</span>
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
                        <span className="t-small" style={{ fontWeight: 600 }}>Частые ошибки</span>
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
  );
}
