import { useApp } from '../hooks/useApp';
import { useStrings } from '../i18n';
import { playClickSound } from '../utils/sounds';
import type { Lang } from '../types';

const LABELS: [Lang, string][] = [['kz', 'Қаз'], ['ru', 'Рус']];

/** «Тілді өзгерту» — два положения, выбранное видно сразу. */
export default function LangSwitch() {
  const { updateSettings } = useApp();
  const { t, lang } = useStrings();

  return (
    <div className="tabs tabs--lang" role="group" aria-label={t.lang}>
      {LABELS.map(([code, label]) => (
        <button
          key={code}
          type="button"
          className={`tab${lang === code ? ' tab--active' : ''}`}
          aria-pressed={lang === code}
          onClick={() => { playClickSound(); updateSettings({ lang: code }); }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
