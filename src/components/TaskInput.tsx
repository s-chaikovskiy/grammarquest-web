import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Step } from '../types';
import { t } from '../utils/helpers';

interface TaskInputProps {
  step: Step;
  lang: 'kz' | 'ru';
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}

export default function TaskInput({ step, lang, onAnswer, onSkip }: TaskInputProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const taskType = step.taskType || 'input';

  const handleSubmit = () => {
    if (userAnswer.trim()) {
      onAnswer(userAnswer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim()) {
      handleSubmit();
    }
  };

  const renderTask = () => {
    switch (taskType) {
      case 'choice':
        return renderChoiceTask();
      case 'matching':
        return renderMatchingTask();
      case 'fill_blank':
        return renderFillBlankTask();
      case 'translate':
        return renderTranslateTask();
      default:
        return renderInputTask();
    }
  };

  const renderInputTask = () => (
    <>
      <div className="bg-[#F7F7F7] rounded-2xl p-6 mb-4">
        <p className="text-body text-[#3C3C3C] font-bold">{step.taskKz}</p>
      </div>
      <div className="border-t-2 border-[#E5E5E5] pt-4">
        <p className="text-small text-[#777777] italic">
          <span className="text-[#CE82FF] font-bold not-italic mr-2">перевод:</span>
          {step.taskRu}
        </p>
      </div>
      <input
        type="text"
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('Жауапты жаз...', 'Напиши ответ...', lang)}
        className="w-full px-6 py-5 bg-white border-2 border-[#E5E5E5] rounded-2xl text-body focus:border-[#58CC02] focus:outline-none transition-colors font-bold mt-4"
        style={{ boxShadow: '0 4px 0 #E5E5E5' }}
        autoFocus
      />
    </>
  );

  const renderChoiceTask = () => {
    const options = step.options || [];
    return (
      <>
        <div className="bg-[#F7F7F7] rounded-2xl p-6 mb-4">
          <p className="text-body text-[#3C3C3C] font-bold">{step.taskKz}</p>
        </div>
        <div className="border-t-2 border-[#E5E5E5] pt-4 mb-4">
          <p className="text-small text-[#777777] italic">
            <span className="text-[#CE82FF] font-bold not-italic mr-2">перевод:</span>
            {step.taskRu}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {options.map((option, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserAnswer(option)}
              className={`p-4 rounded-2xl border-2 text-left font-bold transition-all ${
                userAnswer === option
                  ? 'bg-[#58CC02]/10 border-[#58CC02] text-[#58CC02]'
                  : 'bg-white border-[#E5E5E5] text-[#3C3C3C] hover:border-[#58CC02]/50'
              }`}
              style={{ boxShadow: userAnswer === option ? '0 4px 0 #46A302' : '0 4px 0 #E5E5E5' }}
            >
              <span className="text-body">{option}</span>
            </motion.button>
          ))}
        </div>
      </>
    );
  };

  const renderMatchingTask = () => {
    const pairs = step.pairs || [];
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matches, setMatches] = useState<Record<string, string>>({});

    const handleSelect = (left: string, right: string) => {
      if (selectedLeft === left) {
        setMatches({ ...matches, [left]: right });
        setSelectedLeft(null);
      } else {
        setSelectedLeft(left);
      }
    };

    const leftItems = pairs.map(p => p.left);
    const rightItems = useMemo(() => [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5), [pairs]);

    return (
      <>
        <div className="bg-[#F7F7F7] rounded-2xl p-6 mb-4">
          <p className="text-body text-[#3C3C3C] font-bold">{step.taskKz}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            {leftItems.map((left, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedLeft(left)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-bold ${
                  selectedLeft === left
                    ? 'bg-[#1CB0F6]/10 border-[#1CB0F6] text-[#1CB0F6]'
                    : matches[left]
                    ? 'bg-[#58CC02]/10 border-[#58CC02] text-[#58CC02]'
                    : 'bg-white border-[#E5E5E5] text-[#3C3C3C]'
                }`}
                style={{ boxShadow: '0 4px 0 #E5E5E5' }}
              >
                {left}
              </motion.button>
            ))}
          </div>
          <div className="space-y-3">
            {rightItems.map((right, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectedLeft && handleSelect(selectedLeft, right)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-bold ${
                  Object.values(matches).includes(right)
                    ? 'bg-[#58CC02]/10 border-[#58CC02] text-[#58CC02]'
                    : 'bg-white border-[#E5E5E5] text-[#3C3C3C] hover:border-[#1CB0F6]/50'
                }`}
                style={{ boxShadow: '0 4px 0 #E5E5E5' }}
              >
                {right}
              </motion.button>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderFillBlankTask = () => (
    <>
      <div className="bg-[#F7F7F7] rounded-2xl p-6 mb-4">
        <p className="text-body text-[#3C3C3C] font-bold whitespace-pre-line">{step.taskKz}</p>
      </div>
      <div className="border-t-2 border-[#E5E5E5] pt-4 mb-4">
        <p className="text-small text-[#777777] italic">
          <span className="text-[#CE82FF] font-bold not-italic mr-2">перевод:</span>
          {step.taskRu}
        </p>
      </div>
      <input
        type="text"
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('Пропускты толтыр...', 'Заполни пропуск...', lang)}
        className="w-full px-6 py-5 bg-white border-2 border-[#E5E5E5] rounded-2xl text-body focus:border-[#58CC02] focus:outline-none transition-colors font-bold"
        style={{ boxShadow: '0 4px 0 #E5E5E5' }}
        autoFocus
      />
    </>
  );

  const renderTranslateTask = () => (
    <>
      <div className="bg-[#58CC02]/10 rounded-2xl p-6 mb-4 border-2 border-[#58CC02]/30">
        <p className="text-body text-[#3C3C3C] font-bold">{step.taskKz}</p>
      </div>
      <div className="bg-[#1CB0F6]/10 rounded-2xl p-6 mb-4 border-2 border-[#1CB0F6]/30">
        <p className="text-body text-[#3C3C3C] font-bold">{step.taskRu}</p>
      </div>
      <input
        type="text"
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('Аударманы жаз...', 'Напиши перевод...', lang)}
        className="w-full px-6 py-5 bg-white border-2 border-[#E5E5E5] rounded-2xl text-body focus:border-[#58CC02] focus:outline-none transition-colors font-bold"
        style={{ boxShadow: '0 4px 0 #E5E5E5' }}
        autoFocus
      />
    </>
  );

  return (
    <motion.div
      key="task"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-3xl p-8 border-2 border-[#E5E5E5]" style={{ boxShadow: '0 4px 0 #E5E5E5' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#CE82FF]/10 flex items-center justify-center">
            <span className="text-3xl">️</span>
          </div>
          <div className="text-caption text-[#CE82FF] uppercase tracking-wider font-bold">
            {t('Тапсырма', 'Задание', lang)}
          </div>
        </div>
        
        {renderTask()}
      </div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ y: 4, boxShadow: 'none' }}
          onClick={onSkip}
          className="flex-1 py-5 bg-white text-[#777777] font-bold rounded-2xl text-body border-2 border-[#E5E5E5] shadow-duo"
        >
          {t('Өткізу', 'Пропустить', lang)}
        </motion.button>
        <motion.button
          whileHover={{ y: -4 }}
          whileTap={{ y: 4, boxShadow: 'none' }}
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="flex-1 py-5 bg-[#58CC02] text-white font-bold rounded-2xl text-body disabled:opacity-40 shadow-duo-accent"
        >
          {t('Тексеру', 'Проверить', lang)}
        </motion.button>
      </div>
    </motion.div>
  );
}