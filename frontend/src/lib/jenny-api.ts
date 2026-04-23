// =============================================
// JENNY FRONTEND API CLIENT (Action Engine)
// =============================================

export interface JennyActionResponse {
  type: "action_response" | "text_response" | "request_location";
  message: string;
  whatsapp_draft?: string;
  ride_estimates?: {
    destination_name: string;
    drop_lat: number;
    drop_lng: number;
    distance_meters: number;
    walk: { time_mins: number; cost: number };
    bike: { time_mins: number; cost: number };
    cab: { time_mins: number; cost: number };
    bus: { time_mins: number; cost: number };
  };
  data?: any;
}

// Backend base URL — change this for production
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

/**
 * Send a message and location to Jenny backend.
 */
export async function callJennyBackend(
  message: string, 
  location?: { lat: number; lng: number },
  step: number = 1,
  history: any[] = []
): Promise<JennyActionResponse> {
  const response = await fetch(`${BACKEND_URL}/api/v2/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      location,
      step,
      history
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Backend error: ${response.status}`);
  }

  return response.json();
}
