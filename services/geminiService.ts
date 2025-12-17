
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const getAITradeFeedback = async (trade: Trade): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this cryptocurrency trade and provide psychological feedback for the trader.
    
    Trade Details:
    - Symbol: ${trade.symbol}
    - Direction: ${trade.direction}
    - Leverage: ${trade.leverage}x
    - Result: ${trade.pnlPercentage.toFixed(2)}%
    - Strategy: ${trade.strategy}
    // Fixed: Removed non-existent 'session' property
    - Trader's Review Notes: "${trade.review}"
    
    Please provide a short, professional, and encouraging psychological review (max 100 words). 
    Focus on discipline, emotional management, and strategy adherence.
    Language: Keep it professional, preferably in the trader's tone if possible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional trading coach with expertise in trading psychology and risk management. Your goal is to help traders improve their mental game.",
        temperature: 0.7,
      }
    });
    
    // Correctly accessing .text property
    return response.text || "AI feedback currently unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI feedback. Please check your connection or try again later.";
  }
};
