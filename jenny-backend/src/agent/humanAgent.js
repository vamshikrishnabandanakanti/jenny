const { invokeGeminiJSON } = require("../utils/geminiClient");
const { findNearbyPlaces } = require("../services/mapplsService");

const SYSTEM_PROMPT = `You are a calm, highly intelligent, and extremely empathetic human emergency response agent.
Your job is to help users out of ANY panic or emergency situation. 
Be concise, practical, and highly conversational. NEVER sound robotic. Do not use boilerplate like "Here is your plan."

Evaluate the user's situation based on the conversation history.
If the user needs physical help right now (e.g., they need a hospital, police, transit, mechanic, or locksmith), set the "action" field to the appropriate search keyword.
If no physical help is needed yet, or you are just providing comfort/advice, set it to "none".

Output strictly in JSON format:
{
  "message": "Your calm, conversational, human-like response (max 2-3 short sentences)",
  "action": "locksmith" | "hospital" | "police" | "transit" | "mechanic" | "none",
  "whatsapp_draft": "A well-explained, concise draft message explaining the user's panic situation and request for help that they can instantly send to their family. You MUST include the tags [NEAREST_LANDMARK] and [LOCATION_LINK] if applicable. Make it sound very natural, with the link on its own line. Example: 'Hey, my car broke down and I don't feel safe. I am near [NEAREST_LANDMARK].\\n\\nHere is my exact location: [LOCATION_LINK]'",
  "ride_estimate": {
    "destination_name": "Name of the destination if the user requests a ride estimate",
    "drop_lat": "number (latitude)",
    "drop_lng": "number (longitude)",
    "distance_meters": "number (distance in meters)"
  } // Leave this field out or null if they don't explicitly ask for travel/ride estimates.
}`;

async function handlePanicSituation(userMessage, location, step, history = []) {
  try {
    // 1. Format history for the AI model
    const messages = history.map(h => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content
    }));
    messages.push({ role: "user", content: userMessage });

    // 2. Invoke the dynamic LLM decision
    const aiDecision = await invokeGeminiJSON(SYSTEM_PROMPT, messages);
    
    if (!aiDecision) {
        throw new Error("Failed to get a valid JSON decision from AI.");
    }

    // 3. Evaluate if an action is needed or if a WhatsApp draft was generated
    const needsAction = aiDecision.action && aiDecision.action !== "none";
    
    let ride_estimates = null;
    if (aiDecision.ride_estimate && aiDecision.ride_estimate.distance_meters) {
        const d = aiDecision.ride_estimate.distance_meters;
        const km = Math.max(1, d / 1000);
        ride_estimates = {
            destination_name: aiDecision.ride_estimate.destination_name,
            drop_lat: aiDecision.ride_estimate.drop_lat,
            drop_lng: aiDecision.ride_estimate.drop_lng,
            distance_meters: d,
            walk: { time_mins: Math.ceil(d / 80), cost: 0 },
            bike: { time_mins: Math.ceil(km * 3), cost: Math.ceil(km * 10) },
            cab: { time_mins: Math.ceil(km * 4), cost: Math.ceil(km * 25) },
            bus: { time_mins: Math.ceil(km * 6), cost: Math.ceil(km * 5) }
        };
    }

    if (needsAction || aiDecision.whatsapp_draft || ride_estimates) {
      
      // If we need an action or a draft but don't have location yet, ask for it gracefully
      if (!location) {
        return {
          type: "request_location",
          message: aiDecision.message + "\n\nCan you allow location access so I can find what's nearby and get your exact coordinates?"
        };
      }

      let places = [];
      let type = "text_response";

      if (needsAction) {
          places = await findNearbyPlaces(aiDecision.action, location.lat, location.lng);
          type = "action_response";
      }
      
      let finalDraft = aiDecision.whatsapp_draft;
      if (finalDraft) {
          finalDraft = finalDraft.replace(/\[LOCATION_LINK\]/g, `https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`);
          if (places && places.length > 0) {
              finalDraft = finalDraft.replace(/\[NEAREST_LANDMARK\]/g, places[0].name);
          } else {
              finalDraft = finalDraft.replace(/\[NEAREST_LANDMARK\]/g, "my current location");
          }
      }

      return {
        type: type,
        message: aiDecision.message,
        whatsapp_draft: finalDraft,
        ride_estimates: ride_estimates,
        data: places
      };
    }

    let finalDraft = aiDecision.whatsapp_draft;
    if (finalDraft) {
        if (location) {
            finalDraft = finalDraft.replace(/\[LOCATION_LINK\]/g, `https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`);
        } else {
            finalDraft = finalDraft.replace(/\[LOCATION_LINK\]/g, "my location");
        }
        finalDraft = finalDraft.replace(/\[NEAREST_LANDMARK\]/g, "my current location");
    }

    // 4. No action needed, just return the text response
    return {
      type: "text_response",
      message: aiDecision.message,
      whatsapp_draft: finalDraft,
      ride_estimates: ride_estimates,
      data: []
    };

  } catch (error) {
    console.error("[HumanAgent] Error:", error.message);
    return {
      type: "text_response",
      message: "I am having trouble connecting right now, but I am still here. Please call 112 if you are in immediate danger.",
      data: []
    };
  }
}

module.exports = { handlePanicSituation };
