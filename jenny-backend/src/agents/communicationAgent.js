// =============================================
// AGENT 6: COMMUNICATION AGENT
// =============================================
// Generates ready-to-send messages for family and friends.

const { invokeGeminiJSON } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `You are Jenny's Communication Agent. The user is in distress and needs to quickly notify their family or friends.

Generate SHORT, clear, ready-to-send messages they can copy-paste.

Rules:
- Keep messages under 60 words each.
- Include location if known.
- Sound urgent but calm.
- Generate 3 message variants: family, close friend, and a generic SOS.

Respond ONLY in this JSON format:
{
  "messages": [
    {
      "type": "family",
      "label": "Message to Family",
      "icon": "👨‍👩‍👧",
      "subject": "I need help — please call me",
      "body": "Hi [Name], I'm at [LOCATION] and I need help. Please call me right away. I'm safe for now but need assistance. — [USER NAME]"
    },
    {
      "type": "friend",
      "label": "Message to Friend",
      "icon": "👥",
      "subject": "Can you help me?",
      "body": "Hey, I'm stuck at [LOCATION] and need some help. Can you call me or come? It's a bit urgent. Thanks."
    },
    {
      "type": "sos",
      "label": "Quick SOS",
      "icon": "🆘",
      "subject": "SOS — I need help",
      "body": "URGENT: I am at [LOCATION] and need immediate assistance. Please call me or send help. This is [USER NAME]."
    }
  ],
  "quickActions": [
    { "label": "Call Emergency (112)", "action": "tel:112", "icon": "📞" },
    { "label": "Share Live Location", "action": "share-location", "icon": "📍" },
    { "label": "Call Railway Helpline", "action": "tel:139", "icon": "🚉" }
  ]
}`;

/**
 * Run Communication Agent.
 * @param {Array}  messages - Conversation history
 * @param {object} context  - Extracted situation context
 * @returns {Promise<object>} pre-filled messages and quick actions
 */
async function communicationAgent(messages, context = {}) {
  const contextMsg = `User location: ${context.location || "[LOCATION UNKNOWN]"}. Situation: ${context.situationSummary || "emergency situation"}.`;

  const commMessages = [
    ...messages,
    { role: "user", content: contextMsg },
  ];

  try {
    const result = await invokeGeminiJSON(SYSTEM_PROMPT, commMessages);
    if (!result) return getDefaultMessages();
    return result;
  } catch (error) {
    console.error("[CommunicationAgent] Error:", error.message);
    return getDefaultMessages();
  }
}

function getDefaultMessages() {
  return {
    messages: [
      {
        type: "family",
        label: "Message to Family",
        icon: "👨‍👩‍👧",
        subject: "I need help — please call me",
        body: "Hi, I'm at [LOCATION] and need your help. Please call me right away. I'm okay but need assistance.",
      },
      {
        type: "friend",
        label: "Message to Friend",
        icon: "👥",
        subject: "Can you help me?",
        body: "Hey, I'm stuck and need some help. Can you call me? It's a bit urgent. Thanks.",
      },
      {
        type: "sos",
        label: "Quick SOS",
        icon: "🆘",
        subject: "SOS — I need help",
        body: "URGENT: I need immediate assistance. Please call me or send help.",
      },
    ],
    quickActions: [
      { label: "Call Emergency (112)", action: "tel:112", icon: "📞" },
      { label: "Share Live Location", action: "share-location", icon: "📍" },
      { label: "Call Railway Helpline", action: "tel:139", icon: "🚉" },
    ],
  };
}

module.exports = { communicationAgent };
