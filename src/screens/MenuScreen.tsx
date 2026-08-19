import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t, formatXp } from '../utils/helpers';
import { playClickSound, startBackgroundMusic, stopBackgroundMusic, setBackgroundMusicVolume } from '../utils/sounds';
import { lessons } from '../data';

const menuItems = [
  {
    id: 'lessons',
    icon: '',
    titleKz: 'Сабақтар',
    titleRu: 'Уроки',
    subtitleKz: 'Диалогтар арқылы үйрен',
    subtitleRu: 'Учись через диалоги',
    path: '/lessons',
    color: '#58CC02',
  },
  {
    id: 'review',
    icon: '🔄',
    titleKz: 'Қайталау',
    titleRu: 'Повторение',
    subtitleKz: 'Ескі тақырыптарды қайтала',
    subtitleRu: 'Повтори старые темы',
    path: '/review',
    color: '#FFC800',
  },
  {
    id: 'rules',
    icon: '📐',
    titleKz: 'Ережелер',
    titleRu: 'Правила',
    subtitleKz: 'Грамматика',
    subtitleRu: 'Грамматические правила',
    path: '/rules',
    color: '#1CB0F6',
  },
  {
    id: 'reference',
    icon: '📋',
    titleKz: 'Анықтама',
    titleRu: 'Справочник',
    subtitleKz: 'Толық анықтамалық',
    subtitleRu: 'Полный справочник',
    path: '/reference',
    color: '#CE82FF',
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
    <div className="min-h-[100dvh] px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-heading text-[#212529]">GrammarQuest</h1>
            <p className="text-body text-[#6C757D] mt-2">
              {t('Сабақты таңда', 'Выбери раздел', lang)}
            </p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playClickSound(); setMusicEnabled(!musicEnabled); }}
              className="flex items-center justify-center w-12 h-12 bg-white rounded-xl border-2 border-[#E9ECEF] shadow-[0_2px_0_#E9ECEF]"
            >
              <span className="text-xl">{musicEnabled ? '🔊' : '🔇'}</span>
            </motion.button>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FFC800] rounded-xl shadow-[0_2px_0_#E5A600]"
            >
              <span className="text-xl">⚡</span>
              <span className="text-body text-white font-bold">{streak}</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#58CC02] rounded-xl shadow-[0_2px_0_#46A302]"
            >
              <span className="text-xl">💎</span>
              <span className="text-body text-white font-bold">{formatXp(xp)}</span>
            </motion.div>
          </div>
        </motion.header>

        {/* Progress Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 border-2 border-[#E9ECEF] shadow-[0_4px_0_#E9ECEF]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-caption text-[#ADB5BD] uppercase tracking-wider mb-2 font-bold">
                {t('Прогресс', 'Прогресс', lang)}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-display text-[#212529]">{completedLessons}</span>
                <span className="text-heading text-[#ADB5BD]">/ {lessons.length}</span>
              </div>
            </div>
            <div className="text-6xl">
              {completedLessons === 0 ? '🌱' : completedLessons < 5 ? '🌿' : completedLessons < 10 ? '🌳' : '🏆'}
            </div>
          </div>
          
          <div className="h-3 bg-[#E9ECEF] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-[#58CC02] to-[#58CC02] rounded-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
          <div className="text-caption text-[#6C757D] mt-3 text-center font-bold">
            {Math.round(progress)}% {t('аяқталды', 'завершено', lang)}
          </div>
        </motion.section>

        {/* Menu grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ y: 4, boxShadow: 'none' }}
              onClick={() => { playClickSound(); navigate(item.path); }}
              className="group relative p-8 bg-white rounded-3xl text-left border-2 border-[#E9ECEF] transition-all"
              style={{ boxShadow: `0 6px 0 ${item.color}40` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  {item.icon}
                </div>
                <span className="text-3xl text-[#ADB5BD] group-hover:text-[#212529] transition-colors">→</span>
              </div>
              
              <h2 className="text-heading text-[#212529] mb-2">{item.titleKz}</h2>
              <p className="text-small text-[#6C757D] mb-4">{item.titleRu}</p>
              <p className="text-caption text-[#ADB5BD] font-bold">{t(item.subtitleKz, item.subtitleRu, lang)}</p>
            </motion.button>
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
            { icon: '', label: t('Күн', 'Дней', lang), value: streak, color: '#FF9600' },
            { icon: '💎', label: 'XP', value: formatXp(xp), color: '#58CC02' },
            { icon: '📚', label: t('Сабақ', 'Уроков', lang), value: completedLessons, color: '#1CB0F6' },
            { icon: '🎯', label: t('Деңгей', 'Уровень', lang), value: state.level, color: '#CE82FF' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl p-6 text-center border-2 border-[#E9ECEF] shadow-[0_2px_0_#E9ECEF]"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-heading text-[#212529]">{stat.value}</div>
              <div className="text-caption text-[#6C757D] font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </motion.section>

      </div>
    </div>
  );
}