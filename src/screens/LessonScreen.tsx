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
        <p className="text-body text-[#A0A0B0]">{t('Сабақ табылмады', 'Урок не найден', lang)}</p>
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
      <div className="card-premium p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-[#6366F1]/20 flex items-center justify-center">
            <Character name={getCharacterSvgName(lesson.character)} size={64} isSpeaking={true} />
          </div>
          <div>
            <div className="text-caption text-[#6366F1] uppercase tracking-wider font-medium">
              {t('Диалог', 'Диалог', lang)}
            </div>
            <div className="text-small text-[#A0A0B0] font-medium">
              {lesson.character === 'aisha' ? 'Айша' : lesson.character === 'dima' ? 'Дима' : 'Мұғалім'}
            </div>
          </div>
        </div>
        
        <div className="bg-[#1C1C24] rounded-2xl p-6 mb-4">
          <p className="text-body text-[#FFFFFF] whitespace-pre-line">
            {step.dialogueKz}
          </p>
        </div>
        
        <div className="border-t border-[#1C1C24] pt-4">
          <p className="text-small text-[#A0A0B0] italic whitespace-pre-line">
            <span className="text-[#6366F1] font-medium not-italic mr-2">перевод:</span>
            {step.dialogueRu}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ y: 2 }}
        onClick={() => { playClickSound(); setPhase('grammar'); }}
        className="btn-premium w-full py-5 text-white text-body"
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
      <div className="card-premium p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/20 flex items-center justify-center">
            <span className="text-3xl">📐</span>
          </div>
          <div className="text-caption text-[#3B82F6] uppercase tracking-wider font-medium">
            {t('Грамматика', 'Грамматика', lang)}
          </div>
        </div>
        
        <div className="bg-[#1C1C24] rounded-2xl p-6 mb-4">
          <p className="text-body text-[#FFFFFF] whitespace-pre-line">
            {step.grammarKz}
          </p>
        </div>
        
        <div className="border-t border-[#1C1C24] pt-4">
          <p className="text-small text-[#A0A0B0] italic whitespace-pre-line">
            <span className="text-[#3B82F6] font-medium not-italic mr-2">перевод:</span>
            {step.grammarRu}
          </p>
        </div>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/20 flex items-center justify-center">
            <Character name="teacher" size={32} />
          </div>
          <div className="text-caption text-[#F59E0B] uppercase tracking-wider font-medium">
            {t('Мұғалім', 'Учитель', lang)}
          </div>
        </div>
        <div className="bg-[#1C1C24] rounded-2xl p-4">
          <p className="text-small text-[#FFFFFF] mb-2">
            {step.teacherKz1}
          </p>
          <p className="text-caption text-[#A0A0B0] italic">
            <span className="text-[#F59E0B] not-italic mr-2 font-medium">перевод:</span>
            {step.teacherRu1}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ y: 2 }}
        onClick={() => { playClickSound(); setPhase('task'); }}
        className="w-full py-5 bg-[#3B82F6] text-white font-bold rounded-2xl text-body"
        style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}
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
        {isCorrect ? '🎉' : '😔'}
      </motion.div>

      <div className="text-center space-y-4">
        <h2 className={`text-heading ${isCorrect ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {isCorrect ? t('Дұрыс!', 'Правильно!', lang) : t('Қате', 'Не совсем', lang)}
        </h2>
        
        {!isCorrect && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-small text-[#A0A0B0] font-medium">
              {t('Дұрыс жауап:', 'Правильный ответ:', lang)}
            </p>
            <div className="bg-[#10B981]/10 rounded-2xl px-6 py-4 border border-[#10B981]/30">
              <p className="text-display text-[#10B981]">{step.answerKz}</p>
            </div>
            <p className="text-small text-[#A0A0B0] italic">
              <span className="text-[#10B981] not-italic mr-2 font-medium">перевод:</span>
              {step.answerRu}
            </p>
          </motion.div>
        )}
        
        {isCorrect && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-[#10B981]/10 rounded-2xl px-8 py-4 border border-[#10B981]/30"
          >
            <p className="text-heading text-[#10B981] font-bold">+10 XP 💎</p>
          </motion.div>
        )}
      </div>

      <div className="w-full card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/20 flex items-center justify-center">
            <Character name="teacher" size={32} />
          </div>
          <div className="text-caption text-[#F59E0B] uppercase tracking-wider font-medium">
            {t('Мұғалім', 'Учитель', lang)}
          </div>
        </div>
        <div className="bg-[#1C1C24] rounded-2xl p-4">
          <p className="text-small text-[#FFFFFF] mb-2">
            {step.teacherKz2}
          </p>
          <p className="text-caption text-[#A0A0B0] italic">
            <span className="text-[#F59E0B] not-italic mr-2 font-medium">перевод:</span>
            {step.teacherRu2}
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ y: 2 }}
        onClick={handleNext}
        className="btn-premium w-full py-5 text-white text-body"
      >
        {isLastStep ? t('Аяқтау', 'Завершить', lang) : t('Келесі', 'Далее', lang)} →
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-[100dvh] relative overflow-hidden">
      <div className="mesh-bg" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl" />

      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playClickSound(); navigate('/lessons'); }}
              className="glass glass-hover w-14 h-14 flex items-center justify-center rounded-2xl"
            >
              <span className="text-2xl">←</span>
            </motion.button>
            
            <div className="flex-1">
              <div className="text-caption text-[#6B6B7B] uppercase tracking-wider mb-2 font-medium">
                {t('Сабақ', 'Урок', lang)} {stepIndex + 1} / {totalSteps}
              </div>
              <div className="h-2 bg-[#1C1C24] rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${((stepIndex + (phase !== 'dialogue' ? 1 : 0)) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full"
                />
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl"
            >
              <span className="text-xl">💎</span>
              <span className="text-body text-[#FFFFFF] font-bold">{score}</span>
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
    </div>
  );
}