import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './ui/GlassCard';
import { Heart } from 'lucide-react';

const greetings = [
  "Hi Sonai ❤️",
  "Hi বুবু 🌸",
  "Hi সোনা 😘",
  "Hi কিসমিস 🥺",
  "Hi আলু পটল 💖",
  "Hi গোপু এর মা ❤️",
  "Hi আমার বউ 😘",
  "Hi পাগলি 💕",
  "Hi जन्नत 🌙"
];

interface GreetingProps {
  onStart: () => void;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function Greeting({ onStart, isLoading, error, onRetry }: GreetingProps) {
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg border border-white animate-pulse">
          {error ? "🥺" : "🌸"}
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-pink-900 mb-2"
      >
        {randomGreeting}
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full"
      >
        <GlassCard className="mb-8 border-white/40 p-5">
          <p className="text-base text-pink-900/80 leading-relaxed font-medium">
            {error ? error : "কেমন আছো? আজকের Hindi practice এর জন্যে ready তো? তাহলে নিচের বাটন এ ক্লিক করে আজকের 1st test start করো।"}
          </p>
        </GlassCard>

        {error ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="frosted-btn w-full py-5 px-8 text-xl flex items-center justify-center gap-3 bg-red-500/20"
          >
            Retry Generation ❤️
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            disabled={isLoading}
            className="frosted-btn w-full py-5 px-8 text-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : null}
            I love হনুমান 🐵
          </motion.button>
        )}
        
        {isLoading && (
          <p className="mt-4 text-pink-700/60 text-sm animate-pulse font-medium">
            Gemini is preparing your romantic lessons... 🌸
          </p>
        )}
        
        {!isLoading && !error && (
          <p className="mt-6 text-pink-700/60 text-sm italic font-medium">
            “My Sonai is improving everyday ❤️”
          </p>
        )}
      </motion.div>
    </div>
  );
}
