// =============================================
// ORCHESTRATOR — Agent Coordinator
// =============================================
// Decides which agents to run and assembles the final response.
// For initial messages → runs all agents in parallel.
// For follow-up questions → runs only conversational + situation agents.

const { emotionAgent }        = require("../agents/emotionAgent");
const { situationAgent }      = require("../agents/situationAgent");
const { planningAgent }       = require("../agents/planningAgent");
const { costAgent }           = require("../agents/costAgent");
const { safetyAgent }         = require("../agents/safetyAgent");
const { communicationAgent }  = require("../agents/communicationAgent");
const { conversationalAgent } = require("../agents/conversationalAgent");
const { addMessage, updateContext, getHistory, getContext } = require("../memory/sessionStore");

/**
 * Detect if this is a follow-up question or a new situation description.
 * Follow-ups are SHORT questions that reference previous context.
 */
function isFollowUp(userMessage, history) {
  if (history.length < 2) return false; // First message is never a follow-up

  const followUpPatterns = [
    /is there (another|any|a)/i,
    /what (is|are) the/i,
    /can i/i,
    /how (much|long|do|can)/i,
    /which (is|one)/i,
    /what (about|if)/i,
    /is it safe/i,
    /cheapest/i,
    /fastest/i,
    /when (does|will|is)/i,
    /do you (know|think)/i,
    /any (other|alternative)/i,
    /tell me more/i,
    /what should i/i,
  ];

  const isShort = userMessage.trim().split(" ").length <= 12;
  const matchesPattern = followUpPatterns.some(p => p.test(userMessage));

  return isShort && matchesPattern;
}

/**
 * Full orchestration for initial panic message.
 * Runs all agents in parallel for speed.
 */
async function handleInitialMessage(sessionId, userMessage) {
  addMessage(sessionId, "user", userMessage);
  const history = getHistory(sessionId);
  const existingContext = getContext(sessionId);

  // Run all agents in parallel
  const [emotion, situation, plan, cost, safety, communication] = await Promise.all([
    emotionAgent(history),
    situationAgent(history, existingContext),
    planningAgent(history, existingContext),
    costAgent(history, existingContext),
    safetyAgent(history, existingContext),
    communicationAgent(history, existingContext),
  ]);

  // Update session context with newly extracted data
  updateContext(sessionId, situation);

  // Build the recovery plan text
  const recoveryPlan = buildRecoveryPlan(emotion, situation, plan);

  // Save assistant response to history
  addMessage(sessionId, "assistant", recoveryPlan);

  // Assemble frontend-compatible response
  return {
    sessionId,
    detectedCategories: emotion.detectedCategories || ["general"],
    agentsActivated: ["Emotion", "Situation", "Planning", "Cost", "Safety", "Communication"],
    recoveryPlan,
    urgencyLevel: emotion.urgencyLevel || "medium",
    estimatedResolutionTime: estimateResolutionTime(situation),
    agentResults: [
      {
        agent: "Emotion Analysis",
        priority: emotion.urgencyLevel || "medium",
        steps: [emotion.calmMessage],
        status: "success",
      },
      {
        agent: "Action Plan",
        priority: emotion.urgencyLevel || "medium",
        steps: plan,
        status: "success",
      },
      {
        agent: "Travel & Cost",
        priority: "medium",
        steps: (cost.travelOptions || []).map(o => `${o.mode}: ${o.cost} (${o.duration})`),
        status: "success",
      },
      {
        agent: "Safety",
        priority: "high",
        steps: (safety.safePlaces || []).map(p => `${p.icon} ${p.name}: ${p.tip}`),
        status: "success",
      },
    ],
    // Extra data for future frontend enhancements
    extended: {
      situationContext: situation,
      travelOptions: cost.travelOptions || [],
      safePlaces: safety.safePlaces || [],
      emergencyNumbers: safety.emergencyNumbers || [],
      immediateAction: safety.immediateAction || "",
      communicationMessages: communication.messages || [],
      quickActions: communication.quickActions || [],
      followUpSupported: true,
    },
  };
}

/**
 * Lightweight orchestration for follow-up questions.
 * Only runs conversational + situation update agents.
 */
async function handleFollowUp(sessionId, userMessage) {
  addMessage(sessionId, "user", userMessage);
  const history = getHistory(sessionId);
  const existingContext = getContext(sessionId);

  // Run conversational agent + update situation context in parallel
  const [response, updatedSituation] = await Promise.all([
    conversationalAgent(history, existingContext),
    situationAgent(history, existingContext),
  ]);

  updateContext(sessionId, updatedSituation);
  addMessage(sessionId, "assistant", response);

  return {
    sessionId,
    detectedCategories: ["follow-up"],
    agentsActivated: ["Conversational Memory"],
    recoveryPlan: response,
    urgencyLevel: existingContext.riskLevel || "medium",
    estimatedResolutionTime: "Ongoing assistance",
    agentResults: [
      {
        agent: "Conversational Memory",
        priority: "medium",
        steps: [response],
        status: "success",
      },
    ],
    extended: {
      situationContext: updatedSituation,
      followUpSupported: true,
    },
  };
}

/**
 * Main entry point — routes to initial or follow-up handler.
 */
async function orchestrate(sessionId, userMessage) {
  const history = getHistory(sessionId);
  const followUp = isFollowUp(userMessage, history);

  console.log(`[Orchestrator] Session: ${sessionId} | Follow-up: ${followUp} | Message: "${userMessage.slice(0, 60)}..."`);

  if (followUp) {
    return await handleFollowUp(sessionId, userMessage);
  } else {
    return await handleInitialMessage(sessionId, userMessage);
  }
}

// ---- Helpers ----

function buildRecoveryPlan(emotion, situation, steps) {
  const calm = emotion.calmMessage || "Take a deep breath. I'm here.";
  const summary = situation.situationSummary ? `\n\n📍 ${situation.situationSummary}` : "";
  const plan = steps.length > 0
    ? "\n\n**Here's your plan:**\n" + steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "";
  return `${calm}${summary}${plan}`;
}

function estimateResolutionTime(situation) {
  if (!situation.urgency) return "Depends on your situation";
  const map = {
    immediate: "Next 15–30 minutes",
    hours: "Within 2–4 hours",
    flexible: "When you're ready",
  };
  return map[situation.urgency] || "Depends on your situation";
}

module.exports = { orchestrate };
