import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import Character from '../components/Character';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { setLang } = useApp();

  const handleStart = () => {
    setLang('ru');
    navigate('/menu');
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-gradient-to-br from-[#58CC02]/10 via-white to-[#1CB0F6]/10">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#58CC02]/10 rounded-full border border-[#58CC02]/20">
              <span className="text-2xl">🎓</span>
              <span className="text-caption text-[#58CC02] font-bold uppercase tracking-wider">
                Бесплатно · Бесплатно · Бесплатно
              </span>
            </div>

            <h1 className="text-display text-[#212529]">
              Қазақ тілін
              <br />
              <span className="text-[#58CC02]">үйрен!</span>
            </h1>

            <p className="text-body text-[#6C757D] max-w-md">
              Интерактивный квест для изучения казахского языка через диалоги и грамматику
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="px-8 py-4 bg-[#58CC02] text-white font-bold rounded-2xl text-body shadow-[0_4px_0_#46A302]"
              >
                Бастау →
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setLang('kz'); navigate('/menu'); }}
                className="px-8 py-4 bg-white text-[#58CC02] font-bold rounded-2xl text-body border-2 border-[#58CC02] shadow-[0_4px_0_#E5E5E5]"
              >
                Start
              </motion.button>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl"></span>
                <div>
                  <div className="text-heading text-[#212529]">18</div>
                  <div className="text-caption text-[#6C757D]">Уроков</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">📐</span>
                <div>
                  <div className="text-heading text-[#212529]">33</div>
                  <div className="text-caption text-[#6C757D]">Правил</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <div className="text-heading text-[#212529]">100%</div>
                  <div className="text-caption text-[#6C757D]">Бесплатно</div>
                </div>
              </div>
            </div>

            <div className="text-caption text-[#ADB5BD] pt-4">
              v5.0 · PWA · Offline-ready
            </div>
          </motion.div>

          {/* Right: Character */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#58CC02]/10 to-[#1CB0F6]/10 rounded-full blur-3xl" />
            <Character name="teacher" size={320} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}