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
    if (docSnap.exists()) {
      return docSnap.data().questions;
    }
  } catch (error) {
    console.error("Firestore read failed", error);
  }

  // If we reach here, questions don't exist in Firestore
  if (!forceGenerate) {
    return []; // Return empty if not authorized to generate
  }

  const prompt = `
    Generate 100 romantic and beginner-friendly Hindi learning questions for a wife from her husband.
    The questions should be split into 6 categories:
    1. Bengali to Hindi translation (Bengali question -> Hindi options in Devanagari)
    2. English to Hindi translation (English question -> Hindi options in Devanagari)
    3. Hindi vocabulary (Word in Devanagari -> meaning)
    4. Beginner Hindi grammar (Gender, plural, basic verbs in Devanagari)
    5. Simple Hindi sentence translation
    6. Daily conversational Hindi

    CRITICAL SCRIPT REQUIREMENT (STRICTEST): 
    - ALL Hindi words, phrases, and sentences MUST be written in DEVANAGARI SCRIPT (हिन्दी लिपि). 
    - DO NOT EVER use English letters to write Hindi (no "Aanken", no "Pyaar", no "Tum"). 
    - Use "आँखें", "प्याর", "तुम" etc.
    - If a Hindi word is used in a question, an option, or the explanation, it MUST be in Devanagari script.
    - Bengali words must be in Bengali script.
    - Only use English for English-to-Hindi tasks or general instructions in the explanation.
    - Ensure PERFECT grammar and spelling in all languages (English, Bengali, and Hindi).
    - Absolutely NO grammatical errors in the "explanation" field.

    Each question must be an MCQ with 4 options.
    Format the output as a valid JSON array of objects with this structure:
    {
      "id": "unique_id_string",
      "question": "The question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact string from the options array that is correct",
      "explanation": "A short, cute, and romantic explanation using a mix of Bengali, Hindi (in Devanagari), and English. DO NOT use only English. For example: 'Beautiful choice জান! এর মানে হলো 'I love you' ❤️'",
      "category": "One of: BengaliToHindi, EnglishToHindi, Vocabulary, Grammar, Sentence, Conversation"
    }

    The tone should be cute, romantic, and encouraging. Return ONLY the JSON array.
    Important: Generate exactly 100 questions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    
    const text = response.text || "";
    
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

