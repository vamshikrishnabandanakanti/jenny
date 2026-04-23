// =============================================
// MAPPLS SERVICE — Location API
// =============================================

const axios = require("axios");

/**
 * Find nearby places using MapmyIndia (Mappls) Atlas API
 * @param {string} type - Keyword (e.g., locksmith, hospital, police)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Array} List of top 5 nearby places
 */
async function findNearbyPlaces(type, lat, lng) {
  try {
    const MAPPLS_API_KEY = process.env.MAPPLS_API_KEY;
    if (!MAPPLS_API_KEY || MAPPLS_API_KEY === "your_mappls_api_key_here") {
      console.warn("[Mappls] API key not configured properly.");
      return [];
    }

    const response = await axios.get("https://atlas.mappls.com/api/places/nearby/json", {
      params: {
        keywords: type,
        refLocation: `${lat},${lng}`,
        radius: 3000,
        key: MAPPLS_API_KEY
      }
    });

    const places = response.data.suggestedLocations || [];
    
    // Get top 5 and map to requested structure
    return places.slice(0, 5).map(place => ({
      name: place.placeName || place.placeAddress,
      address: place.placeAddress,
      distance: place.distance,
      lat: place.latitude,
      lng: place.longitude
    }));

  } catch (error) {
    console.error("[Mappls] Error fetching nearby places:", error.message);
    return [];
  }
}

module.exports = { findNearbyPlaces };
