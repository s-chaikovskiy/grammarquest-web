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
      <div className="bg-[#1C1C24] rounded-2xl p-6 mb-4">
        <p className="text-body text-[#FFFFFF] font-medium">{step.taskKz}</p>
      </div>
      <div className="border-t border-[#1C1C24] pt-4">
        <p className="text-small text-[#A0A0B0] italic">
          <span className="text-[#8B5CF6] font-medium not-italic mr-2">перевод:</span>
          {step.taskRu}
        </p>
      </div>
      <input
        type="text"
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('Жауапты жаз...', 'Напиши ответ...', lang)}
        className="w-full px-6 py-5 bg-[#1C1C24] border border-[#2C2C34] rounded-2xl text-body text-[#FFFFFF] placeholder-[#6B6B7B] focus:border-[#6366F1] focus:outline-none transition-colors font-medium mt-4"
        autoFocus
      />
    </>
  );

  const renderChoiceTask = () => {
    const options = step.options || [];
    return (
      <>
        <div className="bg-[#1C1C24] rounded-2xl p-6 mb-4">
          <p className="text-body text-[#FFFFFF] font-medium">{step.taskKz}</p>
        </div>
        <div className="border-t border-[#1C1C24] pt-4 mb-4">
          <p className="text-small text-[#A0A0B0] italic">
            <span className="text-[#8B5CF6] font-medium not-italic mr-2">перевод:</span>
            {step.taskRu}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {options.map((option, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setUserAnswer(option)}
              className={`p-5 rounded-2xl border text-left font-medium transition-all ${
                userAnswer === option
                  ? 'bg-[#6366F1]/20 border-[#6366F1] text-[#6366F1]'
                  : 'bg-[#1C1C24] border-[#2C2C34] text-[#FFFFFF] hover:border-[#6366F1]/50'
              }`}
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
        <div className="bg-[#1C1C24] rounded-2xl p-6 mb-4">
          <p className="text-body text-[#FFFFFF] font-medium">{step.taskKz}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            {leftItems.map((left, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedLeft(left)}
                className={`w-full p-4 rounded-2xl border text-left font-medium ${
                  selectedLeft === left
                    ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]'
                    : matches[left]
                    ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                    : 'bg-[#1C1C24] border-[#2C2C34] text-[#FFFFFF]'
                }`}
              >
                {left}
              </motion.button>
            ))}
          </div>
          <div className="space-y-3">
            {rightItems.map((right, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => selectedLeft && handleSelect(selectedLeft, right)}
                className={`w-full p-4 rounded-2xl border text-left font-medium ${
                  Object.values(matches).includes(right)
                    ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                    : 'bg-[#1C1C24] border-[#2C2C34] text-[#FFFFFF] hover:border-[#3B82F6]/50'
                }`}
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
      <div className="bg-[#1C1C24] rounded-2xl p-6 mb-4">
        <p className="text-body text-[#FFFFFF] font-medium whitespace-pre-line">{step.taskKz}</p>
      </div>
      <div className="border-t border-[#1C1C24] pt-4 mb-4">
        <p className="text-small text-[#A0A0B0] italic">
          <span className="text-[#8B5CF6] font-medium not-italic mr-2">перевод:</span>
          {step.taskRu}
        </p>
      </div>
      <input
        type="text"
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('Пропускты толтыр...', 'Заполни пропуск...', lang)}
        className="w-full px-6 py-5 bg-[#1C1C24] border border-[#2C2C34] rounded-2xl text-body text-[#FFFFFF] placeholder-[#6B6B7B] focus:border-[#6366F1] focus:outline-none transition-colors font-medium"
        autoFocus
      />
    </>
  );

  const renderTranslateTask = () => (
    <>
      <div className="bg-[#10B981]/10 rounded-2xl p-6 mb-4 border border-[#10B981]/30">
        <p className="text-body text-[#FFFFFF] font-medium">{step.taskKz}</p>
      </div>
      <div className="bg-[#3B82F6]/10 rounded-2xl p-6 mb-4 border border-[#3B82F6]/30">
        <p className="text-body text-[#FFFFFF] font-medium">{step.taskRu}</p>
      </div>
      <input
        type="text"
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('Аударманы жаз...', 'Напиши перевод...', lang)}
        className="w-full px-6 py-5 bg-[#1C1C24] border border-[#2C2C34] rounded-2xl text-body text-[#FFFFFF] placeholder-[#6B6B7B] focus:border-[#6366F1] focus:outline-none transition-colors font-medium"
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
      <div className="card-premium p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/20 flex items-center justify-center">
            <span className="text-3xl">✏️</span>
          </div>
          <div className="text-caption text-[#8B5CF6] uppercase tracking-wider font-medium">
            {t('Тапсырма', 'Задание', lang)}
          </div>
        </div>
        
        {renderTask()}
      </div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ y: 2 }}
          onClick={onSkip}
          className="flex-1 py-5 glass glass-hover text-[#A0A0B0] font-medium rounded-2xl text-body"
        >
          {t('Өткізу', 'Пропустить', lang)}
        </motion.button>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ y: 2 }}
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className="flex-1 py-5 btn-premium text-white font-bold rounded-2xl text-body disabled:opacity-40"
        >
          {t('Тексеру', 'Проверить', lang)}
        </motion.button>
      </div>
    </motion.div>
  );
}