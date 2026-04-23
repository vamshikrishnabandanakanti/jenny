// =============================================
// DECISION ENGINE — Map Intents to Actions
// =============================================

const { findNearbyPlaces } = require("../services/mapplsService");

const EMERGENCY_CONTACTS = {
  all: { label: "All-in-one Emergency", number: "112" },
  police: { label: "Police", number: "100" },
  ambulance: { label: "Ambulance", number: "108" },
  fire: { label: "Fire", number: "101" }
};

/**
 * Handle missing location for intents that require it.
 */
function requestLocationResponse(message) {
  return {
    type: "request_location",
    message: message || "Please allow location access to find nearby help."
  };
}

/**
 * Format standard action response.
 */
function formatActionResponse(message, data) {
  return {
    type: "action_response",
    message,
    data
  };
}

/**
 * Fallback to standard emergency contacts.
 */
function getEmergencyFallback(intent) {
  let contacts = [EMERGENCY_CONTACTS.all];
  
  if (intent === "medical_emergency") contacts.push(EMERGENCY_CONTACTS.ambulance);
  if (intent === "safety_threat") contacts.push(EMERGENCY_CONTACTS.police);
  
  return {
    type: "action_response",
    message: "We couldn't find nearby automated results, but please contact these emergency numbers immediately.",
    data: { emergency_contacts: contacts }
  };
}

/**
 * Main Decision Logic
 */
async function processDecision(intent, location, step = 1, urgency = "low") {
  // ============================================
  // STAGE 1: Calm Response (If not high urgency)
  // ============================================
  if (!location && step === 1 && urgency !== "high") {
    if (intent === "car_lockout") {
      return { 
        type: "text_response", 
        message: "Take a breath — you're okay.\n\nTry this first:\n• Check all doors again\n• Look for slightly open windows\n• Think if a spare key is nearby\n\nIf that doesn't work, I can find help near you." 
      };
    }
    if (intent === "medical_emergency") {
       return { 
         type: "text_response", 
         message: "Stay calm. If someone is hurt, do not move them unless absolutely necessary.\n\nShould I find the nearest hospital or emergency services for you right now?" 
       };
    }
    if (intent === "safety_threat") {
       return { 
         type: "text_response", 
         message: "Your safety is the absolute priority. Try to move to a well-lit, public area if you can.\n\nShould I locate the nearest police station or safe zone for you?" 
       };
    }
    if (intent === "transport_issue") {
       return { 
         type: "text_response", 
         message: "Take a breath. Being stranded is stressful, but we can fix this.\n\nShould I find nearby transit stations, mechanics, or safe places to wait?" 
       };
    }
  }

  // ============================================
  // STAGE 2: Action (Location & API)
  // ============================================
  // 1. CAR LOCKOUT
  if (intent === "car_lockout") {
    if (!location || !location.lat || !location.lng) {
      return requestLocationResponse("Want me to find nearby locksmiths? Allow location.");
    }
    
    const locksmiths = await findNearbyPlaces("locksmith", location.lat, location.lng);
    
    if (locksmiths.length > 0) {
      return formatActionResponse("Here are locksmiths near you:", { places: locksmiths });
    }
    return formatActionResponse("No locksmiths found nearby. You may need to contact road assistance.", {});
  }

  // 2. MEDICAL EMERGENCY
  if (intent === "medical_emergency") {
    if (!location || !location.lat || !location.lng) {
      return requestLocationResponse("Allow location access so I can find the nearest hospitals for you.");
    }
    let data = { emergency_contacts: [EMERGENCY_CONTACTS.ambulance, EMERGENCY_CONTACTS.all] };
    
    if (location && location.lat && location.lng) {
      const hospitals = await findNearbyPlaces("hospital", location.lat, location.lng);
      if (hospitals.length > 0) {
        data.places = hospitals;
        return formatActionResponse("Here are nearby hospitals and emergency numbers:", data);
      }
    }
    
    // Fallback if no location or no hospitals
    return formatActionResponse("Please call for an ambulance immediately.", data);
  }

  // 3. SAFETY THREAT
  if (intent === "safety_threat") {
    if (!location || !location.lat || !location.lng) {
      return requestLocationResponse("Allow location access so I can direct you to the nearest police station or safe zone.");
    }
    let data = { emergency_contacts: [EMERGENCY_CONTACTS.police, EMERGENCY_CONTACTS.all] };
    
    if (location && location.lat && location.lng) {
      const policeStations = await findNearbyPlaces("police", location.lat, location.lng);
      if (policeStations.length > 0) {
        data.places = policeStations;
        return formatActionResponse("Here are nearby police stations and emergency numbers:", data);
      }
    }
    
    return formatActionResponse("Get to a safe place immediately and call the police.", data);
  }
  
  // 4. TRANSPORT ISSUE
  if (intent === "transport_issue") {
    if (!location || !location.lat || !location.lng) {
      return requestLocationResponse("Allow location access so I can find nearby transit or safe places.");
    }
    
    const transit = await findNearbyPlaces("transit", location.lat, location.lng);
    if (transit.length > 0) {
      return formatActionResponse("Here are nearby transit options. Stay in well-lit public areas.", { places: transit });
    }
    
    return formatActionResponse("No immediate transit found. Please call a trusted contact or 112 if you feel unsafe.", { 
      emergency_contacts: [EMERGENCY_CONTACTS.all] 
    });
  }

  // 5. GENERAL HELP (Fallback)
  return {
    type: "text_response",
    message: "I am here to help. Could you provide more details about your situation?",
    data: {}
  };
}

module.exports = { processDecision };
