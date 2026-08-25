import { useNavigate } from 'react-router-dom';
import { playClickSound } from '../utils/sounds';

/**
 * Шапка экрана — одна на всё приложение.
 *
 * Раньше каждый экран рисовал свою: где-то `btn--quiet` со стрелкой, где-то
 * стрелка с подписью, где-то ничего. Голая стрелка «←» не говорит, куда
 * ведёт, — ученик нажимает её вслепую и не понимает, потеряет ли он урок.
 * Поэтому у кнопки всегда есть подпись с названием места назначения.
 *
 * Кнопка «На главный» появляется там, где возврат ведёт не на путь обучения:
 * дублировать её рядом с кнопкой «К урокам» смысла нет.
 */
type Props = {
  /** Куда ведёт возврат и как это место называется. */
  back: { to: string; label: string };
  /** Заголовок экрана. Ставится отдельной строкой — так он не сжимается. */
  title?: string;
  /** Подпись под заголовком. */
  subtitle?: React.ReactNode;
  /** Показать кнопку «На главный». Не нужна, если возврат и так ведёт туда. */
  home?: boolean;
  /** Правая часть строки: счётчики, таймер, XP. */
  right?: React.ReactNode;
  /** Подтверждение перед уходом. Возвращает false — уход отменяется. */
  onLeave?: () => boolean;
};

export default function ScreenHeader({ back, title, subtitle, home, right, onLeave }: Props) {
  const navigate = useNavigate();

  const go = (to: string) => {
    if (onLeave && !onLeave()) return;
    playClickSound();
    navigate(to);
  };

  return (
    <header className="topbar-wrap">
      <div className="topbar">
        <button type="button" className="topbar__back" onClick={() => go(back.to)}>
          <BackIcon />
          <span>{back.label}</span>
        </button>

        <div className="topbar__right">
          {right}
          {home && (
            <button
              type="button"
              className="topbar__home"
              onClick={() => go('/learn')}
              title="На главный экран"
            >
              <HomeIcon />
              <span className="sr-only">На главный экран</span>
            </button>
          )}
        </div>
      </div>

      {title && (
        <div className="stack--tight">
          <h1 className="t-head">{title}</h1>
          {subtitle && <p className="t-small">{subtitle}</p>}
        </div>
      )}
    </header>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}
