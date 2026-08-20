import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t, formatXp } from '../utils/helpers';
import { playClickSound, startBackgroundMusic, stopBackgroundMusic, setBackgroundMusicVolume } from '../utils/sounds';
import { lessons } from '../data';
import TiltCard from '../components/TiltCard';
import AnimatedBackground from '../components/AnimatedBackground';

const menuItems = [
  {
    id: 'lessons',
    icon: '📖',
    titleKz: 'Сабақтар',
    titleRu: 'Уроки',
    subtitleKz: 'Диалогтар арқылы үйрен',
    subtitleRu: 'Учись через диалоги',
    path: '/lessons',
    color: '#6366F1',
  },
  {
    id: 'review',
    icon: '🔄',
    titleKz: 'Қайталау',
    titleRu: 'Повторение',
    subtitleKz: 'Ескі тақырыптарды қайтала',
    subtitleRu: 'Повтори старые темы',
    path: '/review',
    color: '#F59E0B',
  },
  {
    id: 'rules',
    icon: '📐',
    titleKz: 'Ережелер',
    titleRu: 'Правила',
    subtitleKz: 'Грамматика',
    subtitleRu: 'Грамматические правила',
    path: '/rules',
    color: '#3B82F6',
  },
  {
    id: 'reference',
    icon: '📋',
    titleKz: 'Анықтама',
    titleRu: 'Справочник',
    subtitleKz: 'Толық анықтамалық',
    subtitleRu: 'Полный справочник',
    path: '/reference',
    color: '#8B5CF6',
  },
];

export default function MenuScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { lang, xp, streak } = state;
  const [musicEnabled, setMusicEnabled] = useState(false);

  const completedLessons = Object.values(state.progress).filter(p => p.completedSteps === p.totalSteps).length;
  const progress = (completedLessons / lessons.length) * 100;

  useEffect(() => {
    if (musicEnabled) {
      startBackgroundMusic();
      setBackgroundMusicVolume(0.15);
    } else {
      stopBackgroundMusic();
    }
  }, [musicEnabled]);

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-heading text-[#FFFFFF]">GrammarQuest</h1>
              <p className="text-body text-[#A0A0B0] mt-2">
                {t('Сабақты таңда', 'Выбери раздел', lang)}
              </p>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); setMusicEnabled(!musicEnabled); }}
                className="glass glass-hover flex items-center justify-center w-12 h-12 rounded-xl"
              >
                <span className="text-xl">{musicEnabled ? '🔊' : '🔇'}</span>
              </motion.button>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl"
              >
                <span className="text-xl">⚡</span>
                <span className="text-body text-[#FFFFFF] font-bold">{streak}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl"
              >
                <span className="text-xl">💎</span>
                <span className="text-body text-[#FFFFFF] font-bold">{formatXp(xp)}</span>
              </motion.div>
            </div>
          </motion.header>

          {/* Progress Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-caption text-[#6B6B7B] uppercase tracking-wider mb-2 font-medium">
                  {t('Прогресс', 'Прогресс', lang)}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-display text-[#FFFFFF]">{completedLessons}</span>
                  <span className="text-heading text-[#6B6B7B]">/ {lessons.length}</span>
                </div>
              </div>
              <motion.div 
                className="text-6xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {completedLessons === 0 ? '🌱' : completedLessons < 5 ? '🌿' : completedLessons < 10 ? '' : ''}
              </motion.div>
            </div>
            
            <div className="h-2 bg-[#1C1C24] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
            <div className="text-caption text-[#A0A0B0] mt-3 text-center font-medium">
              {Math.round(progress)}% {t('аяқталды', 'завершено', lang)}
            </div>
          </motion.section>

          {/* Menu grid - Bento style with 3D cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item, i) => (
              <TiltCard
                key={item.id}
                className="group relative p-8 text-left overflow-hidden cursor-pointer"
                onClick={() => { playClickSound(); navigate(item.path); }}
              >
                {/* Gradient overlay on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${item.color}20, transparent 70%)` }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <motion.div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${item.color}20` }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      {item.icon}
                    </motion.div>
                    <motion.span 
                      className="text-3xl text-[#6B6B7B] group-hover:text-[#FFFFFF] transition-colors"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </div>
                  
                  <h2 className="text-heading text-[#FFFFFF] mb-2">{item.titleKz}</h2>
                  <p className="text-small text-[#A0A0B0] mb-4">{item.titleRu}</p>
                  <p className="text-caption text-[#6B6B7B] font-medium">{t(item.subtitleKz, item.subtitleRu, lang)}</p>
                </div>
              </TiltCard>
            ))}
          </div>

          {/* Stats Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: '🔥', label: t('Күн', 'Дней', lang), value: streak, color: '#F59E0B' },
              { icon: '💎', label: 'XP', value: formatXp(xp), color: '#6366F1' },
              { icon: '📚', label: t('Сабақ', 'Уроков', lang), value: completedLessons, color: '#3B82F6' },
              { icon: '', label: t('Деңгей', 'Уровень', lang), value: state.level, color: '#8B5CF6' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="card-premium p-6 text-center"
              >
                <motion.div 
                  className="text-4xl mb-2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                >
                  {stat.icon}
                </motion.div>
                <div className="text-heading text-[#FFFFFF]">{stat.value}</div>
                <div className="text-caption text-[#6B6B7B] font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.section>

        </div>
      </div>
    </div>
  );
}