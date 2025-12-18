import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const getAITradeFeedback = async (trade: Trade): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "API Key 未設定，請在 Vercel 環境變數中設定 API_KEY。";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    請分析這筆加密貨幣交易並提供心理反饋。
    
    交易細節：
    - 交易對: ${trade.symbol}
    - 方向: ${trade.direction}
    - 槓桿: ${trade.leverage}
    - 結果: ${trade.pnlPercentage.toFixed(2)}%
    - 策略: ${trade.strategy}
    - 交易者心得: "${trade.review}"
    
    請提供一段簡短、專業且具有鼓勵性質的心理評估（最多 200 字）。
    重點放在：紀律、情緒管理以及是否符合策略。
    語言：繁體中文，語氣要像專業教練。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一位專業的交易心理教練，擅長風險管理與情緒控管。你的目標是幫助交易者保持冷靜與紀律。",
        temperature: 0.7,
      }
    });
    
    return response.text || "AI 反饋暫時無法生成。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成 AI 反饋時出錯，請檢查 API Key 或網路連線。";
  }
};