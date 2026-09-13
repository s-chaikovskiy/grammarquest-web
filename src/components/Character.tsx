import { useEffect, useState } from 'react';
import { isSpeaking, onSpeaking } from '../utils/speech';

export type Mood = 'idle' | 'talking' | 'correct' | 'wrong' | 'hint';

interface CharacterProps {
  name: 'teacher' | 'girl';
  size?: number;
  emotion?: 'neutral' | 'finger_up' | 'like';
  /**
   * Настроение задаёт движение. Если передан `speaks`, состояние «говорит»
   * включается само на время звучания этой реплики.
   */
  mood?: Mood;
  /** Реплика этого персонажа: пока она звучит, персонаж шевелится. */
  speaks?: string;
}

/**
 * Портреты персонажей.
 *
 * Файлы — WebP 320 px: исходные PNG были 1024×1024 по 1,6 МБ (11 МБ на всех),
 * хотя на экране портрет занимает 44–96 px. Пересборка: tools/optimize_characters.py.
 *
 * Портрет — растровая картинка, поэтому «оживает» он движением всей фигуры,
 * а не мимикой: дыхание в покое, покачивание в такт речи, подскок на верном
 * ответе, качание головой на неверном. Учитель просил именно этого —
 * «чтобы персонаж двигался либо говорил».
 *
 * Имена файлов не совпадают с тем, кто на них нарисован: в «teacher.webp» —
 * девочка с рюкзаком, в «aisha.webp» — учительница. Раньше привязка шла
 * по именам, и в диалоге Айша и учитель менялись ролями. Привязка ниже —
 * по самим картинкам; таблица соответствия — assets-source/ОТКУДА-КАРТИНКИ.md.
 */
const SOURCES: Record<string, Record<string, string>> = {
  teacher: {
    neutral: '/characters/teacher_finger_up.webp',
    finger_up: '/characters/aisha_finger_up.webp',
    like: '/characters/aisha.webp',
  },
  girl: {
    neutral: '/characters/teacher_like.webp',
    finger_up: '/characters/teacher.webp',
    like: '/characters/teacher.webp',
  },
};

const ALT: Record<string, string> = {
  teacher: 'Учитель',
  girl: 'Айша',
};

/** У верного ответа своя поза: одобрение видно раньше, чем прочитан текст. */
const MOOD_EMOTION: Partial<Record<Mood, 'neutral' | 'finger_up' | 'like'>> = {
  correct: 'like',
  hint: 'finger_up',
  talking: 'finger_up',
};

export default function Character({
  name,
  size = 96,
  emotion = 'neutral',
  mood = 'idle',
  speaks,
}: CharacterProps) {
  const [talking, setTalking] = useState(() => (speaks ? isSpeaking(speaks) : false));

  useEffect(() => {
    if (!speaks) {
      setTalking(false);
      return;
    }
    // Подписка на общее состояние речи: персонаж не знает, кто нажал кнопку,
    // ему достаточно знать, звучит ли сейчас его собственная реплика.
    return onSpeaking(() => setTalking(isSpeaking(speaks)));
  }, [speaks]);

  const active: Mood = talking ? 'talking' : mood;
  const src = SOURCES[name]?.[MOOD_EMOTION[active] ?? emotion]
    ?? SOURCES[name]?.[emotion]
    ?? SOURCES.teacher.neutral;

  return (
    <span
      className={`chr chr--${active}`}
      style={{ width: size, height: size }}
      data-name={name}
    >
      <img
        className="chr__img"
        src={src}
        alt={ALT[name] ?? ''}
        width={size}
        height={size}
        // Не lazy: портрет стоит на первом экране, и ленивая загрузка
        // откладывала бы его появление ради экономии 25 КБ.
        decoding="async"
      />
      {active === 'talking' && (
        <span className="chr__wave" aria-hidden>
          <i /><i /><i />
        </span>
      )}
    </span>
  );
}
