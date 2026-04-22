import Anthropic from "@anthropic-ai/sdk";
import { AgentResult, ManagerOutput, UrgencyLevel } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny's Transport Agent for India.
Handle: missed train/flight/bus, stranded, wrong route, no transport at night.
Apps to mention: IRCTC, Ola, Uber, Rapido, RedBus, AbBus, MakeMyTrip.
Helplines: Railway 139, IRCTC 14646.
Give 2-4 practical steps. Return JSON only:
{ "priority": string, "steps": string[] }`;

const RELEVANT_CATEGORIES = ["travel", "navigation"];

export async function transportAgent(
  userMessage: string,
  managerOutput: ManagerOutput
): Promise<AgentResult> {
  const isRelevant = managerOutput.categories.some((c) =>
    RELEVANT_CATEGORIES.includes(c)
  );

  if (!isRelevant) {
    return {
      agent: "Transport",
      priority: "low",
      steps: [],
      status: "skipped",
    };
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Crisis: "${userMessage}"\nDetected categories: ${managerOutput.categories.join(", ")}\nContext: ${JSON.stringify(managerOutput.context)}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    return {
      agent: "Transport",
      priority: parsed.priority as UrgencyLevel,
      steps: parsed.steps || [],
      status: "success",
    };
  } catch (error) {
    console.error("[TransportAgent] Failed:", error);
    return {
      agent: "Transport",
      priority: "medium",
      steps: [
        "Call Railway helpline 139 for immediate train assistance.",
        "Open Ola/Uber and check for rides near your location.",
      ],
      status: "fallback",
    };
  }
}
