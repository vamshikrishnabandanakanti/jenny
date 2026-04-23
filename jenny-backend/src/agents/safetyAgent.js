// =============================================
// AGENT 5: SAFETY AGENT
// =============================================
// Suggests nearby safe locations based on user's situation.

const { invokeGeminiJSON } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `You are Jenny's Safety Agent. The user may be in an unsafe or uncomfortable situation.
Your job is to suggest nearby safe places they can go to RIGHT NOW.

Rules:
- Prioritize publicly accessible, well-lit, staffed locations.
- Always include emergency numbers for India.
- Be specific to their location if mentioned.
- Suggest 4–5 safe place types.

Respond ONLY in this JSON format:
{
  "safePlaces": [
    {
      "name": "Police Station",
      "description": "Nearest police station. Officers available 24/7.",
      "icon": "🚔",
      "priority": "high",
      "tip": "Show this message to the officer: I need assistance."
    },
    {
      "name": "Railway Station",
      "description": "Well-lit, staffed, and has security personnel.",
      "icon": "🚉",
      "priority": "high",
      "tip": "Go to the Station Master's office if you need help."
    },
    {
      "name": "Hospital / Clinic",
      "description": "24/7 emergency services and security.",
      "icon": "🏥",
      "priority": "medium",
      "tip": "Emergency department is always open."
    },
    {
      "name": "Shopping Mall",
      "description": "Security guards, CCTV, and public spaces.",
      "icon": "🏬",
      "priority": "medium",
      "tip": "Ask mall security for help if needed."
    },
    {
      "name": "Petrol Bunk / Gas Station",
      "description": "Usually open late, has staff, and good lighting.",
      "icon": "⛽",
      "priority": "low",
      "tip": "Staff can help you call for assistance."
    }
  ],
  "emergencyNumbers": [
    { "label": "Police", "number": "100" },
    { "label": "Ambulance", "number": "108" },
    { "label": "Women Helpline", "number": "1091" },
    { "label": "National Emergency", "number": "112" },
    { "label": "Railway Helpline", "number": "139" }
  ],
  "immediateAction": "One sentence — the most important thing to do RIGHT NOW."
}`;

/**
 * Run Safety Agent.
 * @param {Array}  messages - Conversation history
 * @param {object} context  - Extracted situation context
 * @returns {Promise<object>} safe places and emergency numbers
 */
async function safetyAgent(messages, context = {}) {
  const contextMsg = `User location: ${context.location || "unknown"}. Risk level: ${context.riskLevel || "unknown"}. Situation: ${context.situationSummary || "emergency situation"}.`;

  const safetyMessages = [
    ...messages,
    { role: "user", content: contextMsg },
  ];

  try {
    const result = await invokeGeminiJSON(SYSTEM_PROMPT, safetyMessages);
    if (!result) return getDefaultSafetyData();
    return result;
  } catch (error) {
    console.error("[SafetyAgent] Error:", error.message);
    return getDefaultSafetyData();
  }
}

function getDefaultSafetyData() {
  return {
    safePlaces: [
      { name: "Police Station", description: "Available 24/7 with security.", icon: "🚔", priority: "high", tip: "Go to the front desk and ask for help." },
      { name: "Railway Station", description: "Well-lit with railway staff.", icon: "🚉", priority: "high", tip: "Visit the Station Master's office." },
      { name: "Hospital", description: "Emergency services always open.", icon: "🏥", priority: "high", tip: "Emergency dept is open 24/7." },
      { name: "Shopping Mall", description: "Security and public space.", icon: "🏬", priority: "medium", tip: "Ask security guard for help." },
      { name: "Petrol Bunk", description: "Staff and lighting available.", icon: "⛽", priority: "low", tip: "Ask staff to help you call someone." },
    ],
    emergencyNumbers: [
      { label: "Police", number: "100" },
      { label: "Ambulance", number: "108" },
      { label: "Women Helpline", number: "1091" },
      { label: "National Emergency", number: "112" },
      { label: "Railway Helpline", number: "139" },
    ],
    immediateAction: "Move to a well-lit public place immediately and call someone you trust.",
  };
}

module.exports = { safetyAgent };
