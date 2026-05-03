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

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function playSound(frequency: number, duration: number = 0.2, type: OscillatorType = 'sine') {
  try {
    const audioContent = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContent.createOscillator();
    const gainNode = audioContent.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContent.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioContent.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContent.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContent.destination);

    oscillator.start();
    oscillator.stop(audioContent.currentTime + duration);
  } catch (e) {
    console.error("Audio not supported or blocked", e);
  }
}

export function playSuccessSound() {
  playSound(523.25, 0.3); // C5
  setTimeout(() => playSound(659.25, 0.3), 100); // E5
}

export function playErrorSound() {
  playSound(220, 0.4, 'sawtooth'); // A3
}
