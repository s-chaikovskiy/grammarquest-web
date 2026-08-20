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
    <div className="min-h-[100dvh] relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="mesh-bg" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#6366F1]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EC4899]/5 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-[100dvh] flex items-center px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 glass rounded-full"
            >
              <span className="text-2xl"></span>
              <span className="text-caption text-[#A0A0B0] font-medium tracking-wider">
                Бесплатно · Бесплатно · Бесплатно
              </span>
            </motion.div>

            <h1 className="text-display">
              <span className="block text-[#FFFFFF]">Қазақ тілін</span>
              <span className="block bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
                үйрен!
              </span>
            </h1>

            <p className="text-body text-[#A0A0B0] max-w-lg">
              Интерактивный квест для изучения казахского языка через диалоги и грамматику
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="btn-premium px-8 py-4 text-white text-body"
              >
                Бастау →
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setLang('kz'); navigate('/menu'); }}
                className="glass glass-hover px-8 py-4 text-[#FFFFFF] text-body rounded-2xl"
              >
                Start
              </motion.button>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <div>
                  <div className="text-heading text-[#FFFFFF]">18</div>
                  <div className="text-caption text-[#6B6B7B]">Уроков</div>
                </div>
              </div>
              <div className="w-px h-12 bg-[#1C1C24]" />
              <div className="flex items-center gap-3">
                <span className="text-3xl">📐</span>
                <div>
                  <div className="text-heading text-[#FFFFFF]">33</div>
                  <div className="text-caption text-[#6B6B7B]">Правил</div>
                </div>
              </div>
              <div className="w-px h-12 bg-[#1C1C24]" />
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <div className="text-heading text-[#FFFFFF]">100%</div>
                  <div className="text-caption text-[#6B6B7B]">Бесплатно</div>
                </div>
              </div>
            </div>

            <div className="text-caption text-[#6B6B7B] pt-4">
              v5.0 · PWA · Offline-ready
            </div>
          </motion.div>

          {/* Right: Character */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 rounded-full blur-3xl" />
            <Character name="teacher" size={320} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}