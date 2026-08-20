import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t, getCharacterSvgName } from '../utils/helpers';
import Character from '../components/Character';
import { playClickSound } from '../utils/sounds';
import { lessons } from '../data';

export default function LessonListScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { lang } = state;

  const getLessonStatus = (lessonId: string, steps: number) => {
    const progress = state.progress[lessonId];
    if (!progress) return 'locked';
    if (progress.completedSteps === steps) return 'completed';
    return 'in-progress';
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="mesh-bg" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl" />

      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playClickSound(); navigate('/menu'); }}
              className="glass glass-hover w-14 h-14 flex items-center justify-center rounded-2xl"
            >
              <span className="text-2xl">←</span>
            </motion.button>
            <div>
              <h1 className="text-heading text-[#FFFFFF]">{t('Сабақтар', 'Уроки', lang)}</h1>
              <p className="text-caption text-[#6B6B7B] font-medium">{lessons.length} {t('сабақ', 'уроков', lang)}</p>
            </div>
          </motion.header>

          {/* Lesson path */}
          <div className="space-y-4">
            {lessons.map((lesson, i) => {
              const progress = state.progress[lesson.id];
              const isCompleted = progress?.completedSteps === lesson.steps.length;
              const isStarted = !!progress;
              const status = getLessonStatus(lesson.id, lesson.steps.length);
              const progressPercent = progress ? (progress.completedSteps / progress.totalSteps) * 100 : 0;

              const colors = ['#6366F1', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];
              const color = colors[i % colors.length];

              return (
                <motion.button
                  key={lesson.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                  whileTap={{ y: 0 }}
                  onClick={() => { playClickSound(); navigate(`/lesson/${lesson.id}`); }}
                  className="card-premium w-full flex items-center gap-6 p-6 text-left relative overflow-hidden"
                >
                  {/* Progress bar background */}
                  {isStarted && !isCompleted && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className="absolute left-0 top-0 bottom-0 opacity-20"
                      style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                    />
                  )}

                  {/* Character */}
                  <div className="flex-shrink-0 relative z-10">
                    <div 
                      className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Character
                        name={getCharacterSvgName(lesson.character)}
                        size={64}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="text-caption font-medium px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {t('Сабақ', 'Урок', lang)} {i + 1}
                      </span>
                      {isCompleted && (
                        <span className="text-caption font-medium px-3 py-1 rounded-full bg-[#10B981]/20 text-[#10B981]">
                          ✓ {t('Аяқталды', 'Завершён', lang)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-body font-semibold text-[#FFFFFF] truncate mb-1">
                      {lesson.titleKz}
                    </h3>
                    <p className="text-small text-[#A0A0B0] truncate mb-2">
                      {lesson.titleRu}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-caption text-[#6B6B7B] font-medium">
                        {lesson.steps.length} {t('қадам', 'шагов', lang)}
                      </span>
                      {isStarted && progress && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[#1C1C24] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                          <span className="text-caption font-medium" style={{ color }}>
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0 relative z-10">
                    {isCompleted ? (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center"
                        style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
                      >
                        <span className="text-white text-2xl">✓</span>
                      </motion.div>
                    ) : isStarted ? (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}60` }}
                      >
                        <span className="text-white text-xl">▶</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1C1C24] flex items-center justify-center">
                        <span className="text-[#6B6B7B] text-xl">→</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}