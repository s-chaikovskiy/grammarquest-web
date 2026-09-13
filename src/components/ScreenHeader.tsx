import { useNavigate } from 'react-router-dom';
import { playClickSound } from '../utils/sounds';

/**
 * Шапка экрана темы.
 *
 * Голая стрелка «←» не говорит, куда ведёт, — ученик нажимает её вслепую
 * и не понимает, потеряет ли он ответы. Поэтому у кнопки всегда есть подпись.
 */
type Props = {
  /** Куда ведёт возврат и как это место называется. */
  back: { to: string; label: string };
  /** Правая часть строки: номер шага. */
  right?: React.ReactNode;
  /** Подтверждение перед уходом. Возвращает false — уход отменяется. */
  onLeave?: () => boolean;
};

export default function ScreenHeader({ back, right, onLeave }: Props) {
  const navigate = useNavigate();

  const go = () => {
    if (onLeave && !onLeave()) return;
    playClickSound();
    navigate(back.to);
  };

  return (
    <header className="topbar-wrap">
      <div className="topbar">
        <button type="button" className="topbar__back" onClick={go}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
          <span>{back.label}</span>
        </button>
        <div className="topbar__right">{right}</div>
      </div>
    </header>
  );
}
