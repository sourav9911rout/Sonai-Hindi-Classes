import { GoogleGenAI } from "@google/genai";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Question } from "../types";
import { StorageService } from "./storageService";
import { getTodayDateString } from "../lib/utils";

export async function generateDailyQuestions(forceGenerate = false): Promise<Question[]> {
  const today = getTodayDateString();
  const docRef = doc(db, 'dailyTasks', today);
  
  // Try to use local cache first if not forcing
  const localData = StorageService.getDailyData();
  if (localData && localData.date === today && !forceGenerate) {
    // If local storage has it, we still check firestore to keep things in sync if needed,
    // but returning local is faster. However, let's stick to the current logic of checking firestore first.
  }

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && !forceGenerate) {
      return docSnap.data().questions;
    }
  } catch (error) {
    console.error("Firestore read failed", error);
  }

  if (!forceGenerate) {
    return []; 
  }

  // Determine which API key to use
  const customKey = StorageService.getCustomApiKey();
  const envKey = process.env.GEMINI_API_KEY;
  const activeKey = customKey || envKey;

  if (!activeKey) {
    throw new Error("Gemini API Key is missing. Please add your own key in settings! ❤️");
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });
  
  const prompt = `
    Generate EXACTLY 25 romantic and beginner-friendly Hindi learning MCQ questions for a wife from her husband.
    
    Structure (MANDATORY 25 QUESTIONS):
    - 5 Questions: Bengali to Hindi translation (Bengali -> Hindi)
    - 5 Questions: English to Hindi translation (English -> Hindi)
    - 5 Questions: Hindi Vocabulary (Contextual)
    - 5 Questions: Beginner Grammar (Gender/Verbs)
    - 5 Questions: Daily Romantic Conversations
    
    CRITICAL SCRIPT REQUIREMENT: 
    - ALL Hindi MUST be in DEVANAGARI (हिन्दी). NO ROMANIZED HINDI.
    - Bengali must be in Bengali script.
    
    JSON Structure (Return ONLY a raw JSON array, MUST be exactly 25 items):
    [
      {
        "id": "q1",
        "question": "Question text...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "Answer text exactly as in options",
        "explanation": "Cute note. ❤️",
        "category": "BengaliToHindi"
      }
      ... continue to q25
    ]
    
    Keep explanations short to save space. Tone: Deeply romantic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 8192,
      }
    });
    
    const text = response.text || "";
    console.log("Gemini Response received, length:", text.length);
    
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      if (text.length > 5000 && !text.trim().endsWith(']')) {
        throw new Error("The response was too large and got cut off. Please try again! ❤️");
      }
      throw new Error("Could not find a valid list of questions in the AI response. Please try again! ❤️");
    }
    
    let questions: Question[] = [];
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      throw new Error("The AI provided an invalid format. Please try again! ❤️");
    }
    
    if (questions.length === 0) {
      throw new Error("The AI returned zero questions. Please try again! 🥺");
    }
    
    console.log(`Successfully parsed ${questions.length} questions.`);

    // Save to Firestore for other users
    try {
      const activeUser = StorageService.getCustomApiKey() ? "Custom Key User" : "Admin";
      await setDoc(docRef, {
        date: today,
        questions: questions,
        createdAt: serverTimestamp(),
        generatedBy: activeUser
      });
      console.log("Successfully pushed lessons to Firestore! ❤️");
    } catch (firestoreError) {
      console.error("Firestore save failed but returning questions anyway:", firestoreError);
    }

    return questions;
  } catch (error: any) {
    console.error("Error in generateDailyQuestions:", error);
    if (error.message?.includes('API_KEY_INVALID')) {
       throw new Error("Your Gemini API Key is invalid. Please check it in settings! 🔑");
    }
    throw error;
  }
}

export async function manualSaveQuestions(questions: Question[]): Promise<void> {
  const today = getTodayDateString();
  const docRef = doc(db, 'dailyTasks', today);

  try {
    await setDoc(docRef, {
      date: today,
      questions: questions,
      createdAt: serverTimestamp(),
      generatedBy: 'Manual Import'
    });
    console.log("Manual import successful! ❤️");
  } catch (error: any) {
    console.error("Manual save failed:", error);
    throw new Error("Failed to save to database. Check your connection! 🥺");
  }
}

