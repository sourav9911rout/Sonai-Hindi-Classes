import { AppProgress, AppSettings, DailyData, UserHistory } from "../types";
import { getTodayDateString } from "../lib/utils";

const STORAGE_KEYS = {
  DAILY_DATA: 'sonai_hindi_daily',
  PROGRESS: 'sonai_hindi_progress',
  SETTINGS: 'sonai_hindi_settings',
  CUSTOM_API_KEY: 'sonai_hindi_custom_api_key',
};

export const StorageService = {
  getCustomApiKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_API_KEY);
  },

  setCustomApiKey(key: string | null) {
    if (key) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_API_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_API_KEY);
    }
  },

  getDailyData(): DailyData | null {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_DATA);
    return data ? JSON.parse(data) : null;
  },

  setDailyData(data: DailyData) {
    localStorage.setItem(STORAGE_KEYS.DAILY_DATA, JSON.stringify(data));
  },

  getProgress(): AppProgress {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : { streak: 0, lastCompletedDate: null, history: [] };
  },

  setProgress(progress: AppProgress) {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  },

  getSettings(): AppSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { soundEnabled: true, difficulty: 'Beginner' };
  },

  setSettings(settings: AppSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  saveQuizResult(setId: string, score: number, total: number) {
    const daily = this.getDailyData();
    if (!daily) return;

    const setIndex = daily.sets.findIndex(s => s.id === setId);
    if (setIndex !== -1) {
      daily.sets[setIndex].isCompleted = true;
      daily.sets[setIndex].score = score;
      this.setDailyData(daily);
    }

    // Check for streak update
    const allCompleted = daily.sets.every(s => s.isCompleted);
    // Use the actual question count for the high score check
    const allHighScored = daily.sets.every(s => (s.score / s.questions.length) >= 0.85);

    if (allCompleted && allHighScored) {
      this.updateStreak();
    }

    // Add to history if not already there for this day/set
    this.updateHistory(score, total);
  },

  updateStreak() {
    const progress = this.getProgress();
    const today = getTodayDateString();

    if (progress.lastCompletedDate === today) return;

    // Check if yesterday was completed to continue streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (progress.lastCompletedDate === yesterdayStr) {
      progress.streak += 1;
    } else {
      progress.streak = 1;
    }

    progress.lastCompletedDate = today;
    this.setProgress(progress);
  },

  updateHistory(score: number, total: number) {
    const progress = this.getProgress();
    const today = getTodayDateString();
    
    let historyItem = progress.history.find(h => h.date === today);
    if (!historyItem) {
      historyItem = {
        date: today,
        totalScore: score,
        totalQuestions: total,
        accuracy: (score / total) * 100,
        setsCompleted: 1
      };
      progress.history.unshift(historyItem);
    } else {
      historyItem.totalScore += score;
      historyItem.totalQuestions += total;
      historyItem.accuracy = (historyItem.totalScore / historyItem.totalQuestions) * 100;
      historyItem.setsCompleted += 1;
    }

    this.setProgress(progress);
  }
};
