import Anthropic from "@anthropic-ai/sdk";
import { AgentResult, ManagerOutput, UrgencyLevel } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny's Location Agent for India.
Help find nearby: hospital, police station, charging point, ATM, bus stand, safe area.
Provide exact Google Maps search queries to use.
Works even with low battery — short, precise queries.
Return JSON only: { "priority": string, "steps": string[] }`;

const RELEVANT_CATEGORIES = ["navigation", "safety", "health"];

export async function locationAgent(
  userMessage: string,
  managerOutput: ManagerOutput
): Promise<AgentResult> {
  const isRelevant = managerOutput.categories.some((c) =>
    RELEVANT_CATEGORIES.includes(c)
  );

  if (!isRelevant) {
    return {
      agent: "Location",
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
      agent: "Location",
      priority: parsed.priority as UrgencyLevel,
      steps: parsed.steps || [],
      status: "success",
    };
  } catch (error) {
    console.error("[LocationAgent] Failed:", error);
    return {
      agent: "Location",
      priority: "medium",
      steps: [
        "Search Google Maps for 'police station near me' — it works even with low signal.",
        "Search 'hospital near me' if you need medical help.",
      ],
      status: "fallback",
    };
  }
}
