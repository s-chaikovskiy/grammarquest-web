interface CharacterProps {
  name: 'teacher' | 'girl' | 'boy';
  size?: number;
  emotion?: 'neutral' | 'finger_up' | 'like';
}

/**
 * Портреты персонажей.
 *
 * Файлы — WebP 320 px: исходные PNG были 1024×1024 по 1,6 МБ (11 МБ на всех),
 * хотя на экране портрет занимает 44–96 px. Пересборка: tools/optimize_characters.py.
 */
const SOURCES: Record<string, Record<string, string>> = {
  teacher: {
    neutral: '/characters/teacher.webp',
    finger_up: '/characters/teacher_finger_up.webp',
    like: '/characters/teacher_like.webp',
  },
  girl: {
    neutral: '/characters/aisha.webp',
    finger_up: '/characters/aisha_finger_up.webp',
    like: '/characters/aisha_finger_up.webp',
  },
  boy: {
    neutral: '/characters/dima.webp',
    finger_up: '/characters/dima_finger_up.webp',
    like: '/characters/dima_finger_up.webp',
  },
};

const ALT: Record<string, string> = {
  teacher: 'Учитель',
  girl: 'Айша',
  boy: 'Дима',
};

export default function Character({ name, size = 96, emotion = 'neutral' }: CharacterProps) {
  const src = SOURCES[name]?.[emotion] ?? SOURCES.teacher.neutral;

  return (
    <img
      src={src}
      alt={ALT[name] ?? ''}
      width={size}
      height={size}
      // Не lazy: портрет стоит на первом экране, и ленивая загрузка
      // откладывала бы его появление ради экономии 25 КБ.
      decoding="async"
      style={{ objectFit: 'contain', flexShrink: 0 }}
    />
  );
}
