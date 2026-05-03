import { GoogleGenAI } from "@google/genai";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Question } from "../types";
import { StorageService } from "./storageService";

export async function generateDailyQuestions(forceGenerate = false): Promise<Question[]> {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'dailyTasks', today);

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
    throw new Error("Gemini API Key is missing. Please add your own key in Admin Settings! ❤️");
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });
  
  const prompt = `
    Generate EXACTLY 100 romantic and beginner-friendly Hindi learning MCQ questions for a wife from her husband.
    
    Structure (MANDATORY 100 QUESTIONS):
    - 20 Questions: Bengali to Hindi translation (Bengali -> Hindi)
    - 20 Questions: English to Hindi translation (English -> Hindi)
    - 20 Questions: Hindi Vocabulary (Contextual)
    - 20 Questions: Beginner Grammar (Gender/Verbs)
    - 20 Questions: Daily Romantic Conversations
    
    CRITICAL SCRIPT REQUIREMENT: 
    - ALL Hindi MUST be in DEVANAGARI (हिन्दी). NO ROMANIZED HINDI.
    - Bengali must be in Bengali script.
    
    JSON Structure (Return ONLY a raw JSON array, MUST be exactly 100 items):
    [
      {
        "id": "q1",
        "question": "Question text...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "Answer text exactly as in options",
        "explanation": "Cute/Romantic note. ❤️",
        "category": "BengaliToHindi"
      }
      ... continue to q100
    ]
    
    Tone: Deeply romantic, encouraging, and sweet. Make her feel like a Queen.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash", 
      contents: prompt,
      config: {
        temperature: 0.85,
        maxOutputTokens: 8192, // Increased safety for large output
      }
    });
    
    const text = result.text || "";
    console.log("Gemini Response received, length:", text.length);
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not find valid JSON in Gemini response. Please try again!");
    }
    const questions = JSON.parse(jsonMatch[0]);
    
    console.log(`Successfully parsed ${questions.length} questions.`);

    // Save to Firestore for other users
    try {
      await setDoc(docRef, {
        date: today,
        questions: questions,
        createdAt: serverTimestamp(),
        generatedBy: 'sourav.9911rout@gmail.com'
      });
      console.log("Successfully pushed 100 questions to Firestore! ❤️");
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

