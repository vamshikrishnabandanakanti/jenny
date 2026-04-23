// =============================================
// AGENT 3: PLANNING AGENT
// =============================================
// Generates a clear, actionable step-by-step plan
// based on the user's situation and context.

const { invokeGemini } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `You are Jenny's Planning Agent. The user is in distress or an emergency. 
Your job is to generate a clear, step-by-step recovery plan.

Rules:
- Steps must be ACTIONABLE. No vague advice.
- Keep each step SHORT (1-2 sentences).
- Maximum 6 steps.
- Prioritize immediate safety first.
- Be specific to their location and situation.
- Use simple language — they may be panicking.
- Include real options (train, bus, cab, metro, walk).

Format your response as a numbered list like:
1. [Immediate action]
2. [Next step]
...

End with one encouraging sentence.`;

/**
 * Run Planning Agent.
 * @param {Array}  messages - Full conversation history
 * @param {object} context  - Extracted situation context
 * @returns {Promise<string[]>} array of step strings
 */
async function planningAgent(messages, context = {}) {
  const contextSummary = context.situationSummary
    ? `Situation: ${context.situationSummary}. Location: ${context.location || "unknown"}. Destination: ${context.destination || "unknown"}. Money: ${context.moneyAvailable || "unknown"}. Urgency: ${context.urgency || "unknown"}.`
    : "";

  const planMessages = [
    ...messages,
    ...(contextSummary
      ? [{ role: "user", content: `Context for planning: ${contextSummary}` }]
      : []),
  ];

  try {
    const raw = await invokeGemini(SYSTEM_PROMPT, planMessages, 800);

    // Parse numbered list into array
    const steps = raw
      .split("\n")
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    // If parsing fails, return raw split by newline
    if (steps.length === 0) {
      return raw.split("\n").filter(l => l.trim().length > 0);
    }

    return steps;
  } catch (error) {
    console.error("[PlanningAgent] Error:", error.message);
    return [
      "Stay where you are and stay calm.",
      "Contact someone you trust immediately.",
      "Look for the nearest safe public place.",
      "If urgent, call emergency services (112).",
    ];
  }
}

module.exports = { planningAgent };
