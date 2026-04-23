// =============================================
// JENNY FRONTEND API CLIENT
// =============================================
// Replace the contents of frontend/src/lib/jenny-api.ts with this file.

export interface JennyResponse {
  sessionId: string;
  detectedCategories: string[];
  agentsActivated: string[];
  recoveryPlan: string;
  urgencyLevel: string;
  estimatedResolutionTime: string;
  agentResults?: {
    agent: string;
    priority: string;
    steps: string[];
    status: string;
  }[];
  extended?: {
    situationContext: Record<string, unknown>;
    travelOptions: TravelOption[];
    safePlaces: SafePlace[];
    emergencyNumbers: EmergencyNumber[];
    immediateAction: string;
    communicationMessages: CommunicationMessage[];
    quickActions: QuickAction[];
    followUpSupported: boolean;
  };
}

export interface TravelOption {
  mode: string;
  cost: string;
  duration: string;
  feasible: boolean;
  note: string;
}

export interface SafePlace {
  name: string;
  description: string;
  icon: string;
  priority: string;
  tip: string;
}

export interface EmergencyNumber {
  label: string;
  number: string;
}

export interface CommunicationMessage {
  type: string;
  label: string;
  icon: string;
  subject: string;
  body: string;
}

export interface QuickAction {
  label: string;
  action: string;
  icon: string;
}

// Backend base URL — change this for production
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// In-memory session ID — persists for the browser session
let currentSessionId: string | null = null;

/**
 * Send a message to Jenny backend.
 * Automatically maintains session across follow-up messages.
 */
export async function callJennyBackend(message: string): Promise<JennyResponse> {
  const response = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      sessionId: currentSessionId, // null on first call → backend creates new session
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Backend error: ${response.status}`);
  }

  const data: JennyResponse = await response.json();

  // Store session ID for follow-up messages
  if (data.sessionId) {
    currentSessionId = data.sessionId;
  }

  return data;
}

/**
 * Reset the session (start fresh conversation).
 */
export function resetSession(): void {
  currentSessionId = null;
}

/**
 * Get the current session ID (for debugging).
 */
export function getSessionId(): string | null {
  return currentSessionId;
}
