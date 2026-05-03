import { motion } from 'motion/react';
import { GlassCard } from './ui/GlassCard';
import { Trophy, CheckCircle, XCircle, RefreshCcw, Heart } from 'lucide-react';
import { QuizSet } from '../types';

interface SummaryViewProps {
  quizSet: QuizSet;
  score: number;
  onRetry: () => void;
  onDone: () => void;
}

export function SummaryView({ quizSet, score, onRetry, onDone }: SummaryViewProps) {
  const percentage = Math.round((score / quizSet.questions.length) * 100);
  const isGreat = percentage >= 90;

  return (
    <div className="px-6 py-10 flex flex-col items-center max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-full pink-gradient flex items-center justify-center shadow-xl border-8 border-white/30">
          <Trophy size={60} className="text-white drop-shadow-lg" />
        </div>
        {isGreat && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-lg border-2 border-white"
          >
            <Heart size={20} className="text-red-500 fill-red-500" />
          </motion.div>
        )}
      </motion.div>

      <h1 className="text-3xl font-bold text-pink-900 mb-2">
        {isGreat ? "Brilliant, My Queen! 👸" : "Good Job, Sonai! ❤️"}
      </h1>
      <p className="text-pink-800/60 mb-8 font-bold text-xs uppercase tracking-widest">Test Set: {quizSet.id}</p>

      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <GlassCard className="text-center p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
          <p className="text-3xl font-display font-bold text-love-red">{score}/{quizSet.questions.length}</p>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Accuracy</p>
          <p className="text-3xl font-display font-bold text-love-red">{percentage}%</p>
        </GlassCard>
      </div>

      <GlassCard className="w-full mb-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Breakdown</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="text-green-500" size={18} /></div>
              <span className="font-semibold text-gray-700 text-lg">Correct</span>
            </div>
            <span className="font-bold text-green-600 text-xl">{score}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><XCircle className="text-red-500" size={18} /></div>
              <span className="font-semibold text-gray-700 text-lg">Incorrect</span>
            </div>
            <span className="font-bold text-red-600 text-xl">{quizSet.questions.length - score}</span>
          </div>
        </div>
      </GlassCard>

      <div className="flex flex-col gap-4 w-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDone}
          className="frosted-btn w-full py-5 text-xl"
        >
          Finish Today 💖
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="w-full bg-white/40 backdrop-blur-xl text-pink-700 font-bold py-5 rounded-3xl border border-white/40 flex items-center justify-center gap-2"
        >
          <RefreshCcw size={20} />
          Try Again
        </motion.button>
      </div>
    </div>
  );
}
