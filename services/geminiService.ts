
import { GoogleGenAI, Type } from "@google/genai";
import { CelebrationInsight } from "../types";

export const getCelebrationInsight = async (country: string, language: string = 'English'): Promise<CelebrationInsight | null> => {
  try {
    // Instantiate ai inside the function to ensure up-to-date API key access right before the call
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide information about how ${country} celebrates New Year (the transition to 2026). Include a common greeting in their language, one unique tradition, and a fun fact. Respond in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            country: { type: Type.STRING },
            tradition: { type: Type.STRING },
            greeting: { type: Type.STRING },
            funFact: { type: Type.STRING },
          },
          required: ["country", "tradition", "greeting", "funFact"]
        },
      },
    });

    // Access .text property directly as per Gemini API guidelines
    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    console.error("Error fetching insight from Gemini:", error);
    return null;
  }
};
