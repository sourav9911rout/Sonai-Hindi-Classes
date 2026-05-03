import { GoogleGenAI } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateDailyQuestions(): Promise<Question[]> {
  const prompt = `
    Generate 100 romantic and beginner-friendly Hindi learning questions for a wife from her husband.
    The questions should be split into 6 categories:
    1. Bengali to Hindi translation (Show Bengali word/sentence, ask for Hindi)
    2. English to Hindi translation (Show English word/sentence, ask for Hindi)
    3. Hindi vocabulary (Identify meanings or synonyms)
    4. Beginner Hindi grammar (Gender, plural, basic verbs)
    5. Simple Hindi sentence translation
    6. Daily conversational Hindi

    IMPORTANT: Most questions and ALL Hindi options MUST be written in Devanagari script (Hindi script).
    Example: Question: "What is 'I love you' in Hindi?", Options: ["मैं आपसे प्यार करता हूँ", "नमस्ते", "तुम कैसे हो", "अलविदा"]

    Each question must be an MCQ with 4 options.
    Format the output as a valid JSON array of objects with this structure:
    {
      "id": "unique_id_string",
      "question": "The question text (Can be English/Bengali asking for Hindi, or Hindi asking for meaning)",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact string from the options array that is correct",
      "explanation": "A short, cute, and romantic explanation in Bengali or English",
      "category": "One of: BengaliToHindi, EnglishToHindi, Vocabulary, Grammar, Sentence, Converstation"
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

