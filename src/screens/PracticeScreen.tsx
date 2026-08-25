import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { playClickSound } from '../utils/sounds';
import { plural } from '../utils/helpers';
import { todayISO } from '../utils/srs';
import { vocabulary } from '../data';

/**
 * Практика — всё, что не является прохождением нового урока.
 *
 * Три разных способа возвращаться к пройденному: повторение по расписанию
 * (полноценные задания), карточки (быстрая лексика) и спринт (скорость).
 * Они не дублируют друг друга — у каждого своя учебная задача.
 */
export default function PracticeScreen() {
  const navigate = useNavigate();
  const { state, due, forecast, daily } = useApp();

  const today = daily.find(d => d.date === todayISO());
  const answeredToday = today?.answered ?? 0;
  const goal = state.settings.dailyGoal;
  const goalPct = Math.min(100, (answeredToday / goal) * 100);
  const upcoming = forecast.slice(1).reduce((a, b) => a + b, 0);
  const best = state.records?.sprint ?? 0;

  const go = (path: string) => { playClickSound(); navigate(path); };

  return (
    <div className="stack">
      <header className="stack--tight">
        <h1 className="t-head">Практика</h1>
      </header>

      {/* Цель на день — первое, что видно: она задаёт ритм занятий. */}
      <section className="panel panel--raised stack--tight">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 className="t-sub">Цель на сегодня</h2>
          <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {answeredToday} / {goal}
          </span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={answeredToday} aria-valuemin={0} aria-valuemax={goal}>
          <div
            className="progress__fill"
            style={{ width: `${goalPct}%`, background: goalPct >= 100 ? 'var(--success)' : 'var(--accent)' }}
          />
        </div>
        <p className="t-small">
          {goalPct >= 100
            ? 'Цель выполнена. Можно продолжать — лишним не будет.'
            : `Осталось ${goal - answeredToday} ${plural(goal - answeredToday, 'задание', 'задания', 'заданий')}`}
        </p>
        {state.streak > 0 && (
          <p className="t-small">
            Серия: <strong>{state.streak}</strong> {plural(state.streak, 'день', 'дня', 'дней')} подряд
          </p>
        )}
      </section>

      <WeekCalendar activeDays={state.activeDays} />

      <section className="stack--tight">
        <h2 className="t-sub">Чем заняться</h2>

        <PracticeCard
          title="Повторение"
          sub={due.length > 0
            ? `${due.length} ${plural(due.length, 'задание', 'задания', 'заданий')} на сегодня`
            : upcoming > 0
              ? `Сегодня пусто · в ближайшие дни ${upcoming}`
              : 'Появится после первых уроков'}
          hint="Задания возвращаются ровно тогда, когда их пора вспомнить"
          disabled={due.length === 0}
          onClick={() => go('/review')}
          accent={due.length > 0}
        />

        <PracticeCard
          title="Карточки слов"
          sub={`${vocabulary.length} ${plural(vocabulary.length, 'слово', 'слова', 'слов')} из уроков`}
          hint="Быстрая лексика: увидел слово — вспомнил перевод"
          onClick={() => go('/cards')}
        />

        <PracticeCard
          title="Спринт"
          sub={best > 0 ? `Твой рекорд: ${best}` : 'Рекорда пока нет'}
          hint="Шестьдесят секунд на как можно больше верных ответов"
          onClick={() => go('/sprint')}
        />
      </section>
    </div>
  );
}

function PracticeCard({ title, sub, hint, onClick, disabled, accent }: {
  title: string; sub: string; hint: string;
  onClick: () => void; disabled?: boolean; accent?: boolean;
}) {
  return (
    <button
      type="button"
      className={`option${accent ? ' option--picked' : ''}`}
      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', minHeight: 'auto', padding: '1rem' }}
      onClick={onClick}
      disabled={disabled}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <strong>{title}</strong>
        <span aria-hidden>→</span>
      </span>
      <span className="t-small" style={{ fontWeight: 600 }}>{sub}</span>
      <span className="t-small" style={{ fontWeight: 400 }}>{hint}</span>
    </button>
  );
}

/** Неделя занятий: видно серию и пропуски, без лишних цифр. */
function WeekCalendar({ activeDays }: { activeDays: string[] }) {
  const set = new Set(activeDays);
  const days: { iso: string; label: string; active: boolean; today: boolean }[] = [];
  const names = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const iso = todayISO(d);
    days.push({ iso, label: names[d.getDay()], active: set.has(iso), today: i === 0 });
  }

  return (
    <section className="panel stack--tight">
      <h2 className="t-sub">Неделя</h2>
      <ol className="week">
        {days.map(d => (
          <li key={d.iso} className={`week__day${d.active ? ' week__day--on' : ''}${d.today ? ' week__day--today' : ''}`}>
            <span className="week__dot" aria-hidden>{d.active ? '✓' : ''}</span>
            <span className="week__label">{d.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
