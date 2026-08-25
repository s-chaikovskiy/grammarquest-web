import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t } from '../utils/helpers';
import { byTaskType } from '../utils/metrics';

const TASK_LABELS: Record<string, [string, string]> = {
  choice: ['Таңдау', 'Выбор формы'],
  fill_blank: ['Бос орын', 'Пропуск'],
  word_order: ['Сөйлем құрау', 'Сборка предложения'],
  matching: ['Сәйкестендіру', 'Сопоставление'],
  translate: ['Аударма', 'Перевод'],
  open: ['Ашық сұрақ', 'Открытый вопрос'],
  input: ['Еркін жауап', 'Свободный ввод'],
};

/**
 * Статистика и выгрузка данных.
 *
 * Экран нужен двум людям: ученику — увидеть, какой тип заданий проседает,
 * и учителю — выгрузить обезличенный CSV для исследовательской части проекта.
 */
export default function StatsScreen() {
  const navigate = useNavigate();
  const { state, daily, rescueRate, exportCsv, updateSettings, resetProgress } = useApp();
  const { lang, settings } = state;
  const [confirmReset, setConfirmReset] = useState(false);

  const perType = byTaskType(state.events);
  const answered = state.events.length;
  const correct = state.events.filter(e => e.verdict !== 'wrong').length;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const last7 = daily.slice(-7);
  const peak = Math.max(1, ...last7.map(d => d.answered));

  const theme = document.documentElement.dataset.theme ?? 'auto';
  const setTheme = (value: 'auto' | 'light' | 'dark') => {
    if (value === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = value;
    localStorage.setItem('grammarquest_theme', value);
  };

  return (
    <div className="page">
      <div className="shell stack">
        <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn--quiet" onClick={() => navigate('/menu')} aria-label={t('Артқа', 'Назад', lang)}>←</button>
          <h1 className="t-head">{t('Статистика', 'Статистика', lang)}</h1>
        </header>

        {answered === 0 ? (
          <section className="panel panel--raised stack--tight">
            <h2 className="t-sub">{t('Мәлімет жоқ', 'Пока нечего показать', lang)}</h2>
            <p className="t-small">
              {t(
                'Бірінші сабақтан кейін осында статистика пайда болады.',
                'После первого урока здесь появится точность по типам заданий и график занятий.',
                lang
              )}
            </p>
            <button className="btn btn--primary btn--block" onClick={() => navigate('/lessons')}>
              {t('Сабаққа өту', 'Перейти к урокам', lang)}
            </button>
          </section>
        ) : (
          <>
            <section className="panel panel--raised stack--tight">
              <h2 className="t-sub">{t('Жалпы', 'Всего', lang)}</h2>
              <Row label={t('Жауап берілді', 'Ответов дано', lang)} value={String(answered)} />
              <Row label={t('Дұрыс', 'Верно', lang)} value={`${correct} · ${accuracy}%`} />
              <Row label={t('Белсенді күндер', 'Дней занятий', lang)} value={String(state.activeDays.length)} />
              {rescueRate > 0 && (
                <>
                  <hr className="divider" />
                  <p className="t-small">
                    {t(
                      'Дұрыс жауаптардың бір бөлігі қазақ әріптерінсіз жазылған.',
                      'Доля верных ответов, набранных без казахских букв — старая строгая проверка засчитала бы их как ошибку:',
                      lang
                    )}{' '}
                    <strong>{Math.round(rescueRate * 100)}%</strong>
                  </p>
                </>
              )}
            </section>

            <section className="panel stack--tight">
              <h2 className="t-sub">{t('Тапсырма түрлері бойынша', 'Точность по типам заданий', lang)}</h2>
              {Object.entries(perType)
                .sort((a, b) => a[1].accuracy - b[1].accuracy)
                .map(([type, s]) => {
                  const label = TASK_LABELS[type] ?? [type, type];
                  return (
                    <div key={type} className="stack--tight">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="t-small">{t(label[0], label[1], lang)}</span>
                        <span className="t-small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(s.accuracy * 100)}% · {s.answered}
                        </span>
                      </div>
                      <div className="progress">
                        <div
                          className="progress__fill"
                          style={{
                            width: `${s.accuracy * 100}%`,
                            background: s.accuracy < 0.6 ? 'var(--error)' : 'var(--accent)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </section>

            {last7.length > 0 && (
              <section className="panel stack--tight">
                <h2 className="t-sub">{t('Соңғы күндер', 'Последние дни', lang)}</h2>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '6rem' }}>
                  {last7.map(d => (
                    <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                      <div
                        title={`${d.date}: ${d.answered}`}
                        style={{
                          height: `${(d.answered / peak) * 100}%`,
                          minHeight: '3px',
                          background: 'var(--accent)',
                          borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                        }}
                      />
                      <span className="t-small" style={{ textAlign: 'center', fontSize: '0.6875rem' }}>
                        {d.date.slice(8)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section className="panel stack--tight">
          <h2 className="t-sub">{t('Баптаулар', 'Настройки', lang)}</h2>

          <div className="stack--tight">
            <span className="t-small">{t('Тақырып', 'Тема', lang)}</span>
            <div className="tabs">
              {(['auto', 'light', 'dark'] as const).map(value => (
                <button
                  key={value}
                  className={`tab${theme === value ? ' tab--active' : ''}`}
                  onClick={() => setTheme(value)}
                >
                  {t(
                    { auto: 'Авто', light: 'Ашық', dark: 'Қараңғы' }[value],
                    { auto: 'Как в системе', light: 'Светлая', dark: 'Тёмная' }[value],
                    lang
                  )}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={e => updateSettings({ sound: e.target.checked })}
            />
            <span className="t-body">{t('Дыбыс', 'Звуковые сигналы', lang)}</span>
          </label>
        </section>

        <section className="panel stack--tight">
          <h2 className="t-sub">{t('Мәліметті жүктеу', 'Выгрузка данных', lang)}</h2>
          <p className="t-small prose">
            {t(
              'CSV-файл: әр жол — бір жауап. Есімдер сақталмайды.',
              'CSV-файл: одна строка — один ответ (дата, тип задания, результат, время на ответ). Имя и другие личные данные приложение не хранит — подпись ниже нужна только чтобы различать участников при апробации.',
              lang
            )}
          </p>
          <input
            type="text"
            className="field"
            value={settings.participantId}
            onChange={e => updateSettings({ participantId: e.target.value })}
            placeholder={t('Қатысушының белгісі, мысалы «7А-12»', 'Метка участника, например «7А-12»', lang)}
            aria-label={t('Қатысушының белгісі', 'Метка участника', lang)}
          />
          <button className="btn btn--ghost btn--block" onClick={exportCsv} disabled={answered === 0}>
            {t('CSV жүктеу', 'Скачать CSV', lang)} {answered > 0 && `(${answered})`}
          </button>
        </section>

        <section className="panel stack--tight">
          {!confirmReset ? (
            <button className="btn btn--quiet" onClick={() => setConfirmReset(true)}>
              {t('Прогресті тазалау', 'Сбросить прогресс', lang)}
            </button>
          ) : (
            <>
              <p className="t-small">
                {t(
                  'Барлық прогресс пен статистика жойылады. Қайтару мүмкін емес.',
                  'Прогресс, карточки повторения и статистика будут удалены без возможности вернуть.',
                  lang
                )}
              </p>
              <div className="task__actions">
                <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
                  {t('Болдырмау', 'Отмена', lang)}
                </button>
                <button
                  className="btn btn--primary"
                  style={{ background: 'var(--error)' }}
                  onClick={() => { resetProgress(); setConfirmReset(false); }}
                >
                  {t('Тазалау', 'Сбросить', lang)}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span className="t-small">{label}</span>
      <span style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
