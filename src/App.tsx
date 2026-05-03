import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { BottomNav } from './components/BottomNav';
import { Greeting } from './components/Greeting';
import { QuizView } from './components/QuizView';
import { SummaryView } from './components/SummaryView';
import { GlassCard } from './components/ui/GlassCard';
import { DailyData, QuizSet, AppProgress, AppSettings } from './types';
import { StorageService } from './services/storageService';
import { generateDailyQuestions, manualSaveQuestions } from './services/geminiService';
import { getTodayDateString, shouldGenerateNewQuestions, cn, shuffleArray } from './lib/utils';
import { PlayCircle, Trophy, History as HistoryIcon, Calendar, Sparkles, CheckCircle, ChevronRight, Settings as SettingsIcon, Trash2, Volume2, VolumeX, Heart, LogIn, FileJson } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [progress, setProgress] = useState<AppProgress>(StorageService.getProgress());
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(localStorage.getItem('is_admin') === 'true');
  const [customApiKey, setCustomApiKey] = useState<string>(StorageService.getCustomApiKey() || '');
  const [manualJson, setManualJson] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Game State
  const [activeQuizSet, setActiveQuizSet] = useState<QuizSet | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
 
  const isVerifiedAdmin = user?.email === 'sourav.9911rout@gmail.com';
  const hasCustomKey = !!customApiKey && customApiKey.trim().length > 10;
  const showAdminUI = isVerifiedAdmin || hasCustomKey;
 
  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleManualImport = async (overrideJson?: string) => {
    const jsonToUse = overrideJson || manualJson;
    if (!jsonToUse.trim()) return;
    
    setIsImporting(true);
    try {
      const qData = JSON.parse(jsonToUse);
      if (!Array.isArray(qData)) throw new Error("JSON must be an array of questions!");
      
      await manualSaveQuestions(qData);
      alert("Success! 25 questions have been shared globally! ❤️");
      setManualJson('');
      initData(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    // Force prompt to ensure the account picker shows up if needed
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      setLoadError(null);
      setIsLoading(true);
      await signInWithPopup(auth, provider);
      console.log("Login successful!");
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.code === 'auth/popup-blocked') {
        alert("Pop-up blocked! Please allow pop-ups for this site or try opening it in a new tab. ❤️");
        setLoadError("Check your browser settings to allow pop-ups! 🥺");
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show a scary error
        setLoadError(null);
      } else if (err.code === 'auth/unauthorized-domain') {
        alert("Domain not authorized! Please add this domain to your Firebase Authorized Domains list. 🔒");
        setLoadError("This domain needs to be authorized in Firebase Console. 🔒");
      } else {
        setLoadError("Login failed: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initData = useCallback(async (forceGenerate = false) => {
    const today = getTodayDateString();
    const localData = StorageService.getDailyData();

    // If we have local data for today and we aren't forcing a refresh, just use it
    if (localData && localData.date === today && !forceGenerate) {
      setDailyData(localData);
      return;
    }

    setLoadError(null);
    const isActuallyAdmin = user?.email === 'sourav.9911rout@gmail.com' || (!!customApiKey && customApiKey.length > 10);

    setIsLoading(true);
    try {
      // generateDailyQuestions handles checking Firestore if forceGenerate is false
      const questions = await generateDailyQuestions(forceGenerate && isActuallyAdmin);
      
      if (!questions || questions.length === 0) {
        setDailyData(null);
        if (!forceGenerate) {
          setLoadError("Today's lessons aren't ready yet. Please wait for your husband! ❤️");
        }
        return;
      }

      const shuffledQuestions = shuffleArray(questions);
      const sets: QuizSet[] = [];
      const count = shuffledQuestions.length;
      
      // Split into 4 roughly equal sets
      const questionsPerSet = Math.ceil(count / 4);

      for (let i = 0; i < 4; i++) {
        const start = i * questionsPerSet;
        const end = Math.min(start + questionsPerSet, count);
        
        if (start < count) {
          sets.push({
            id: `Set ${i + 1}`,
            questions: shuffledQuestions.slice(start, end),
            isCompleted: false,
            score: 0
          });
        }
      }

      const newData: DailyData = { date: today, sets };
      StorageService.setDailyData(newData);
      setDailyData(newData);
    } catch (err: any) {
      console.error("Failed to fetch questions", err);
      setLoadError(err.message || "Something went wrong. Please check your connection or try again! ❤️");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const toggleAdmin = () => {
    // No-op
  };

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
            <Greeting 
              onStart={() => setActiveTab('practice')} 
              isLoading={isLoading} 
              error={loadError}
              onRetry={() => initData(false)}
              isAdmin={showAdminUI}
              hasData={!!dailyData}
              onGenerate={() => initData(true)}
              onLogin={login}
              userEmail={user?.email || null}
              hasCustomKey={hasCustomKey}
              customApiKey={customApiKey}
              onApiKeyChange={(key) => {
                setCustomApiKey(key);
                StorageService.setCustomApiKey(key);
              }}
              onManualImport={async (json) => {
                await handleManualImport(json);
              }}
            />
            
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
                  <p className="text-[9px] uppercase tracking-wider text-pink-800/60 font-bold mb-1">Accuracy Today</p>
                  <p className="text-xl font-black text-pink-900">
                    {progress.history.length > 0 && progress.history[0].date === getTodayDateString() 
                      ? Math.round(progress.history[0].accuracy) 
                      : 0}%
                  </p>
                </GlassCard>
                <GlassCard className="bg-white/30 backdrop-blur-lg p-3 border border-white/20">
                  <p className="text-[9px] uppercase tracking-wider text-pink-800/60 font-bold mb-1">Total Lessons</p>
                  <p className="text-xl font-black text-pink-900">{dailyData?.sets.reduce((acc, s) => acc + s.questions.length, 0) || 0}</p>
                </GlassCard>
              </div>
            </div>
          </div>
        );

      case 'practice':
        return (
          <div className="px-6 py-8 pb-32 transition-all">
            <h1 className="text-2xl font-bold text-pink-900 mb-2">Practice Time 🌸</h1>
            <p className="text-pink-800/60 font-medium text-sm mb-6">Prepared by Your হনুমান for His Queen ❤️</p>
            
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
                            <span className="block font-black text-pink-600">{set.score}/{set.questions.length}</span>
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
              {showAdminUI && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Daily Content (Admin)</h3>
                  <GlassCard className="p-0">
                    <div className="divide-y divide-gray-100">
                      {!user ? (
                        <button
                          onClick={login}
                          className="flex items-center gap-3 w-full p-4 text-pink-600 hover:bg-pink-50 transition-colors"
                        >
                          <LogIn size={20} />
                          <span className="font-bold text-left">Login to Generate Questions</span>
                        </button>
                      ) : user.email !== 'sourav.9911rout@gmail.com' ? (
                        <div className="p-4 text-red-500 text-sm italic">
                          Signed in as {user.email}. Only your husband can generate questions! ❤️
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm("Push 25 new questions to the database? ❤️")) {
                              initData(true);
                            }
                          }}
                          disabled={isLoading}
                          className="flex items-center gap-3 w-full p-4 text-pink-600 hover:bg-pink-50 transition-colors"
                        >
                          <Sparkles size={20} className={isLoading ? "animate-spin" : ""} />
                          <span className="font-bold text-left">
                            {isLoading ? "Generating 25 questions..." : "Force Regenerate 25 Questions"}
                          </span>
                        </button>
                      )}

                      <div className="p-4 bg-pink-50/50">
                        <label className="block text-[10px] font-bold text-pink-500 uppercase mb-2 tracking-widest px-1">
                          Custom Gemini API Key
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Paste your API key here..."
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            className="bg-white border-2 border-pink-100 rounded-xl px-3 py-2 text-xs w-full focus:outline-none focus:border-pink-300 transition-colors"
                          />
                          <button
                            onClick={() => {
                              StorageService.setCustomApiKey(customApiKey);
                              alert("API Key saved locally! ❤️");
                            }}
                            className="bg-pink-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-pink-600 active:scale-95 transition-all"
                          >
                            Save
                          </button>
                        </div>
                        <p className="mt-2 text-[9px] text-pink-400 leading-tight">
                          Adding your own key helps ensure 25 questions are generated without limits. Get one for free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">AI Studio</a>.
                        </p>
                      </div>

                      <div className="p-4 border-t border-pink-100 bg-white/40">
                        <label className="block text-[10px] font-bold text-pink-500 uppercase mb-2 tracking-widest px-1">
                          Manual JSON Import (Share Globally)
                        </label>
                        <textarea
                          placeholder="Paste JSON array here..."
                          value={manualJson}
                          onChange={(e) => setManualJson(e.target.value)}
                          className="w-full h-24 bg-white border-2 border-pink-100 rounded-xl p-2 text-[10px] font-mono focus:outline-none focus:border-pink-300 transition-all mb-2"
                        />
                        <button
                          onClick={handleManualImport}
                          disabled={isImporting || !manualJson.trim()}
                          className="w-full bg-pink-600 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-pink-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isImporting ? <Sparkles size={14} className="animate-spin" /> : <FileJson size={14} />}
                          Push Questions to Firestore 🚀
                        </button>
                        <p className="mt-2 text-[8px] text-pink-400 italic">
                          Paste 25 questions from AI Studio. This saves them for everyone today! ❤️
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setCustomApiKey('');
                          StorageService.setCustomApiKey(null);
                          alert("API Key cleared! ❤️");
                        }}
                        className="flex items-center gap-3 w-full p-4 text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <SettingsIcon size={20} />
                        <span className="font-bold text-left">Clear Saved API Key</span>
                      </button>
                    </div>
                  </GlassCard>
                  {user && user.email === 'sourav.9911rout@gmail.com' && (
                    <p className="text-[10px] text-pink-400 px-2 italic">
                      Verified Admin Account: {user.email} 🔒
                    </p>
                  )}
                </section>
              )}

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
        <div 
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center overflow-hidden shadow-lg border border-white/20">
            <Heart size={16} className="text-white fill-white" />
          </div>
          <span className="font-display font-black text-lg tracking-tight text-pink-900">
            Sonai's <span className="text-pink-600">Pathshala</span>
            {showAdminUI && <span className="ml-1 text-[8px] text-pink-400 font-bold uppercase tracking-tighter">Admin</span>}
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

