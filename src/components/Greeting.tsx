import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './ui/GlassCard';
import { Heart } from 'lucide-react';
import { StorageService } from '../services/storageService';

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
  isAdmin?: boolean;
  hasData?: boolean;
  onGenerate?: () => void;
  onLogin?: () => void;
  userEmail?: string | null;
  hasCustomKey?: boolean;
  customApiKey?: string;
  onApiKeyChange?: (key: string) => void;
}

export function Greeting({ 
  onStart, 
  isLoading, 
  error, 
  onRetry, 
  isAdmin, 
  hasData, 
  onGenerate, 
  onLogin, 
  userEmail, 
  hasCustomKey,
  customApiKey,
  onApiKeyChange 
}: GreetingProps) {
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const isVerifiedAdmin = userEmail === 'sourav.9911rout@gmail.com';

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full mb-4"
          />
          <p className="text-pink-700 font-black text-xl mb-1">Your হনুমান Is Preparing Your Lesson... 🌸</p>
          <p className="text-sm text-pink-400 mt-1 italic font-medium px-4">
            Your হনুমান is hand-crafting 100 new tasks special for you জান! ❤️
          </p>
          <p className="text-[10px] text-pink-300 mt-4 font-mono animate-pulse uppercase tracking-widest">
            {hasCustomKey ? "Generating Using Custom API Key..." : "Fetching Love Lessons..."}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <>
          <GlassCard className="mb-8 border-white/40 p-5 bg-red-50/50">
            <p className="text-base text-pink-900/80 leading-relaxed font-medium">{error}</p>
          </GlassCard>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="frosted-btn w-full py-5 px-8 text-xl flex items-center justify-center gap-3 bg-white"
          >
            Try Again ❤️
          </motion.button>
        </>
      );
    }

    const isActuallyAdmin = userEmail === 'sourav.9911rout@gmail.com' || hasCustomKey;

    return (
      <div className="space-y-6">
        {hasData ? (
          <>
            <GlassCard className="border-white/40 p-5 bg-white/40">
              <p className="text-base text-pink-900/80 leading-relaxed font-medium">
                কেমন আছো? আজকের Hindi practice এর জন্যে ready তো? তাহলে নিচের বাটন এ ক্লিক করে আজকের 1st test start করো।
              </p>
            </GlassCard>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="frosted-btn w-full py-5 px-8 text-xl flex items-center justify-center gap-3 bg-white border-2 border-pink-100 shadow-sm"
            >
              I love হনুমান 🐵
            </motion.button>
            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-pink-200"></div>
              <span className="flex-shrink mx-4 text-xs text-pink-300 font-bold uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-pink-200"></div>
            </div>
          </>
        ) : (
          <GlassCard className="border-white/40 p-5">
            <p className="text-base text-pink-900/80 leading-relaxed font-medium">
              {isActuallyAdmin 
                ? "Sonai, today's lessons are empty! Enter your key below or sign in to generate 100 tasks. ❤️" 
                : "Today's Hindi lessons are being prepared by your husband. Please check back in a few minutes! 🥺❤️"}
            </p>
          </GlassCard>
        )}

        {!isVerifiedAdmin && (
          <div className="p-4 bg-white/50 rounded-2xl border-2 border-pink-100 shadow-sm text-left">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="block text-[10px] font-bold text-pink-500 uppercase tracking-widest">
                Gemini API Key
              </label>
              {hasCustomKey && (
                <span className="text-[9px] text-green-500 font-bold">ACTIVE ✅</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder={hasCustomKey ? "Change your key..." : "Paste your key here..."}
                value={customApiKey}
                onChange={(e) => onApiKeyChange?.(e.target.value)}
                className="bg-white border text-sm rounded-xl px-3 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all font-mono"
              />
              {customApiKey !== StorageService.getCustomApiKey() && (
                <button
                  onClick={() => onApiKeyChange?.(customApiKey || "")}
                  className="bg-pink-500 text-white px-3 py-2 rounded-xl text-[10px] font-bold"
                >
                  Save
                </button>
              )}
            </div>
            <p className="mt-2 text-[9px] text-pink-400">
              {hasCustomKey 
                ? "Your custom key is being used for generation. ❤️" 
                : "Get a free key at AI Studio for unlimited learning! 🌸"}
            </p>
          </div>
        )}

        {isActuallyAdmin ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerate}
            className="frosted-btn w-full py-5 px-8 text-xl flex items-center justify-center gap-3 bg-pink-500 text-white shadow-lg shadow-pink-200/50"
          >
            {hasData ? "Refresh 100 Lessons 🌸" : "Generate 100 Lessons 🌸"}
          </motion.button>
        ) : (
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogin}
              className="frosted-btn w-full py-5 px-8 text-xl flex items-center justify-center gap-3 bg-white border-2 border-pink-100 shadow-sm"
            >
              Sign in with Google 🔑
            </motion.button>
          </div>
        )}
        
        {hasData && (
          <p className="text-pink-700/60 text-sm italic font-medium">
            “My Sonai is improving everyday ❤️”
          </p>
        )}
      </div>
    );
  };

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
        {renderContent()}
      </motion.div>
    </div>
  );
}
