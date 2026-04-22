export type CrisisCategory =
  | "travel"
  | "financial"
  | "device"
  | "safety"
  | "health"
  | "shelter"
  | "communication"
  | "navigation"
  | "legal"
  | "chaos"
  | "mental";

export type UrgencyLevel = "critical" | "high" | "medium" | "low";

export interface AgentResult {
  agent: string;
  priority: UrgencyLevel;
  steps: string[];
  status: "success" | "skipped" | "fallback";
}

export interface ManagerOutput {
  categories: CrisisCategory[];
  context: Record<string, string>;
  urgencyLevel: UrgencyLevel;
}

export interface JennyResponse {
  detectedCategories: CrisisCategory[];
  agentsActivated: string[];
  recoveryPlan: string;
  urgencyLevel: UrgencyLevel;
  estimatedResolutionTime: string;
  agentResults?: AgentResult[];
}

export interface JennyRequest {
  message: string;
  sessionId?: string;
}
