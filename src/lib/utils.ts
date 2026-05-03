import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTodayDateString(): string {
  const now = new Date();
  // Adjust to 6 AM cycle. If it's before 6 AM, it's technically "yesterday's" cycle
  // But the requirement says "At 6:00 AM every day trigger Gemini API".
  // So if current time is 07:00 AM, it's for today.
  // If it's 04:00 AM, it's still for the previous cycle.
  const date = new Date(now);
  if (now.getHours() < 6) {
    date.setDate(date.getDate() - 1);
  }
  return date.toISOString().split('T')[0];
}

export function shouldGenerateNewQuestions(lastGeneratedDate: string | null): boolean {
  if (!lastGeneratedDate) return true;
  const today = getTodayDateString();
  return lastGeneratedDate !== today;
}
