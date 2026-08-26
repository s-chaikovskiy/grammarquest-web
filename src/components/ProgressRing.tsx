/**
 * Кольцо прогресса.
 *
 * Полоска отвечает «сколько осталось», кольцо — «где я сейчас». Разница
 * не косметическая: доля от целого читается по кольцу быстрее, потому что
 * у него есть начало и конец в одной точке.
 *
 * Число всегда написано текстом внутри кольца. Дуга только показывает то же
 * самое — если SVG не отрисуется, значение всё равно видно.
 *
 * Дуга рисуется сразу в своё значение, без прорисовки от нуля при появлении.
 * Такая прорисовка красива, но она держится на переходе CSS, а на скрытой
 * вкладке переходы притормаживаются: кольцо оставалось почти пустым при
 * верной подписи рядом. Переход остался только на изменение значения —
 * то есть после пройденного урока, когда ученик смотрит на экран.
 */
type Props = {
  value: number;
  total: number;
  size?: number;
  label?: string;
};

export default function ProgressRing({ value, total, size = 76, label }: Props) {
  const share = total > 0 ? Math.min(1, value / total) : 0;
  const stroke = Math.max(5, Math.round(size * 0.095));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  const percent = Math.round(share * 100);

  return (
    <div className="dial" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="dial__track"
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke}
        />
        <circle
          className="dial__arc"
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - share)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="dial__value">
        <strong>{percent}%</strong>
        {label && <span className="dial__label">{label}</span>}
      </span>
    </div>
  );
}
