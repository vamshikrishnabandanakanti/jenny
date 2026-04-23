// =============================================
// AGENT 1: EMOTION AGENT
// =============================================
// Detects emotional state, generates calming message,
// and classifies urgency level.

const { invokeGemini, invokeGeminiJSON } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `You are Jenny's Emotion Agent. Your ONLY job is to:
1. Detect if the user is in panic, stress, fear, or an emergency state.
2. Generate a SHORT, warm, human calming message (2-3 sentences max).
3. Classify urgency level.

Rules:
- Never be robotic. Speak like a caring friend.
- Keep calm message under 40 words.
- Always validate their feelings first.

Respond ONLY in this exact JSON format (no extra text):
{
  "urgencyLevel": "low|medium|high|critical",
  "emotionalState": "calm|stressed|panicked|fearful|confused",
  "calmMessage": "short warm human message here",
  "detectedCategories": ["travel", "safety", "financial", "medical", "general"]
}`;

/**
 * Run Emotion Agent.
 * @param {Array} messages - Full conversation history
 * @returns {Promise<object>} emotion analysis
 */
async function emotionAgent(messages) {
  try {
    const result = await invokeGeminiJSON(SYSTEM_PROMPT, messages);
    if (!result) {
      return {
        urgencyLevel: "medium",
        emotionalState: "stressed",
        calmMessage: "Take a deep breath. I'm here with you. Let's figure this out together, one step at a time. 💙",
        detectedCategories: ["general"],
      };
    }
    return result;
  } catch (error) {
    console.error("[EmotionAgent] Error:", error.message);
    return {
      urgencyLevel: "medium",
      emotionalState: "stressed",
      calmMessage: "I'm here for you. Take one deep breath. We'll work through this together.",
      detectedCategories: ["general"],
    };
  }
}

module.exports = { emotionAgent };
