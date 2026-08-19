import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t } from '../utils/helpers';
import { playClickSound } from '../utils/sounds';
import { reference } from '../data';

export default function ReferenceScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { lang } = state;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [...new Set(reference.map(r => r.categoryKz))];

  return (
    <div className="min-h-[100dvh] px-6 md:px-12 lg:px-24 py-12 bg-gradient-to-b from-[#CE82FF]/5 to-white">
      <div className="max-w-4xl mx-auto space-y-12">
        
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
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border-2 border-[#E9ECEF] shadow-[0_2px_0_#E9ECEF]"
          >
            <span className="text-2xl">←</span>
          </motion.button>
          <div>
            <h1 className="text-heading text-[#212529]">{t('Анықтама', 'Справочник', lang)}</h1>
            <p className="text-caption text-[#6C757D] font-bold mt-1">{reference.length} {t('тақырып', 'тем', lang)}</p>
          </div>
        </motion.header>

        {/* Categories */}
        {categories.map((category, ci) => (
          <motion.section
            key={category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: ci * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#CE82FF]/10 flex items-center justify-center">
                <span className="text-[#CE82FF] text-xl font-bold">{ci + 1}</span>
              </div>
              <h2 className="text-caption text-[#CE82FF] uppercase tracking-wider font-bold">
                {category}
              </h2>
            </div>
            
            <div className="space-y-3">
              {reference.filter(r => r.categoryKz === category).map((topic, i) => {
                const isExpanded = expandedId === topic.id;
                
                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (ci * 5 + i) * 0.02, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-2xl border-2 border-[#E9ECEF] overflow-hidden shadow-[0_2px_0_#E9ECEF]"
                  >
                    <button
                      onClick={() => { playClickSound(); setExpandedId(isExpanded ? null : topic.id); }}
                      className="w-full flex items-center gap-4 p-5 text-left hover:bg-[#F8F9FA] transition-colors"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 45 : 0 }}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#CE82FF]/10 flex items-center justify-center"
                      >
                        <span className="text-[#CE82FF] text-sm font-bold">+</span>
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-small font-bold text-[#212529] truncate mb-1">
                          {topic.titleKz}
                        </h3>
                        <p className="text-caption text-[#6C757D] truncate">
                          {topic.titleRu}
                        </p>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4">
                            <div className="bg-[#58CC02]/10 rounded-2xl p-5 border-2 border-[#58CC02]/30">
                              <div className="text-caption text-[#58CC02] uppercase tracking-wider mb-3 font-bold">
                                {t('Қазақша', 'На казахском', lang)}
                              </div>
                              <p className="text-small text-[#212529] whitespace-pre-line font-bold">
                                {topic.bodyKz}
                              </p>
                            </div>
                            
                            <div className="bg-[#1CB0F6]/10 rounded-2xl p-5 border-2 border-[#1CB0F6]/30">
                              <div className="text-caption text-[#1CB0F6] uppercase tracking-wider mb-3 font-bold">
                                {t('Орысша', 'На русском', lang)}
                              </div>
                              <p className="text-small text-[#212529] whitespace-pre-line font-bold">
                                <span className="text-[#1CB0F6] not-italic mr-2">перевод:</span>
                                {topic.bodyRu}
                              </p>
                            </div>

                            {(topic.examplesKz?.length || topic.examplesRu?.length) && (
                              <div className="bg-[#FFC800]/10 rounded-2xl p-5 border-2 border-[#FFC800]/30">
                                <div className="text-caption text-[#FF9600] uppercase tracking-wider mb-3 font-bold">
                                  {t('Мысалдар', 'Примеры', lang)}
                                </div>
                                <ul className="space-y-2">
                                  {topic.examplesKz?.map((ex, idx) => (
                                    <li key={idx} className="text-small text-[#212529] flex gap-3 font-bold">
                                      <span className="text-[#FF9600]">•</span>
                                      <span>{ex}</span>
                                    </li>
                                  ))}
                                </ul>
                                {topic.examplesRu && (
                                  <ul className="space-y-2 mt-3 pt-3 border-t-2 border-[#E9ECEF]">
                                    {topic.examplesRu.map((ex, idx) => (
                                      <li key={idx} className="text-caption text-[#6C757D] flex gap-2">
                                        <span className="text-[#6C757D] text-[10px]">перевод:</span>
                                        <span>{ex}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {(topic.mistakesKz?.length || topic.mistakesRu?.length) && (
                              <div className="bg-[#FF4B4B]/10 rounded-2xl p-5 border-2 border-[#FF4B4B]/30">
                                <div className="text-caption text-[#FF4B4B] uppercase tracking-wider mb-3 font-bold">
                                  {t('Қателер', 'Ошибки', lang)}
                                </div>
                                <ul className="space-y-2">
                                  {topic.mistakesKz?.map((m, idx) => (
                                    <li key={idx} className="text-small text-[#212529] flex gap-3 font-bold">
                                      <span className="text-[#FF4B4B]"></span>
                                      <span>{m}</span>
                                    </li>
                                  ))}
                                </ul>
                                {topic.mistakesRu && (
                                  <ul className="space-y-2 mt-3 pt-3 border-t-2 border-[#E9ECEF]">
                                    {topic.mistakesRu.map((m, idx) => (
                                      <li key={idx} className="text-caption text-[#6C757D] flex gap-2">
                                        <span className="text-[#6C757D] text-[10px]">перевод:</span>
                                        <span>{m}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        ))}

      </div>
    </div>
  );
}