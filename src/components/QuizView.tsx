import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, QuizSet } from '../types';
import { GlassCard } from './ui/GlassCard';
import { Volume2, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizViewProps {
  quizSet: QuizSet;
  onComplete: (score: number) => void;
}

const motivationalMessages = [
  "I love you ❤️",
  "My বুবু পারবে 💕",
  "তুমি gopu এর mummy na 🤭💖",
  "Proud of you জান ❤️",
  "Hindi Queen 👑",
  "আমার বউ তো smart 😘",
  "তুমি পারবেই 🌸",
  "হনুমান তোমার উপর proud 🐵❤️",
  "My Sonai is improving everyday ❤️",
  "Keep going আমার জান 💖"
];

export function QuizView({ quizSet, onComplete }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showMotivational, setShowMotivational] = useState(false);
  const [motivationalMsg, setMotivationalMsg] = useState("");

  const currentQuestion = quizSet.questions[currentIndex];

  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return;

    setSelectedOption(option);
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB6C1', '#FF6B6B', '#FFF0F5']
      });
    }

    setMotivationalMsg(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
    setTimeout(() => {
      setShowMotivational(true);
    }, 600);
  };

  const handleNext = () => {
    setShowMotivational(false);
    if (currentIndex < quizSet.questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      onComplete(score);
    }
  };

  const speak = (text: string) => {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'hi-IN';
    synth.speak(utter);
  };

  const progress = ((currentIndex + 1) / quizSet.questions.length) * 100;

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-32 max-w-lg mx-auto">
      {/* Progress Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-3 bg-gray-200/50 rounded-full overflow-hidden glass">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full pink-gradient"
          />
        </div>
        <span className="text-sm font-bold text-pink-900">
          {currentIndex + 1}/{quizSet.questions.length}
        </span>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="flex-1 overflow-y-auto pb-4"
        >
          <GlassCard className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 text-[10px] font-bold uppercase tracking-wider border border-pink-200/50">
                {currentQuestion.category}
              </span>
              <button 
                onClick={() => speak(currentQuestion.question)}
                className="p-2 rounded-full bg-romantic-pink/10 text-love-red hover:bg-romantic-pink/20"
              >
                <Volume2 size={20} />
              </button>
            </div>
            <h2 className="text-2xl font-display font-semibold text-gray-800 leading-snug">
              {currentQuestion.question}
            </h2>
          </GlassCard>

          {/* Options List */}
          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.98 }}
                disabled={selectedOption !== null}
                onClick={() => handleOptionSelect(option)}
                className={`w-full p-5 rounded-2xl text-left font-semibold text-lg border transition-all flex items-center justify-between shadow-sm relative overflow-hidden group backdrop-blur-md ${
                  selectedOption === option
                    ? isCorrect
                      ? "bg-green-100/50 border-green-500 text-green-800"
                      : "bg-red-100/50 border-red-500 text-red-800"
                    : selectedOption !== null && option === currentQuestion.correctAnswer
                      ? "bg-green-100/30 border-green-400 text-green-800"
                      : "bg-white/40 border-white/50 text-pink-900 hover:border-pink-300"
                }`}
              >
                <span>{option}</span>
                {selectedOption === option && (
                  isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />
                )}
                {selectedOption !== null && option === currentQuestion.correctAnswer && selectedOption !== option && (
                  <CheckCircle2 className="text-green-500/50" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Motivational Popup / Next Button */}
      <AnimatePresence>
        {showMotivational && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none"
          >
            <GlassCard className="bg-pink-100/80 backdrop-blur-3xl border-white/40 overflow-visible pointer-events-auto shadow-2xl">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white/80 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isCorrect ? 'happy' : 'sad'}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-4xl"
                  >
                    {isCorrect ? '🥰' : '🥺'}
                  </motion.span>
                </AnimatePresence>
              </div>
              
              <div className="pt-8 text-center">
                <h3 className="text-2xl font-bold text-pink-900 mb-2">{motivationalMsg}</h3>
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/40 mb-6 mx-2">
                  <p className="text-sm text-pink-900/80 font-medium leading-relaxed italic">
                    {currentQuestion.explanation}
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="frosted-btn w-full py-5 text-xl flex items-center justify-center gap-2"
                >
                  {currentIndex === quizSet.questions.length - 1 ? "Finish Quiz" : "Next Question"}
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
