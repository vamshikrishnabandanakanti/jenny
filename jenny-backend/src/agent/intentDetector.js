// =============================================
// INTENT DETECTOR — User Intent Classification
// =============================================

const { invokeGeminiJSON } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `
You are an expert emergency and support intent classifier.
Analyze the user's message and determine the core intent.

Possible intents:
- "car_lockout": Keys locked in car, locked out of vehicle.
- "medical_emergency": Injury, health issue, need ambulance or doctor.
- "safety_threat": Feeling unsafe, followed, domestic violence, robbery.
- "transport_issue": Missed train, stranded, no money for transport, car breakdown.
- "general_help": Other requests for assistance.

Return ONLY a JSON object in this format:
{
  "intent": "string"
}
`;

/**
 * Detect the core intent from the user message.
 * @param {string} userMessage - The raw user input
 * @returns {string} The detected intent string
 */
async function detectIntent(userMessage) {
  try {
    const result = await invokeGeminiJSON(SYSTEM_PROMPT, [{ role: "user", content: userMessage }]);
    if (result && result.intent) {
      return result.intent;
    }
  } catch (error) {
    console.error("[IntentDetector] Error detecting intent:", error);
  }
  return "general_help"; // Default fallback
}

module.exports = { detectIntent };
