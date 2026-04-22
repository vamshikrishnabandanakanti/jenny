import { JennyResponse, AgentResult } from "../types/jenny.types";
import { managerAgent } from "../agents/manager.agent";
import { safetyAgent } from "../agents/safety.agent";
import { transportAgent } from "../agents/transport.agent";
import { communicationAgent } from "../agents/communication.agent";
import { contextAgent } from "../agents/context.agent";
import { resourceAgent } from "../agents/resource.agent";
import { locationAgent } from "../agents/location.agent";
import { fallbackAgent } from "../agents/fallback.agent";
import { summarizerAgent } from "../agents/summarizer.agent";

const timeMap: Record<string, string> = {
  critical: "Under 2 minutes",
  high: "Under 5 minutes",
  medium: "5–15 minutes",
  low: "15–30 minutes",
};

export async function runJennyOrchestrator(
  userMessage: string
): Promise<JennyResponse> {
  const startTime = Date.now();

  // Step 1: Run manager agent first (sequential — needed for routing)
  console.log("[Orchestrator] Running Manager Agent...");
  const managerOutput = await managerAgent(userMessage);
  console.log(
    `[Orchestrator] Manager classified: [${managerOutput.categories.join(", ")}] urgency=${managerOutput.urgencyLevel}`
  );

  // Step 2: Run all 7 remaining agents in parallel via Promise.allSettled()
  console.log("[Orchestrator] Running 7 sub-agents in parallel...");
  const agentPromises = [
    safetyAgent(userMessage, managerOutput),
    transportAgent(userMessage, managerOutput),
    communicationAgent(userMessage, managerOutput),
    contextAgent(userMessage, managerOutput),
    resourceAgent(userMessage, managerOutput),
    locationAgent(userMessage, managerOutput),
    fallbackAgent(userMessage),
  ];

  const settledResults = await Promise.allSettled(agentPromises);

  // Step 3: Collect all successful AgentResults
  const agentResults: AgentResult[] = [];
  const agentsActivated: string[] = [];

  for (const result of settledResults) {
    if (result.status === "fulfilled") {
      const agentResult = result.value;
      if (agentResult.steps.length > 0) {
        agentResults.push(agentResult);
        agentsActivated.push(agentResult.agent);
      }
    } else {
      console.error("[Orchestrator] Agent rejected:", result.reason);
    }
  }

  console.log(
    `[Orchestrator] ${agentsActivated.length} agents activated: [${agentsActivated.join(", ")}]`
  );

  // Step 4: Run summarizer with all collected results
  console.log("[Orchestrator] Running Summarizer Agent...");
  const recoveryPlan = await summarizerAgent(agentResults);

  const elapsed = Date.now() - startTime;
  console.log(
    `Jenny orchestration completed in ${elapsed}ms, ${agentsActivated.length} agents activated`
  );

  // Step 5: Return complete JennyResponse
  return {
    detectedCategories: managerOutput.categories,
    agentsActivated,
    recoveryPlan,
    urgencyLevel: managerOutput.urgencyLevel,
    estimatedResolutionTime: timeMap[managerOutput.urgencyLevel] || "5–15 minutes",
    agentResults,
  };
}
