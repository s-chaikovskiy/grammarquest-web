import { motion } from 'framer-motion';
import { useApp } from '../hooks/useApp';
import { t } from '../utils/helpers';
import { achievements } from '../data/achievements';

export default function AchievementsSection() {
  const { state } = useApp();
  const { lang, achievements: unlockedIds } = state;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading text-[#3C3C3C]">
            {t('Жетістіктер', 'Достижения', lang)}
          </h2>
          <p className="text-caption text-[#777777] font-bold mt-1">
            {unlockedIds.length} / {achievements.length} {t('ашылды', 'открыто', lang)}
          </p>
        </div>
        <div className="text-4xl">🏆</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((achievement, i) => {
          const isUnlocked = unlockedIds.includes(achievement.id);
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
              className={`relative p-6 rounded-2xl border-2 text-center transition-all ${
                isUnlocked
                  ? 'bg-white border-[#58CC02]/30'
                  : 'bg-[#F7F7F7] border-[#E5E5E5] opacity-50'
              }`}
              style={{ 
                boxShadow: isUnlocked ? '0 4px 0 #58CC0240' : '0 4px 0 #E5E5E5'
              }}
            >
              <div className="text-5xl mb-3">
                {achievement.icon}
              </div>
              <h3 className="text-small font-bold text-[#3C3C3C] mb-1">
                {lang === 'kz' ? achievement.titleKz : achievement.titleRu}
              </h3>
              <p className="text-caption text-[#777777]">
                {lang === 'kz' ? achievement.descriptionKz : achievement.descriptionRu}
              </p>
              
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-2xl">
                  <span className="text-4xl">🔒</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}