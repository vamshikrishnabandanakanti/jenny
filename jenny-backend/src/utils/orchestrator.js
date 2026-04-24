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
 * Detect if this is a simple greeting / casual message
 * that doesn't need 6 parallel AI agents.
 */
function isSimpleGreeting(message) {
  const greetings = [
    /^(hi|hey|hello|hii+|helo|hola|namaste|yo)[\s!.?]*$/i,
    /^(good\s?(morning|evening|afternoon|night))[\s!.?]*$/i,
    /^(thanks?|thank\s?you|ok|okay|bye|goodbye|gn|gm)[\s!.?]*$/i,
    /^(how are you|what's up|sup|wassup)[\s!?.]*$/i,
    /^(start|help|menu)[\s!?.]*$/i,
  ];
  return greetings.some(p => p.test(message.trim()));
}

/**
 * Return an instant greeting response without calling any AI agents.
 */
function instantGreetingResponse(sessionId, userMessage) {
  addMessage(sessionId, "user", userMessage);

  const greetingReply = "Hey there! 👋 I'm Jenny, your emergency support companion.\n\n" +
    "I'm here to help you navigate any crisis — from missed transport to medical emergencies.\n\n" +
    "**Tell me what's happening**, and I'll create a recovery plan for you instantly. 💙";

  addMessage(sessionId, "assistant", greetingReply);

  return {
    sessionId,
    detectedCategories: ["general"],
    agentsActivated: ["Greeting"],
    recoveryPlan: greetingReply,
    urgencyLevel: "low",
    estimatedResolutionTime: "Instant",
    agentResults: [
      {
        agent: "Jenny",
        priority: "low",
        steps: [greetingReply],
        status: "success",
      },
    ],
    extended: {
      situationContext: {},
      followUpSupported: true,
    },
  };
}

/**
 * Main entry point — routes to instant greeting, follow-up, or full orchestration.
 */
async function orchestrate(sessionId, userMessage) {
  const history = getHistory(sessionId);

  console.log(`[Orchestrator] Session: ${sessionId} | Message: "${userMessage.slice(0, 60)}..."`);

  // FAST PATH: Handle satisfaction responses instantly
  const satisfiedPattern = /^(satisfied|yes.*(satisfied|happy|good|done|thanks)|i'?m\s+(good|fine|okay|ok|done|satisfied))[\s!.]*$/i;
  const notSatisfiedPattern = /^(not\s*satisfied|no|need\s*more\s*help|not\s*(good|done|okay))[\s!.]*$/i;

  if (satisfiedPattern.test(userMessage.trim())) {
    console.log(`[Orchestrator] ⚡ Satisfied — ending session`);
    addMessage(sessionId, "user", userMessage);
    const endMsg = "I'm glad I could help! 💙 Remember, you're stronger than you think. Stay safe, and don't hesitate to reach out anytime you need me. Take care! 🌟";
    addMessage(sessionId, "assistant", endMsg);
    return {
      sessionId,
      detectedCategories: ["session_end"],
      agentsActivated: ["Jenny"],
      recoveryPlan: endMsg,
      urgencyLevel: "low",
      estimatedResolutionTime: "Resolved",
      agentResults: [{ agent: "Jenny", priority: "low", steps: [endMsg], status: "success" }],
      extended: { sessionEnded: true, followUpSupported: false },
    };
  }

  if (notSatisfiedPattern.test(userMessage.trim())) {
    console.log(`[Orchestrator] ⚡ Not satisfied — continuing`);
    addMessage(sessionId, "user", userMessage);
    const continueMsg = "I understand — let's keep going. Tell me what else is troubling you or what specific help you need. I'm not going anywhere. 💪";
    addMessage(sessionId, "assistant", continueMsg);
    return {
      sessionId,
      detectedCategories: ["follow-up"],
      agentsActivated: ["Jenny"],
      recoveryPlan: continueMsg,
      urgencyLevel: "medium",
      estimatedResolutionTime: "Ongoing",
      agentResults: [{ agent: "Jenny", priority: "medium", steps: [continueMsg], status: "success" }],
      extended: { followUpSupported: true },
    };
  }

  // FAST PATH: Instant response for simple greetings
  if (isSimpleGreeting(userMessage) && history.length < 2) {
    console.log(`[Orchestrator] ⚡ Instant greeting — skipping agents`);
    return instantGreetingResponse(sessionId, userMessage);
  }

  const followUp = isFollowUp(userMessage, history);
  console.log(`[Orchestrator] Follow-up: ${followUp}`);

  const startTime = Date.now();

  let result;
  if (followUp) {
    result = await handleFollowUp(sessionId, userMessage);
  } else {
    result = await handleInitialMessage(sessionId, userMessage);
  }

  console.log(`[Orchestrator] ✅ Response ready in ${Date.now() - startTime}ms`);
  return result;
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
