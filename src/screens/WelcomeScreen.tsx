import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import Character from '../components/Character';
import AnimatedBackground from '../components/AnimatedBackground';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { setLang } = useApp();

  const handleStart = () => {
    setLang('ru');
    navigate('/menu');
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 min-h-[100dvh] flex items-center px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 glass rounded-full"
            >
              <motion.span 
                className="text-2xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
              </motion.span>
              <span className="text-caption text-[#A0A0B0] font-medium tracking-wider">
                Бесплатно · Бесплатно · Бесплатно
              </span>
            </motion.div>

            <h1 className="text-display">
              <motion.span 
                className="block text-[#FFFFFF]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Қазақ тілін
              </motion.span>
              <motion.span 
                className="block bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                үйрен!
              </motion.span>
            </h1>

            <motion.p 
              className="text-body text-[#A0A0B0] max-w-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Интерактивный квест для изучения казахского языка через диалоги и грамматику
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="btn-premium px-8 py-4 text-white text-body"
              >
                Бастау →
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setLang('kz'); navigate('/menu'); }}
                className="glass glass-hover px-8 py-4 text-[#FFFFFF] text-body rounded-2xl"
              >
                Start
              </motion.button>
            </motion.div>

            <motion.div 
              className="flex items-center gap-8 pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-3xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📚
                </motion.span>
                <div>
                  <div className="text-heading text-[#FFFFFF]">18</div>
                  <div className="text-caption text-[#6B6B7B]">Уроков</div>
                </div>
              </div>
              <div className="w-px h-12 bg-[#1C1C24]" />
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-3xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                >
                  📐
                </motion.span>
                <div>
                  <div className="text-heading text-[#FFFFFF]">33</div>
                  <div className="text-caption text-[#6B6B7B]">Правил</div>
                </div>
              </div>
              <div className="w-px h-12 bg-[#1C1C24]" />
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-3xl"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                >
                  🎯
                </motion.span>
                <div>
                  <div className="text-heading text-[#FFFFFF]">100%</div>
                  <div className="text-caption text-[#6B6B7B]">Бесплатно</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="text-caption text-[#6B6B7B] pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              v5.0 · PWA · Offline-ready
            </motion.div>
          </motion.div>

          {/* Right: Character */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end relative"
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Character name="teacher" size={320} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}