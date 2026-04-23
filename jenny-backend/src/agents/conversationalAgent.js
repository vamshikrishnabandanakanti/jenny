// =============================================
// AGENT 7: CONVERSATIONAL MEMORY AGENT
// =============================================
// Handles follow-up questions using full session context.
// This is the "brain" that makes Jenny feel like a continuous assistant.

const { invokeGemini } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `You are Jenny — an AI emergency assistant. You help people in panic or distress situations.

Your personality:
- Calm, warm, and reassuring.
- Direct and action-oriented. No fluff.
- You remember everything from the conversation.
- You adapt your answers based on the user's constraints (money, location, time, battery).

Rules:
- Always acknowledge their follow-up before answering.
- Reference what you already know about their situation.
- Give specific, actionable answers — not generic advice.
- If they ask about trains, give real alternatives.
- If they ask about cost, reference their budget.
- If they ask "is it safe", assess based on their risk level.
- Keep responses under 150 words unless a detailed plan is needed.
- End with one small next action they can take immediately.`;

/**
 * Run Conversational Agent for follow-up questions.
 * @param {Array}  messages - Full conversation history (provides context automatically)
 * @param {object} context  - Extracted situation context
 * @returns {Promise<string>} natural language response
 */
async function conversationalAgent(messages, context = {}) {
  // Inject context as a system-level note at the start
  const contextNote = buildContextNote(context);

  const fullMessages = contextNote
    ? [{ role: "user", content: contextNote }, { role: "assistant", content: "Understood. I have your context. How can I help?" }, ...messages]
    : messages;

  try {
    const response = await invokeGemini(SYSTEM_PROMPT, fullMessages, 600);
    return response.trim();
  } catch (error) {
    console.error("[ConversationalAgent] Error:", error.message);
    return "I'm still with you. Could you tell me a bit more about what you need right now?";
  }
}

function buildContextNote(context) {
  const parts = [];
  if (context.location) parts.push(`Location: ${context.location}`);
  if (context.destination) parts.push(`Destination: ${context.destination}`);
  if (context.moneyAvailable) parts.push(`Budget: ${context.moneyAvailable}`);
  if (context.urgency) parts.push(`Urgency: ${context.urgency}`);
  if (context.batteryPercent) parts.push(`Phone battery: ${context.batteryPercent}%`);
  if (context.situationSummary) parts.push(`Situation: ${context.situationSummary}`);

  if (parts.length === 0) return null;
  return `[CONTEXT FROM EARLIER IN CONVERSATION] ${parts.join(". ")}. Use this to answer follow-up questions accurately.`;
}

module.exports = { conversationalAgent };
