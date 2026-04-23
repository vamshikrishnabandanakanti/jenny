// =============================================
// AGENT 4: COST ESTIMATION AGENT
// =============================================
// Provides approximate cost breakdown for all travel options.

const { invokeGeminiJSON } = require("../utils/geminiClient");

const SYSTEM_PROMPT = `You are Jenny's Cost Estimation Agent for India. 
Given the user's location and destination, estimate travel costs in Indian Rupees (₹).

Provide realistic estimates based on Indian city pricing (2024).
If location/destination are unknown, give general range estimates.

Respond ONLY in this JSON format:
{
  "travelOptions": [
    {
      "mode": "Walking",
      "cost": "Free",
      "duration": "estimated time",
      "feasible": true/false,
      "note": "short tip"
    },
    {
      "mode": "City Bus / TSRTC",
      "cost": "₹10–₹30",
      "duration": "estimated time",
      "feasible": true/false,
      "note": "short tip"
    },
    {
      "mode": "Metro",
      "cost": "₹20–₹60",
      "duration": "estimated time",
      "feasible": true/false,
      "note": "short tip"
    },
    {
      "mode": "Bike Taxi (Rapido)",
      "cost": "₹30–₹80",
      "duration": "estimated time",
      "feasible": true/false,
      "note": "short tip"
    },
    {
      "mode": "Auto Rickshaw",
      "cost": "₹50–₹120",
      "duration": "estimated time",
      "feasible": true/false,
      "note": "short tip"
    },
    {
      "mode": "Cab (Ola/Uber)",
      "cost": "₹100–₹300",
      "duration": "estimated time",
      "feasible": true/false,
      "note": "short tip"
    }
  ],
  "recommendation": "best option given their constraints",
  "totalBudgetNeeded": "minimum amount needed"
}`;

/**
 * Run Cost Estimation Agent.
 * @param {Array}  messages - Conversation history
 * @param {object} context  - Extracted situation context
 * @returns {Promise<object>} travel options with costs
 */
async function costAgent(messages, context = {}) {
  const contextMsg = `Location: ${context.location || "Hyderabad, India"}. Destination: ${context.destination || "unknown"}. Budget available: ${context.moneyAvailable || "unknown"}.`;

  const costMessages = [
    ...messages,
    { role: "user", content: contextMsg },
  ];

  try {
    const result = await invokeGeminiJSON(SYSTEM_PROMPT, costMessages);
    if (!result) return getDefaultTravelOptions();
    return result;
  } catch (error) {
    console.error("[CostAgent] Error:", error.message);
    return getDefaultTravelOptions();
  }
}

function getDefaultTravelOptions() {
  return {
    travelOptions: [
      { mode: "Walking", cost: "Free", duration: "Varies", feasible: true, note: "Only if destination is nearby" },
      { mode: "City Bus / TSRTC", cost: "₹10–₹30", duration: "30–60 min", feasible: true, note: "Cheapest option" },
      { mode: "Metro", cost: "₹20–₹60", duration: "15–30 min", feasible: true, note: "Fastest if route available" },
      { mode: "Bike Taxi (Rapido)", cost: "₹30–₹80", duration: "15–25 min", feasible: true, note: "Quick and affordable" },
      { mode: "Auto Rickshaw", cost: "₹50–₹120", duration: "20–40 min", feasible: true, note: "Negotiate fare beforehand" },
      { mode: "Cab (Ola/Uber)", cost: "₹100–₹300", duration: "20–45 min", feasible: true, note: "Most comfortable option" },
    ],
    recommendation: "Take a city bus or Rapido bike taxi for the most affordable option.",
    totalBudgetNeeded: "₹30–₹100 minimum",
  };
}

module.exports = { costAgent };
