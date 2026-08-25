import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { playClickSound } from '../utils/sounds';

/**
 * Каркас с нижней панелью.
 *
 * Раньше всё висело на одном экране-меню, и до словаря или статистики нужно
 * было возвращаться назад через несколько шагов. Постоянная панель делает
 * четыре главных раздела доступными в одно касание — так устроены все
 * приложения, которыми школьник пользуется каждый день.
 */
const TABS = [
  { to: '/learn', label: 'Учиться', icon: PathIcon },
  { to: '/practice', label: 'Практика', icon: RepeatIcon },
  { to: '/dictionary', label: 'Словарь', icon: BookIcon },
  { to: '/reference', label: 'Правила', icon: RulesIcon },
  { to: '/stats', label: 'Профиль', icon: ChartIcon },
];

export default function AppShell() {
  const { due } = useApp();
  const location = useLocation();

  return (
    <>
      <div className="page page--tabbed">
        <div className="shell" key={location.pathname}>
          <Outlet />
        </div>
      </div>

      <nav className="tabbar" aria-label="Разделы">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => playClickSound()}
            className={({ isActive }) => `tabbar__item${isActive ? ' tabbar__item--active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <span style={{ position: 'relative' }}>
                  <Icon filled={isActive} />
                  {to === '/practice' && due.length > 0 && (
                    <span className="tabbar__badge">{due.length > 99 ? '99+' : due.length}</span>
                  )}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

/* Иконки нарисованы вручную одним набором: одинаковая сетка 24, одна толщина
   линии. Эмодзи выглядят по-разному на каждой платформе и ломают ряд. */

type IconProps = { filled?: boolean };

function base(filled?: boolean) {
  return {
    className: 'tabbar__icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: filled ? 2.2 : 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

function PathIcon({ filled }: IconProps) {
  return (
    <svg {...base(filled)}>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M6 15.5V11a3 3 0 0 1 3-3h6a3 3 0 0 0 3-3" />
    </svg>
  );
}

function RepeatIcon({ filled }: IconProps) {
  return (
    <svg {...base(filled)}>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" />
      <path d="M4 20v-4h4" />
    </svg>
  );
}

function BookIcon({ filled }: IconProps) {
  return (
    <svg {...base(filled)}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 0 4 20.5z" />
      <path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H19" />
      <path d="M8 8h7" />
    </svg>
  );
}

function RulesIcon({ filled }: IconProps) {
  return (
    <svg {...base(filled)}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function ChartIcon({ filled }: IconProps) {
  return (
    <svg {...base(filled)}>
      <path d="M5 20V13" />
      <path d="M12 20V5" />
      <path d="M19 20v-4" />
    </svg>
  );
}
