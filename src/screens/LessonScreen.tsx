import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useApp } from '../hooks/useApp';
import { t, checkAnswer, getCharacterSvgName } from '../utils/helpers';
import { playCorrectSound, playWrongSound, playClickSound, playTransitionSound } from '../utils/sounds';
import Character from '../components/Character';
import TaskInput from '../components/TaskInput';
import { getLessonById } from '../data';
import type { Step } from '../types';

type Phase = 'dialogue' | 'grammar' | 'task' | 'result';

export default function LessonScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, updateProgress } = useApp();
  const { lang } = state;

  const lesson = getLessonById(id || '');
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('dialogue');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  if (!lesson) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-body text-[#777777]">{t('Сабақ табылмады', 'Урок не найден', lang)}</p>
      </div>
    );
  }

  const step: Step = lesson.steps[stepIndex];
  const totalSteps = lesson.steps.length;
  const isLastStep = stepIndex === totalSteps - 1;

  const handleNext = () => {
    playTransitionSound();
    if (isLastStep) {
      updateProgress(lesson.id, {
        lessonId: lesson.id,
        completedSteps: totalSteps,
        totalSteps,
        score,
        lastPlayed: new Date().toISOString(),
      });
      navigate('/lessons');
      return;
    }
    setStepIndex(i => i + 1);
    setPhase('dialogue');
    setIsCorrect(null);
  };

  const handleTaskAnswer = (answer: string) => {
    const correct = checkAnswer(answer, step.answerKz);
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 10);
      playCorrectSound();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } else {
      playWrongSound();
    }
    setPhase('result');
  };

  const handleSkip = () => {
    playClickSound();
    setIsCorrect(false);
    setPhase('result');
  };

  const renderDialogue = () => (
    <motion.div
      key="dialogue"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-3xl p-8 border-2 border-[#E5E5E5]" style={{ boxShadow: '0 4px 0 #E5E5E5' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-[#58CC02]/10 flex items-center justify-center">
            <Character name={getCharacterSvgName(lesson.character)} size={64} isSpeaking={true} />
          </div>
          <div>
            <div className="text-caption text-[#58CC02] uppercase tracking-wider font-bold">
              {t('Диалог', 'Диалог', lang)}
            </div>
            <div className="text-small text-[#777777] font-bold">
              {lesson.character === 'aisha' ? 'Айша' : lesson.character === 'dima' ? 'Дима' : 'Мұғалім'}
            </div>
          </div>
        </div>
        
        <div className="bg-[#F7F7F7] rounded-2xl p-6 mb-4">
          <p className="text-body text-[#3C3C3C] whitespace-pre-line font-bold">
            {step.dialogueKz}
          </p>
        </div>
        
        <div className="border-t-2 border-[#E5E5E5] pt-4">
          <p className="text-small text-[#777777] italic whitespace-pre-line">
            <span className="text-[#58CC02] font-bold not-italic mr-2">перевод:</span>
            {step.dialogueRu}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ y: -4 }}
        whileTap={{ y: 4, boxShadow: 'none' }}
        onClick={() => { playClickSound(); setPhase('grammar'); }}
        className="w-full py-5 bg-[#58CC02] text-white font-bold rounded-2xl text-body shadow-duo-accent"
      >
        {t('Ережені көру', 'Правило', lang)} →
      </motion.button>
    </motion.div>
  );

  const renderGrammar = () => (
    <motion.div
      key="grammar"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-3xl p-8 border-2 border-[#E5E5E5]" style={{ boxShadow: '0 4px 0 #E5E5E5' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#1CB0F6]/10 flex items-center justify-center">
            <span className="text-3xl">📐</span>
          </div>
          <div className="text-caption text-[#1CB0F6] uppercase tracking-wider font-bold">
            {t('Грамматика', 'Грамматика', lang)}
          </div>
        </div>
        
        <div className="bg-[#F7F7F7] rounded-2xl p-6 mb-4">
          <p className="text-body text-[#3C3C3C] whitespace-pre-line font-bold">
            {step.grammarKz}
          </p>
        </div>
        
        <div className="border-t-2 border-[#E5E5E5] pt-4">
          <p className="text-small text-[#777777] italic whitespace-pre-line">
            <span className="text-[#1CB0F6] font-bold not-italic mr-2">перевод:</span>
            {step.grammarRu}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border-2 border-[#E5E5E5]" style={{ boxShadow: '0 4px 0 #E5E5E5' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFC800]/10 flex items-center justify-center">
            <Character name="teacher" size={32} />
          </div>
          <div className="text-caption text-[#FF9600] uppercase tracking-wider font-bold">
            {t('Мұғалім', 'Учитель', lang)}
          </div>
        </div>
        <div className="bg-[#F7F7F7] rounded-2xl p-4">
          <p className="text-small text-[#3C3C3C] mb-2 font-bold">
            {step.teacherKz1}
          </p>
          <p className="text-caption text-[#777777] italic">
            <span className="text-[#FF9600] not-italic mr-2 font-bold">перевод:</span>
            {step.teacherRu1}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ y: -4 }}
        whileTap={{ y: 4, boxShadow: 'none' }}
        onClick={() => { playClickSound(); setPhase('task'); }}
        className="w-full py-5 bg-[#1CB0F6] text-white font-bold rounded-2xl text-body"
        style={{ boxShadow: '0 4px 0 #0E8BC1' }}
      >
        {t('Тапсырма', 'Задание', lang)} →
      </motion.button>
    </motion.div>
  );

  const renderTask = () => (
    <TaskInput
      step={step}
      lang={lang}
      onAnswer={handleTaskAnswer}
      onSkip={handleSkip}
    />
  );

  const renderResult = () => (
    <motion.div
      key="result"
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
              <p className="text-display text-[#58CC02]">{step.answerKz}</p>
            </div>
            <p className="text-small text-[#777777] italic">
              <span className="text-[#58CC02] not-italic mr-2 font-bold">перевод:</span>
              {step.answerRu}
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

      <div className="w-full bg-white rounded-3xl p-6 border-2 border-[#E5E5E5]" style={{ boxShadow: '0 4px 0 #E5E5E5' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFC800]/10 flex items-center justify-center">
            <Character name="teacher" size={32} />
          </div>
          <div className="text-caption text-[#FF9600] uppercase tracking-wider font-bold">
            {t('Мұғалім', 'Учитель', lang)}
          </div>
        </div>
        <div className="bg-[#F7F7F7] rounded-2xl p-4">
          <p className="text-small text-[#3C3C3C] mb-2 font-bold">
            {step.teacherKz2}
          </p>
          <p className="text-caption text-[#777777] italic">
            <span className="text-[#FF9600] not-italic mr-2 font-bold">перевод:</span>
            {step.teacherRu2}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ y: -4 }}
        whileTap={{ y: 4, boxShadow: 'none' }}
        onClick={handleNext}
        className="w-full py-5 bg-[#58CC02] text-white font-bold rounded-2xl text-body shadow-duo-accent"
      >
        {isLastStep ? t('Аяқтау', 'Завершить', lang) : t('Келесі', 'Далее', lang)} →
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-[100dvh] px-6 md:px-12 lg:px-24 py-8 bg-gradient-to-b from-[#58CC02]/5 to-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClickSound(); navigate('/lessons'); }}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border-2 border-[#E5E5E5] shadow-duo"
          >
            <span className="text-2xl">←</span>
          </motion.button>
          
          <div className="flex-1">
            <div className="text-caption text-[#AFAFAF] uppercase tracking-wider mb-2 font-bold">
              {t('Сабақ', 'Урок', lang)} {stepIndex + 1} / {totalSteps}
            </div>
            <div className="h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${((stepIndex + (phase !== 'dialogue' ? 1 : 0)) / totalSteps) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-[#58CC02] to-[#58CC02] rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-3 bg-[#58CC02] rounded-2xl"
            style={{ boxShadow: '0 4px 0 #46A302' }}
          >
            <span className="text-2xl">💎</span>
            <span className="text-body text-white font-bold">{score}</span>
          </motion.div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {phase === 'dialogue' && renderDialogue()}
          {phase === 'grammar' && renderGrammar()}
          {phase === 'task' && renderTask()}
          {phase === 'result' && renderResult()}
        </AnimatePresence>

      </div>
    </div>
  );
}