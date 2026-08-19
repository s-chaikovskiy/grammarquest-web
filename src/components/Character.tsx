import { motion } from 'framer-motion';

interface CharacterProps {
  name: 'teacher' | 'girl' | 'boy';
  size?: number;
  isSpeaking?: boolean;
  emotion?: 'neutral' | 'finger_up' | 'like';
}

const characterMap: Record<string, Record<string, string>> = {
  teacher: {
    neutral: '/characters/teacher.png',
    finger_up: '/characters/teacher_finger_up.png',
    like: '/characters/teacher_like.png',
  },
  girl: {
    neutral: '/characters/aisha.png',
    finger_up: '/characters/aisha_finger_up.png',
    like: '/characters/aisha_finger_up.png',
  },
  boy: {
    neutral: '/characters/dima.png',
    finger_up: '/characters/dima_finger_up.png',
    like: '/characters/dima_finger_up.png',
  },
};

export default function Character({ name, size = 120, isSpeaking = false, emotion = 'neutral' }: CharacterProps) {
  const src = characterMap[name]?.[emotion] || characterMap[name]?.neutral || '/characters/teacher.png';

  return (
    <motion.img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ 
        objectFit: 'contain',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
      }}
      animate={{
        y: isSpeaking ? [0, -4, 0] : 0,
        rotate: isSpeaking ? [0, 1, -1, 0] : 0,
      }}
      transition={{
        duration: 0.8,
        repeat: isSpeaking ? Infinity : 0,
        ease: 'easeInOut',
      }}
    />
  );
}
