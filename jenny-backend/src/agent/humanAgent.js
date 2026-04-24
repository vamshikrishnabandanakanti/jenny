const { invokeGeminiJSON } = require("../utils/geminiClient");
const { findNearbyPlaces, searchPlace } = require("../services/mapplsService");

const SYSTEM_PROMPT = `You are Jenny, a highly intelligent and empathetic emergency response agent. 
Your goal is to provide ACTIONABLE, DETAILED help for every panic situation.

CRITICAL RULES:
1. TRIGGER ACTIONS: If the user needs to find a place (hospital, metro, police, etc.), you MUST set the "action" field. If "action" is "none", the user will NOT see a map.
2. METRO STATIONS: If the user asks for a "metro station" or "bus", set "action" to "transit".
3. LOCATION FOLLOW-UP: If the user says "Yes", shares location, or says "Allow location", look at the previous messages. If they were looking for a metro, hospital, or destination, you MUST trigger that action NOW.
4. BE CONVERSATIONAL but THOROUGH: Speak naturally but always provide a clear plan.
5. DESTINATION: If you know where they want to go, set ride_estimate with the destination name.

ACTIONS:
- "transit": Metro, bus, railway stations, travel.
- "hospital": Medical emergencies, accidents, injuries.
- "police": Safety, crime, phone theft, lost items, feeling followed.
- "mechanic": Car/bike breakdown.
- "locksmith": Locked out.
- "none": Only for casual greetings like "hello", "thanks", "new chat", etc.

MANDATORY — "steps" FIELD:
You MUST ALWAYS provide the "steps" array in EVERY response. This is not optional.
The steps should contain 4-6 specific, actionable recovery steps tailored to the user's situation.
Even for simple situations, provide helpful steps. NEVER leave steps empty or omit it.

Examples:
- Accident → ["Check for injuries and call 112 if anyone is hurt", "Move to a safe spot away from traffic and turn on hazard lights", "File an FIR at the nearest police station", "Contact your insurance company", "Get a medical check-up even if you feel fine"]
- Lost phone → ["Try calling your phone immediately", "Use Find My Device (Android) or Find My iPhone (iOS) to locate it", "Go to nearest police station to file FIR", "Contact your mobile carrier to block the SIM card", "Change passwords for banking, email, and social media"]
- Missed train → ["Check the next available train schedule", "Find nearest metro or bus as alternative", "Book a cab or auto if urgent", "Inform anyone waiting for you about the delay"]

TRAVEL OPTIONS:
When travel is relevant, set ride_estimate with the destination. The frontend will show booking buttons for Ola, Uber, Rapido, and Google Maps automatically.

Output strictly in JSON format:
{
  "message": "Short, empathetic response. Keep this brief — the steps will provide detail.",
  "action": "transit" | "hospital" | "police" | "mechanic" | "locksmith" | "none",
  "steps": ["Step 1 text", "Step 2 text", "Step 3 text", "Step 4 text"],
  "whatsapp_draft": "Natural draft for family with [NEAREST_LANDMARK] and [LOCATION_LINK].",
  "ride_estimate": {
    "destination_name": "Destination name",
    "drop_lat": "number",
    "drop_lng": "number",
    "distance_meters": "number"
  }
}`;



async function handlePanicSituation(userMessage, location, step, history = []) {
  try {
    // Handle satisfaction responses
    const satisfiedPattern = /^(satisfied|yes.*(satisfied|happy|good|done|thanks)|i'?m\s+(good|fine|okay|ok|done|satisfied))[\s!.]*$/i;
    const notSatisfiedPattern = /^(not\s*satisfied|no|need\s*more\s*help|not\s*(good|done|okay))[\s!.]*$/i;

    if (satisfiedPattern.test(userMessage.trim())) {
      return {
        type: "session_end",
        message: "I'm glad I could help! 💙 Remember, you're stronger than you think. Stay safe, and don't hesitate to reach out anytime you need me. Take care! 🌟",
        steps: [],
        data: [],
        askSatisfaction: false
      };
    }

    if (notSatisfiedPattern.test(userMessage.trim())) {
      return {
        type: "text_response",
        message: "I understand — let's keep going. Tell me what else is troubling you or what specific help you need. I'm not going anywhere. 💪",
        steps: [],
        data: [],
        askSatisfaction: false
      };
    }

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

    // 3. ENHANCEMENT: If AI provides a destination name but no distance, try to geocode it
    if (aiDecision.ride_estimate && aiDecision.ride_estimate.destination_name && !aiDecision.ride_estimate.distance_meters && location) {
        const dest = await searchPlace(aiDecision.ride_estimate.destination_name);
        if (dest) {
            aiDecision.ride_estimate.drop_lat = dest.lat;
            aiDecision.ride_estimate.drop_lng = dest.lng;
            
            // Calculate rough distance in meters (very basic approximation for speed)
            const dLat = (dest.lat - location.lat) * 111320;
            const dLng = (dest.lng - location.lng) * 40075000 * Math.cos(location.lat * Math.PI / 180) / 360;
            const directDist = Math.sqrt(dLat * dLat + dLng * dLng);
            aiDecision.ride_estimate.distance_meters = Math.ceil(directDist * 1.3); // Add 30% for road turns
        }
    }

    // 4. Evaluate if an action is needed or if a WhatsApp draft was generated
    let needsAction = aiDecision.action && aiDecision.action !== "none";
    
    // AUTO-ACTION: If user has a destination but action is none, force transit search
    if (aiDecision.ride_estimate && aiDecision.ride_estimate.destination_name && !needsAction) {
        aiDecision.action = "transit";
        needsAction = true;
    }

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
          message: aiDecision.message + "\n\nCan you allow location access so I can find what's nearby and get your exact coordinates?",
          steps: aiDecision.steps || [],
          whatsapp_draft: aiDecision.whatsapp_draft,
          ride_estimates: ride_estimates,
          data: [],
          askSatisfaction: true
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
        steps: aiDecision.steps || [],
        whatsapp_draft: finalDraft,
        ride_estimates: ride_estimates,
        data: places,
        askSatisfaction: true
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
    const hasSubstantiveContent = (aiDecision.steps && aiDecision.steps.length > 0) || ride_estimates || finalDraft;
    return {
      type: "text_response",
      message: aiDecision.message,
      steps: aiDecision.steps || [],
      whatsapp_draft: finalDraft,
      ride_estimates: ride_estimates,
      data: [],
      askSatisfaction: hasSubstantiveContent
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
