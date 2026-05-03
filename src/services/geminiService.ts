import { GoogleGenAI } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateDailyQuestions(): Promise<Question[]> {
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
    - Use "आँखें", "प्यार", "तुम" etc.
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
      "explanation": "A short, cute, and romantic explanation in Bengali or English",
      "category": "One of: BengaliToHindi, EnglishToHindi, Vocabulary, Grammar, Sentence, Conversation"
    }

    The tone should be cute, romantic, and encouraging. Return ONLY the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const text = response.text || "";
    
    // Extract JSON from markdown if necessary
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

