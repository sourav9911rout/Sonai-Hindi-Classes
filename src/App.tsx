import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BottomNav } from './components/BottomNav';
import { Greeting } from './components/Greeting';
import { QuizView } from './components/QuizView';
import { SummaryView } from './components/SummaryView';
import { GlassCard } from './components/ui/GlassCard';
import { DailyData, QuizSet, AppProgress, AppSettings } from './types';
import { StorageService } from './services/storageService';
import { generateDailyQuestions } from './services/geminiService';
import { getTodayDateString, shouldGenerateNewQuestions, cn } from './lib/utils';
import { PlayCircle, Trophy, History as HistoryIcon, Calendar, Sparkles, CheckCircle, ChevronRight, Settings as SettingsIcon, Trash2, Volume2, VolumeX, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [progress, setProgress] = useState<AppProgress>(StorageService.getProgress());
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  
  // Game State
  const [activeQuizSet, setActiveQuizSet] = useState<QuizSet | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const initData = useCallback(async () => {
    const existing = StorageService.getDailyData();
    const today = getTodayDateString();

    if (shouldGenerateNewQuestions(existing?.date || null)) {
      setIsLoading(true);
      try {
        const questions = await generateDailyQuestions();
        const sets: QuizSet[] = [];
        for (let i = 0; i < 4; i++) {
          sets.push({
            id: `Set ${i + 1}`,
            questions: questions.slice(i * 25, (i + 1) * 25),
            isCompleted: false,
            score: 0
          });
        }
        const newData: DailyData = { date: today, sets };
        StorageService.setDailyData(newData);
        setDailyData(newData);
      } catch (err) {
        console.error("Failed to generate questions", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setDailyData(existing);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  const handleStartPractice = (quizSet: QuizSet) => {
    setActiveQuizSet(quizSet);
    setActiveTab('practice_active');
  };

  const handleCompleteQuiz = (score: number) => {
    if (!activeQuizSet) return;
    setQuizScore(score);
    setShowSummary(true);
    StorageService.saveQuizResult(activeQuizSet.id, score, activeQuizSet.questions.length);
    setDailyData(StorageService.getDailyData());
    const newProgress = StorageService.getProgress();
    setProgress(newProgress);

    // Refresh streak reward if needed
    if (newProgress.streak >= 7) {
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#FFB6C1', '#FF6B6B', '#FFD700']
      });
    }
  };

  const handleFinishDay = () => {
    setShowSummary(false);
    setActiveQuizSet(null);
    setActiveTab('home');
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all progress, Sonai? 🥺")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const renderContent = () => {
    if (activeTab === 'practice_active' && activeQuizSet) {
      if (showSummary) {
        return <SummaryView quizSet={activeQuizSet} score={quizScore} onRetry={() => setShowSummary(false)} onDone={handleFinishDay} />;
      }
      return <QuizView quizSet={activeQuizSet} onComplete={handleCompleteQuiz} />;
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="px-6 py-6 pb-24">
            <Greeting onStart={() => setActiveTab('practice')} isLoading={isLoading} />
            
            <GlassCard className="mt-8 pink-gradient text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Trophy size={28} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">Current Streak</h3>
                  <p className="text-3xl font-black">{progress.streak} Days 🔥</p>
                </div>
              </div>
              {progress.streak >= 7 && (
                <p className="text-sm font-medium bg-white/20 p-2 rounded-lg italic">
                  "Congratulations ❤️ You completed 7 days streak successfully. Now ask your হনুমান for your favorite gift from Flipkart or Meesho 🎁"
                </p>
              )}
            </GlassCard>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-pink-900 flex items-center gap-2">
                <Sparkles className="text-orange-500" size={20} />
                Daily Insights
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="bg-white/30 backdrop-blur-lg p-3 border border-white/20">
                  <p className="text-[9px] uppercase tracking-wider text-pink-800/60 font-bold mb-1">Sets Today</p>
                  <p className="text-xl font-black text-pink-900">{dailyData?.sets.filter(s => s.isCompleted).length || 0}/4</p>
                </GlassCard>
                <GlassCard className="bg-white/30 backdrop-blur-lg p-3 border border-white/20">
                  <p className="text-[9px] uppercase tracking-wider text-pink-800/60 font-bold mb-1">Accuracy</p>
                  <p className="text-xl font-black text-pink-900">
                    {progress.history.length > 0 ? Math.round(progress.history[0].accuracy) : 0}%
                  </p>
                </GlassCard>
              </div>
            </div>
          </div>
        );

      case 'practice':
        return (
          <div className="px-6 py-8 pb-32 transition-all">
            <h1 className="text-2xl font-bold text-pink-900 mb-2">Practice Time 🌸</h1>
            <p className="text-pink-800/60 font-medium text-sm mb-6">Generated by Gemini for My Queen</p>
            
            <div className="grid gap-4">
              {dailyData?.sets.map((set, idx) => (
                <motion.div
                  key={set.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <button
                    onClick={() => handleStartPractice(set)}
                    className="w-full"
                  >
                    <GlassCard className={cn(
                      "flex items-center justify-between p-5 transition-all text-left backdrop-blur-lg border-white/30",
                      set.isCompleted ? "bg-white/20" : "bg-white/40 shadow-lg"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-inner",
                          set.isCompleted ? "bg-pink-100 text-pink-400" : "bg-pink-500 text-white"
                        )}>
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-pink-900">{set.id}</h3>
                          <p className="text-[10px] uppercase font-bold text-pink-800/60 leading-none">Beginner Level</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {set.isCompleted ? (
                          <div className="text-right">
                            <span className="block font-black text-pink-600">{set.score}/25</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
                             <ChevronRight size={18} />
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="px-6 py-8 pb-32">
            <h1 className="text-3xl font-bold text-pink-900 mb-8 flex items-center gap-3">
              <HistoryIcon className="text-pink-600" />
              Past Achievements
            </h1>
            
            {progress.history.length === 0 ? (
              <GlassCard className="text-center py-12">
                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No results yet. Start practice to see your progress!</p>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {progress.history.map((item, idx) => (
                  <div key={idx}>
                    <GlassCard className="flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <p className="font-bold text-gray-800">{new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <span className="text-love-red font-bold">{Math.round(item.accuracy)}% Accuracy</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-gray-500">{item.setsCompleted} Sets completed</p>
                        <p className="text-green-600 font-bold">{item.totalScore}/{item.totalQuestions}</p>
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'progress':
        return (
          <div className="px-6 py-8 pb-32">
            <h1 className="text-3xl font-bold text-pink-900 mb-8 flex items-center gap-3">
              <Sparkles className="text-orange-500" />
              Detailed Progress
            </h1>

            <div className="grid gap-6">
              <GlassCard className="bg-pink-500 text-white text-center py-8 shadow-[0_10px_25px_-5px_rgba(236,72,153,0.3)]">
                <Heart className="mx-auto mb-2 fill-white animate-pulse" size={40} />
                <h3 className="text-xl font-bold mb-1">Your Love Quotient</h3>
                <p className="text-5xl font-black">{progress.history.length > 0 ? Math.round(progress.history.reduce((acc, h) => acc + h.accuracy, 0) / progress.history.length) : 0}%</p>
                <p className="text-sm opacity-80 mt-2">Overall Accuracy Since Beginning</p>
              </GlassCard>

              <div className="grid grid-cols-3 gap-3">
                <GlassCard className="text-center p-3 bg-white/40">
                  <p className="text-[10px] uppercase font-bold text-pink-800/60 leading-none mb-1">Streak</p>
                  <p className="text-xl font-black text-pink-900">{progress.streak}</p>
                </GlassCard>
                <GlassCard className="text-center p-3 bg-white/40">
                  <p className="text-[10px] uppercase font-bold text-pink-800/60 leading-none mb-1">Sets</p>
                  <p className="text-xl font-black text-pink-900">{progress.history.reduce((acc, h) => acc + h.setsCompleted, 0)}</p>
                </GlassCard>
                <GlassCard className="text-center p-3 bg-white/40">
                  <p className="text-[10px] uppercase font-bold text-pink-800/60 leading-none mb-1">Words</p>
                  <p className="text-xl font-black text-pink-900">{progress.history.reduce((acc, h) => acc + h.totalScore, 0) * 4}</p>
                </GlassCard>
              </div>

              {progress.streak >= 7 && (
                <GlassCard className="bg-yellow-50 border-yellow-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-400 text-white p-3 rounded-full shadow-lg">🎁</div>
                    <div>
                      <h4 className="font-bold text-gray-800">Reward Unlocked!</h4>
                      <p className="text-sm text-gray-600 italic">"Now ask your হনুমান for your favorite gift from Flipkart or Meesho 🎁"</p>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="px-6 py-8 pb-32">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-8 flex items-center gap-3">
              <SettingsIcon className="text-gray-600" />
              Settings
            </h1>

            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-xs font-bold text-pink-800/60 uppercase tracking-widest px-2">Preference</h3>
                <GlassCard className="divide-y divide-white/20 p-0 border-white/40">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {settings.soundEnabled ? <Volume2 size={20} className="text-pink-500" /> : <VolumeX size={20} className="text-pink-300" />}
                      <span className="font-semibold text-pink-900">Sound Effects</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newS = { ...settings, soundEnabled: !settings.soundEnabled };
                        setSettings(newS);
                        StorageService.setSettings(newS);
                      }}
                      className={cn(
                        "w-14 h-8 rounded-full transition-colors relative shadow-inner",
                        settings.soundEnabled ? "bg-pink-500" : "bg-white/40"
                      )}
                    >
                      <motion.div 
                        animate={{ x: settings.soundEnabled ? 24 : 4 }}
                        className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md" 
                      />
                    </button>
                  </div>
                </GlassCard>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Dangerous Zone</h3>
                <GlassCard className="p-0">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-3 w-full p-4 text-red-500 hover:bg-red-50 transition-colors rounded-3xl"
                  >
                    <Trash2 size={20} />
                    <span className="font-bold">Reset All Progress</span>
                  </button>
                </GlassCard>
              </section>

              <div className="text-center pt-8">
                <p className="text-sm text-gray-400 font-medium italic">Made with ❤️ for my wife</p>
                <p className="text-xs text-gray-300 mt-1">Version 1.0.0 (PWA)</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500 pb-16 text-pink-900">
      <header className="sticky top-0 z-50 glass backdrop-blur-3xl border-none px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center overflow-hidden shadow-lg border border-white/20">
            <Heart size={16} className="text-white fill-white" />
          </div>
          <span className="font-display font-black text-lg tracking-tight text-pink-900">
            Sonai's <span className="text-pink-600">Pathshala</span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/40 px-2 py-1 rounded-full backdrop-blur-md border border-white/30 shadow-sm">
          <Sparkles className="text-orange-500" size={14} />
          <span className="text-xs font-black text-pink-900">{progress.streak} Day Streak</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (activeQuizSet?.id || '')}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {!activeTab.includes('active') && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}

