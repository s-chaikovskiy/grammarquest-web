import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';

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
  const { settings } = state;
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
    <div className="stack">
        {/* Кнопки «назад» здесь нет: экран открывается из нижней панели,
            и возвращаться некуда — уход обратно делает та же панель. */}
        <header className="stack--tight">
          <h1 className="t-head">Профиль</h1>
          <p className="t-small">Прогресс, настройки и выгрузка данных</p>
        </header>

        <button className="callout" onClick={() => navigate('/help')}>
          <span>
            <strong style={{ display: 'block' }}>Как устроено приложение</strong>
            <span className="t-small">Где что лежит и по каким правилам считается ответ</span>
          </span>
          <span aria-hidden>→</span>
        </button>

        {answered === 0 ? (
          <section className="panel panel--raised stack--tight">
            <h2 className="t-sub">Пока нечего показать</h2>
            <p className="t-small">После первого урока здесь появится точность по типам заданий и график занятий.</p>
            <button className="btn btn--primary btn--block" onClick={() => navigate('/learn')}>Перейти к урокам</button>
          </section>
        ) : (
          <>
            <section className="panel panel--raised stack--tight">
              <h2 className="t-sub">Всего</h2>
              <Row label={'Ответов дано'} value={String(answered)} />
              <Row label={'Верно'} value={`${correct} · ${accuracy}%`} />
              <Row label={'Дней занятий'} value={String(state.activeDays.length)} />
              {rescueRate > 0 && (
                <>
                  <hr className="divider" />
                  <p className="t-small">
                    {'Доля верных ответов, набранных без казахских букв — старая строгая проверка засчитала бы их как ошибку:'} 
                    <strong>{Math.round(rescueRate * 100)}%</strong>
                  </p>
                </>
              )}
            </section>

            <section className="panel stack--tight">
              <h2 className="t-sub">Точность по типам заданий</h2>
              {Object.entries(perType)
                .sort((a, b) => a[1].accuracy - b[1].accuracy)
                .map(([type, s]) => {
                  const label = TASK_LABELS[type] ?? [type, type];
                  return (
                    <div key={type} className="stack--tight">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="t-small">{label[1]}</span>
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
                <h2 className="t-sub">Последние дни</h2>
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
          <h2 className="t-sub">Настройки</h2>

          <div className="stack--tight">
            <span className="t-small">Тема</span>
            <div className="tabs">
              {(['auto', 'light', 'dark'] as const).map(value => (
                <button
                  key={value}
                  className={`tab${theme === value ? ' tab--active' : ''}`}
                  onClick={() => setTheme(value)}
                >
                  {{ auto: 'Как в системе', light: 'Светлая', dark: 'Тёмная' }[value]}
                </button>
              ))}
            </div>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={e => updateSettings({ sound: e.target.checked })}
            />
            <span>
              <span className="t-body">Звуковые сигналы</span>
              <span className="t-small">Короткий отклик на верный и неверный ответ</span>
            </span>
          </label>

          <label className="switch">
            <input
              type="checkbox"
              checked={settings.instantCheck}
              onChange={e => updateSettings({ instantCheck: e.target.checked })}
            />
            <span>
              <span className="t-body">Мгновенная проверка</span>
              <span className="t-small">
                Засчитывать выбранный вариант сразу, без кнопки «Проверить»
              </span>
            </span>
          </label>

          <div className="stack--tight">
            <span className="t-small">Цель на день</span>
            <div className="tabs">
              {[5, 10, 20, 30].map(goal => (
                <button
                  key={goal}
                  className={`tab${settings.dailyGoal === goal ? ' tab--active' : ''}`}
                  onClick={() => updateSettings({ dailyGoal: goal })}
                >
                  {goal} заданий
                </button>
              ))}
            </div>
            <p className="t-small">
              Десять заданий — это примерно десять минут. Цель можно менять в любой момент.
            </p>
          </div>
        </section>

        <section className="panel stack--tight">
          <h2 className="t-sub">Выгрузка данных</h2>
          <p className="t-small prose">CSV-файл: одна строка — один ответ (дата, тип задания, результат, время на ответ). Имя и другие личные данные приложение не хранит — подпись ниже нужна только чтобы различать участников при апробации.</p>
          <input
            type="text"
            className="field"
            value={settings.participantId}
            onChange={e => updateSettings({ participantId: e.target.value })}
            placeholder="Метка участника, например «7А-12»"
            aria-label="Метка участника"
          />
          <button className="btn btn--ghost btn--block" onClick={exportCsv} disabled={answered === 0}>
            {'Скачать CSV'} {answered > 0 && `(${answered})`}
          </button>
        </section>

        <section className="panel stack--tight">
          {!confirmReset ? (
            <button className="btn btn--quiet" onClick={() => setConfirmReset(true)}>Сбросить прогресс</button>
          ) : (
            <>
              <p className="t-small">Прогресс, карточки повторения и статистика будут удалены без возможности вернуть.</p>
              <div className="task__actions">
                <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>Отмена</button>
                <button
                  className="btn btn--primary"
                  style={{ background: 'var(--error)' }}
                  onClick={() => { resetProgress(); setConfirmReset(false); }}
                >Сбросить</button>
              </div>
            </>
          )}
        </section>
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
