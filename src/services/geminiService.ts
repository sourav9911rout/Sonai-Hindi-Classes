import { GoogleGenAI } from "@google/genai";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Question } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not defined. Please add it to your environment variables (e.g., in Vercel settings).");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

export async function generateDailyQuestions(forceGenerate = false): Promise<Question[]> {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'dailyTasks', today);

  try {
    const docSnap = await getDoc(docRef);
    // If questions exist and we ARE NOT forcing generation, return them.
    // If we ARE forcing generation, we skip this and generate new ones.
    if (docSnap.exists() && !forceGenerate) {
      return docSnap.data().questions;
    }
  } catch (error) {
    console.error("Firestore read failed", error);
  }

  // If we reach here: 
  // 1. Questions don't exist in Firestore 
  // 2. OR forceGenerate is true (Admin clicked Generate)
  if (!forceGenerate) {
    // If we are just a regular user and there's no data, we can't generate.
    return []; 
  }

  if (!apiKey || apiKey === "MISSING_KEY") {
    throw new Error("GEMINI_API_KEY is missing. Please add it to your Vercel Environment Variables.");
  }

  const prompt = `
    Generate EXACTLY 100 romantic and beginner-friendly Hindi learning MCQ questions for a wife from her husband.
    
    Structure:
    - 20 Questions: Bengali to Hindi translation
    - 20 Questions: English to Hindi translation
    - 20 Questions: Hindi Vocabulary (Visual/Contextual)
    - 20 Questions: Beginner Grammar (Gender/Verbs)
    - 20 Questions: Daily Romantic Conversations
    
    CRITICAL SCRIPT REQUIREMENT: 
    - ALL Hindi MUST be in DEVANAGARI (हिन्दी). NO ROMANIZED HINDI (no "Tum", use "तुम").
    - Bengali must be in Bengali script.
    
    JSON Structure (Return ONLY a raw JSON array):
    [
      {
        "id": "q1",
        "question": "Question text...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "Exact string from options",
        "explanation": "Cute/Romantic mix of Bengali, Hindi(Devanagari) and English. 🌸",
        "category": "BengaliToHindi"
      }
    ]
    
    Tone: Deeply romantic, encouraging, and sweet. Make her feel like a Queen.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Flash is better for high-volume generation
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 8192,
      }
    });
    
    const text = result.text || "";
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    // Save to Firestore for other users
    try {
      await setDoc(docRef, {
        date: today,
        questions: questions,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      // Even if saving fails, we return the questions
      handleFirestoreError(error, OperationType.WRITE, `dailyTasks/${today}`);
    }

    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

