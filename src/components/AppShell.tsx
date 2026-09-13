import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { playClickSound } from '../utils/sounds';
import { useStrings } from '../i18n';
import LangSwitch from './LangSwitch';

/**
 * Каркас списка тем: имя приложения, возврат на первый экран и переключатель
 * языка. Нижней панели больше нет — разделов, между которыми она водила,
 * в приложении не осталось.
 */
export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useStrings();

  return (
    <div className="page">
      <div className="shell">
        <header className="appbar">
          <button
            type="button"
            className="appbar__mark"
            onClick={() => { playClickSound(); navigate('/'); }}
            title={t.home}
          >
            <span className="appbar__glyph" aria-hidden>қ</span>
            <span className="appbar__name">Тілашар</span>
            <span className="sr-only">{t.home}</span>
          </button>
          <LangSwitch />
        </header>

        <div key={location.pathname} className="shell__view view-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
