import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { t } from '../utils/helpers';
import { playClickSound } from '../utils/sounds';
import { rules } from '../data';

export default function RulesScreen() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { lang } = state;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-[100dvh] px-6 md:px-12 lg:px-24 py-12 bg-gradient-to-b from-[#1CB0F6]/5 to-white">
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
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border-2 border-[#E9ECEF] shadow-[0_2px_0_#E9ECEF]"
          >
            <span className="text-2xl">←</span>
          </motion.button>
          <div>
            <h1 className="text-heading text-[#212529]">{t('Ережелер', 'Правила', lang)}</h1>
            <p className="text-caption text-[#6C757D] font-bold mt-1">{rules.length} {t('ереже', 'правил', lang)}</p>
          </div>
        </motion.header>

        {/* Rules list */}
        <div className="space-y-3">
          {rules.map((rule, i) => {
            const isExpanded = expandedId === rule.id;
            
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-2xl border-2 border-[#E9ECEF] overflow-hidden shadow-[0_2px_0_#E9ECEF]"
              >
                <button
                  onClick={() => { playClickSound(); setExpandedId(isExpanded ? null : rule.id); }}
                  className="w-full flex items-center gap-4 p-6 text-left hover:bg-[#F8F9FA] transition-colors"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 45 : 0 }}
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#1CB0F6]/10 flex items-center justify-center"
                  >
                    <span className="text-[#1CB0F6] text-xl font-bold">+</span>
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body font-bold text-[#212529] truncate mb-1">
                      {rule.titleKz}
                    </h3>
                    <p className="text-small text-[#6C757D] truncate">
                      {rule.titleRu}
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
                      <div className="px-6 pb-6 space-y-4">
                        <div className="bg-[#58CC02]/10 rounded-2xl p-6 border-2 border-[#58CC02]/30">
                          <div className="text-caption text-[#58CC02] uppercase tracking-wider mb-3 font-bold">
                            {t('Қазақша', 'На казахском', lang)}
                          </div>
                          <p className="text-small text-[#212529] whitespace-pre-line font-bold">
                            {rule.kz}
                          </p>
                        </div>
                        
                        <div className="bg-[#1CB0F6]/10 rounded-2xl p-6 border-2 border-[#1CB0F6]/30">
                          <div className="text-caption text-[#1CB0F6] uppercase tracking-wider mb-3 font-bold">
                            {t('Орысша', 'На русском', lang)}
                          </div>
                          <p className="text-small text-[#212529] whitespace-pre-line font-bold">
                            <span className="text-[#1CB0F6] not-italic mr-2">перевод:</span>
                            {rule.ru}
                          </p>
                        </div>

                        {(rule.examplesKz?.length || rule.examplesRu?.length) && (
                          <div className="bg-[#FFC800]/10 rounded-2xl p-6 border-2 border-[#FFC800]/30">
                            <div className="text-caption text-[#FF9600] uppercase tracking-wider mb-3 font-bold">
                              {t('Мысалдар', 'Примеры', lang)}
                            </div>
                            <ul className="space-y-2">
                              {rule.examplesKz?.map((ex, idx) => (
                                <li key={idx} className="text-small text-[#212529] flex gap-3 font-bold">
                                  <span className="text-[#FF9600]">•</span>
                                  <span>{ex}</span>
                                </li>
                              ))}
                            </ul>
                            {rule.examplesRu && (
                              <ul className="space-y-2 mt-3 pt-3 border-t-2 border-[#E9ECEF]">
                                {rule.examplesRu.map((ex, idx) => (
                                  <li key={idx} className="text-caption text-[#6C757D] flex gap-2">
                                    <span className="text-[#6C757D] text-[10px]">перевод:</span>
                                    <span>{ex}</span>
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

      </div>
    </div>
  );
}