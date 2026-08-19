import type { Achievement } from '../types';

export const achievements: Achievement[] = [
  {
    id: 'first_lesson',
    titleKz: 'Бірінші қадам',
    titleRu: 'Первый шаг',
    descriptionKz: 'Бірінші сабақты аяқта',
    descriptionRu: 'Заверши первый урок',
    icon: '🌱',
    condition: (state) => Object.keys(state.progress).length > 0,
  },
  {
    id: 'five_lessons',
    titleKz: 'Табандылық',
    titleRu: 'Настойчивость',
    descriptionKz: '5 сабақты аяқта',
    descriptionRu: 'Заверши 5 уроков',
    icon: '🌿',
    condition: (state) => Object.values(state.progress).filter(p => p.completedSteps === p.totalSteps).length >= 5,
  },
  {
    id: 'ten_lessons',
    titleKz: 'Білімпаз',
    titleRu: 'Знаток',
    descriptionKz: '10 сабақты аяқта',
    descriptionRu: 'Заверши 10 уроков',
    icon: '🌳',
    condition: (state) => Object.values(state.progress).filter(p => p.completedSteps === p.totalSteps).length >= 10,
  },
  {
    id: 'all_lessons',
    titleKz: 'Шебер',
    titleRu: 'Мастер',
    descriptionKz: 'Барлық сабақтарды аяқта',
    descriptionRu: 'Заверши все уроки',
    icon: '🏆',
    condition: (state) => Object.values(state.progress).filter(p => p.completedSteps === p.totalSteps).length >= 18,
  },
  {
    id: 'streak_3',
    titleKz: 'Үш күн',
    titleRu: 'Три дня',
    descriptionKz: '3 күн қатарынан оқы',
    descriptionRu: 'Учись 3 дня подряд',
    icon: '🔥',
    condition: (state) => state.streak >= 3,
  },
  {
    id: 'streak_7',
    titleKz: 'Апта',
    titleRu: 'Неделя',
    descriptionKz: '7 күн қатарынан оқы',
    descriptionRu: 'Учись 7 дней подряд',
    icon: '⚡',
    condition: (state) => state.streak >= 7,
  },
  {
    id: 'streak_30',
    titleKz: 'Ай',
    titleRu: 'Месяц',
    descriptionKz: '30 күн қатарынан оқы',
    descriptionRu: 'Учись 30 дней подряд',
    icon: '💎',
    condition: (state) => state.streak >= 30,
  },
  {
    id: 'xp_100',
    titleKz: 'Жинаушы',
    titleRu: 'Коллекционер',
    descriptionKz: '100 XP жина',
    descriptionRu: 'Набери 100 XP',
    icon: '💰',
    condition: (state) => state.xp >= 100,
  },
  {
    id: 'xp_500',
    titleKz: 'Бай',
    titleRu: 'Богач',
    descriptionKz: '500 XP жина',
    descriptionRu: 'Набери 500 XP',
    icon: '💎',
    condition: (state) => state.xp >= 500,
  },
  {
    id: 'xp_1000',
    titleKz: 'Миллионер',
    titleRu: 'Миллионер',
    descriptionKz: '1000 XP жина',
    descriptionRu: 'Набери 1000 XP',
    icon: '👑',
    condition: (state) => state.xp >= 1000,
  },
  {
    id: 'perfect_score',
    titleKz: 'Перфекционист',
    titleRu: 'Перфекционист',
    descriptionKz: 'Сабақты қатесіз аяқта',
    descriptionRu: 'Заверши урок без ошибок',
    icon: '⭐',
    condition: (state) => Object.values(state.progress).some(p => p.score >= p.totalSteps * 10),
  },
  {
    id: 'level_5',
    titleKz: 'Деңгей 5',
    titleRu: 'Уровень 5',
    descriptionKz: '5 деңгейге жет',
    descriptionRu: 'Достигни 5 уровня',
    icon: '🎯',
    condition: (state) => state.level >= 5,
  },
];

export function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXpForNextLevel(level: number): number {
  return level * 100;
}

export function getXpProgress(xp: number): number {
  const level = getLevelFromXp(xp);
  const xpInCurrentLevel = xp - (level - 1) * 100;
  return (xpInCurrentLevel / 100) * 100;
}