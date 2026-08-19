import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useApp } from '../hooks/useApp';
import { t, checkAnswer } from '../utils/helpers';
import { playCorrectSound, playWrongSound, playClickSound, playTransitionSound } from '../utils/sounds';
import TaskInput from '../components/TaskInput';
import { lessons } from '../data';
import type { Step } from '../types';

interface ReviewQuestion {
  lessonId: string;
  lessonTitle: string;
  step: Step;
}

export default function ReviewScreen() {
  const navigate = useNavigate();
  const { state, addXp } = useApp();
  const { lang } = state;

  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const reviewQuestions: ReviewQuestion[] = [];
    
    Object.entries(state.progress).forEach(([lessonId, progress]) => {
      if (progress.completedSteps === progress.totalSteps) {
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson && lesson.steps.length > 0) {
          const randomStep = lesson.steps[Math.floor(Math.random() * lesson.steps.length)];
          reviewQuestions.push({
            lessonId,
            lessonTitle: lang === 'kz' ? lesson.titleKz : lesson.titleRu,
            step: randomStep,
          });
        }
      }
    });

    setQuestions(reviewQuestions.sort(() => Math.random() - 0.5).slice(0, 10));
  }, [state.progress, lang]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    const correct = checkAnswer(answer, currentQuestion.step.answerKz);
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 10);
      playCorrectSound();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } else {
      playWrongSound();
    }
  };

  const handleNext = () => {
    playTransitionSound();
    if (currentIndex === questions.length - 1) {
      addXp(score);
      setIsFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
      setIsCorrect(null);
    }
  };

  const handleSkip = () => {
    playClickSound();
    setIsCorrect(false);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="text-8xl">📚</div>
          <h2 className="text-heading text-[#3C3C3C]">
            {t('Повторение қолжетімсіз', 'Повторение недоступно', lang)}
          </h2>
          <p className="text-body text-[#777777]">
            {t('Алдымен кем дегенде бір сабақты аяқта', 'Сначала завершите хотя бы один урок', lang)}
          </p>
          <motion.button
            whileHover={{ y: -4 }}
            whileTap={{ y: 4, boxShadow: 'none' }}
            onClick={() => navigate('/menu')}
            className="px-8 py-4 bg-[#58CC02] text-white font-bold rounded-2xl text-body shadow-duo-accent"
          >
            {t('Артқа', 'Назад', lang)}
          </motion.button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="text-9xl"
          >
            🎉
          </motion.div>
          <h2 className="text-heading text-[#58CC02]">
            {t('Тамаша!', 'Отлично!', lang)}
          </h2>
          <div className="bg-white rounded-3xl p-8 border-2 border-[#E5E5E5]" style={{ boxShadow: '0 4px 0 #E5E5E5' }}>
            <div className="text-4xl mb-4">💎</div>
            <div className="text-display text-[#58CC02] mb-2">+{score} XP</div>
            <p className="text-body text-[#777777]">
              {t('Қайталау аяқталды', 'Повторение завершено', lang)}
            </p>
          </div>
          <div className="flex gap-4">
            <motion.button
              whileHover={{ y: -4 }}
              whileTap={{ y: 4, boxShadow: 'none' }}
              onClick={() => navigate('/menu')}
              className="flex-1 py-5 bg-white text-[#777777] font-bold rounded-2xl text-body border-2 border-[#E5E5E5] shadow-duo"
            >
              {t('Мәзірге', 'В меню', lang)}
            </motion.button>
            <motion.button
              whileHover={{ y: -4 }}
              whileTap={{ y: 4, boxShadow: 'none' }}
              onClick={() => {
                setCurrentIndex(0);
                setIsCorrect(null);
                setScore(0);
                setIsFinished(false);
                setQuestions(questions.sort(() => Math.random() - 0.5));
              }}
              className="flex-1 py-5 bg-[#58CC02] text-white font-bold rounded-2xl text-body shadow-duo-accent"
            >
              {t('Тағы', 'Ещё раз', lang)}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] px-6 md:px-12 lg:px-24 py-8 bg-gradient-to-b from-[#FFC800]/5 to-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClickSound(); navigate('/menu'); }}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border-2 border-[#E5E5E5] shadow-duo"
          >
            <span className="text-2xl">←</span>
          </motion.button>
          
          <div className="flex-1">
            <div className="text-caption text-[#AFAFAF] uppercase tracking-wider mb-2 font-bold">
              {t('Қайталау', 'Повторение', lang)} {currentIndex + 1} / {questions.length}
            </div>
            <div className="h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-[#FFC800] to-[#FF9600] rounded-full"
              />
            </div>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-3 bg-[#FFC800] rounded-2xl"
            style={{ boxShadow: '0 4px 0 #E5A600' }}
          >
            <span className="text-2xl">💎</span>
            <span className="text-body text-white font-bold">{score}</span>
          </motion.div>
        </div>

        {/* Lesson info */}
        <div className="bg-[#FFC800]/10 rounded-2xl px-6 py-4 border-2 border-[#FFC800]/30">
          <p className="text-caption text-[#FF9600] font-bold">
            {t('Сабақ:', 'Урок:', lang)} {currentQuestion.lessonTitle}
          </p>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isCorrect === null ? (
            <TaskInput
              key={`question-${currentIndex}`}
              step={currentQuestion.step}
              lang={lang}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
            />
          ) : (
            <motion.div
              key={`result-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="space-y-8 flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                className="text-9xl"
              >
                {isCorrect ? '🎉' : ''}
              </motion.div>

              <div className="text-center space-y-4">
                <h2 className={`text-heading ${isCorrect ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>
                  {isCorrect ? t('Дұрыс!', 'Правильно!', lang) : t('Қате', 'Не совсем', lang)}
                </h2>
                
                {!isCorrect && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-small text-[#777777] font-bold">
                      {t('Дұрыс жауап:', 'Правильный ответ:', lang)}
                    </p>
                    <div className="bg-[#58CC02]/10 rounded-2xl px-6 py-4 border-2 border-[#58CC02]/30">
                      <p className="text-display text-[#58CC02]">{currentQuestion.step.answerKz}</p>
                    </div>
                    <p className="text-small text-[#777777] italic">
                      <span className="text-[#58CC02] not-italic mr-2 font-bold">перевод:</span>
                      {currentQuestion.step.answerRu}
                    </p>
                  </motion.div>
                )}
                
                {isCorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 15, stiffness: 200 }}
                    className="bg-[#58CC02]/10 rounded-2xl px-8 py-4 border-2 border-[#58CC02]/30"
                  >
                    <p className="text-heading text-[#58CC02] font-bold">+10 XP 💎</p>
                  </motion.div>
                )}
              </div>

              <motion.button
                whileHover={{ y: -4 }}
                whileTap={{ y: 4, boxShadow: 'none' }}
                onClick={handleNext}
                className="w-full py-5 bg-[#FFC800] text-white font-bold rounded-2xl text-body"
                style={{ boxShadow: '0 4px 0 #E5A600' }}
              >
                {currentIndex === questions.length - 1 
                  ? t('Аяқтау', 'Завершить', lang) 
                  : t('Келесі', 'Далее', lang)} →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}