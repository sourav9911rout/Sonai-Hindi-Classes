/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: 'BengaliToHindi' | 'EnglishToHindi' | 'Vocabulary' | 'Grammar' | 'Sentence' | 'Converstation';
}

export interface QuizSet {
  id: string;
  questions: Question[];
  isCompleted: boolean;
  score: number;
}

export interface DailyData {
  date: string; // ISO date string (YYYY-MM-DD)
  sets: QuizSet[];
}

export interface UserHistory {
  date: string;
  totalScore: number;
  totalQuestions: number;
  accuracy: number;
  setsCompleted: number;
}

export interface AppProgress {
  streak: number;
  lastCompletedDate: string | null;
  history: UserHistory[];
}

export interface AppSettings {
  soundEnabled: boolean;
  difficulty: 'Beginner' | 'Intermediate';
}
