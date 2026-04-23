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
async function processDecision(intent, location) {
  // 1. CAR LOCKOUT
  if (intent === "car_lockout") {
    if (!location || !location.lat || !location.lng) {
      return requestLocationResponse("We need your location to find nearby locksmiths.");
    }
    
    const locksmiths = await findNearbyPlaces("locksmith", location.lat, location.lng);
    
    if (locksmiths.length > 0) {
      return formatActionResponse("Here are locksmiths near you:", { places: locksmiths });
    }
    return formatActionResponse("No locksmiths found nearby. You may need to contact road assistance.", {});
  }

  // 2. MEDICAL EMERGENCY
  if (intent === "medical_emergency") {
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
      return requestLocationResponse("We need your location to find nearby transit or safe places.");
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
