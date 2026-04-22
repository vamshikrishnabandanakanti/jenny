export interface JennyResponse {
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
}

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function callJennyBackend(
  message: string
): Promise<JennyResponse> {
  const response = await fetch(`${BACKEND_URL}/api/jenny/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId: crypto.randomUUID() }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.statusText}`);
  }

  return response.json();
}
