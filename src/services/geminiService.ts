
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { DoubtResult, Subject } from "../types";

// Use a function to get the AI instance to ensure it picks up the key correctly
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please add it to your environment variables.");
  }
  
  return new GoogleGenAI({ apiKey });
};

export const solveDoubt = async (
  question: string, 
  subject: Subject,
  base64Image?: string
): Promise<DoubtResult> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  
  const prompt = `You are an expert tutor at "Institute DeltaSquare". 
  Solve the following 12th Grade Science NCERT doubt for the subject: ${subject}.
  
  Question: ${question}
  
  Requirements:
  1. Provide a clear conceptual explanation.
  2. Give a step-by-step breakdown.
  3. Include practical tips for understanding this topic.
  4. Provide memory tricks or mnemonics if applicable.
  5. Include 2 related examples with solutions.
  6. Suggest a detailed visual diagram prompt that describes what a scientific diagram for this concept should look like.
  
  Strictly follow the JSON schema provided.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: base64Image 
      ? { parts: [{ text: prompt }, { inlineData: { data: base64Image, mimeType: 'image/png' } }] }
      : prompt,
    config: {
      temperature: 0.4, // Lower temperature for faster, more focused responses
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          stepByStep: { type: Type.ARRAY, items: { type: Type.STRING } },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          tricks: { type: Type.ARRAY, items: { type: Type.STRING } },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                problem: { type: Type.STRING },
                solution: { type: Type.STRING }
              },
              required: ["problem", "solution"]
            }
          },
          diagramPrompt: { type: Type.STRING, description: "Detailed description for generating a scientific diagram" }
        },
        required: ["explanation", "stepByStep", "tips", "tricks", "examples", "diagramPrompt"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as DoubtResult;
};

export const generateDiagram = async (diagramDescription: string): Promise<string | null> => {
  try {
    const ai = getAI();
    // gemini-2.5-flash-image is the fastest stable model for quick illustrations
    const model = 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: `Minimalist diagram: ${diagramDescription}. Simple, white background.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate diagram:", error);
    return null;
  }
};
