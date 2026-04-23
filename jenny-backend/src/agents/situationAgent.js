// =============================================
// AGENT 2: SITUATION ANALYSIS AGENT
// =============================================
// Extracts structured facts from the conversation:
// location, destination, money, battery, risk level etc.

const { invokeGeminiJSON } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `You are Jenny's Situation Analysis Agent. Your job is to extract structured facts from the user's conversation.

Extract whatever is mentioned. If something is not mentioned, use null.

Respond ONLY in this exact JSON format:
{
  "location": "extracted location or null",
  "destination": "where they want to go or null",
  "urgency": "immediate|hours|flexible|null",
  "moneyAvailable": "amount as string or null",
  "batteryPercent": "number or null",
  "riskLevel": "safe|moderate|high|critical",
  "timeConstraint": "any deadline mentioned or null",
  "companions": "alone|with family|with friends|null",
  "situationSummary": "1 sentence plain English summary of their situation"
}`;

/**
 * Run Situation Analysis Agent.
 * @param {Array} messages - Full conversation history
 * @param {object} existingContext - Previously extracted context
 * @returns {Promise<object>} extracted situation data
 */
async function situationAgent(messages, existingContext = {}) {
  // Build a message that includes previous context so agent can fill gaps
  const contextNote = Object.keys(existingContext).some(k => existingContext[k])
    ? `Previously known context: ${JSON.stringify(existingContext)}. Update only what has changed or newly mentioned.`
    : "";

  const augmentedMessages = [
    ...messages,
    ...(contextNote
      ? [{ role: "user", content: contextNote }]
      : []),
  ];

  try {
    const result = await invokeGeminiJSON(SYSTEM_PROMPT, augmentedMessages);
    if (!result) return existingContext;

    // Merge with existing context — don't overwrite with null
    const merged = { ...existingContext };
    for (const [key, value] of Object.entries(result)) {
      if (value !== null && value !== undefined) {
        merged[key] = value;
      }
    }
    return merged;
  } catch (error) {
    console.error("[SituationAgent] Error:", error.message);
    return existingContext;
  }
}

module.exports = { situationAgent };
