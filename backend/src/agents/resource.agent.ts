import Anthropic from "@anthropic-ai/sdk";
import { AgentResult, ManagerOutput, UrgencyLevel } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny's Resource Agent for India.
Handle low battery (save tips, charging spots), no cash (UPI, borrow, helplines),
no shelter (railway waiting rooms, dharamshalas, 24hr places).
Practical. Immediate. India-specific only.
Return JSON only: { "priority": string, "steps": string[] }`;

const RELEVANT_CATEGORIES = ["device", "financial", "shelter"];

export async function resourceAgent(
  userMessage: string,
  managerOutput: ManagerOutput
): Promise<AgentResult> {
  const isRelevant = managerOutput.categories.some((c) =>
    RELEVANT_CATEGORIES.includes(c)
  );

  if (!isRelevant) {
    return {
      agent: "Resource",
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
      agent: "Resource",
      priority: parsed.priority as UrgencyLevel,
      steps: parsed.steps || [],
      status: "success",
    };
  } catch (error) {
    console.error("[ResourceAgent] Failed:", error);
    return {
      agent: "Resource",
      priority: "medium",
      steps: [
        "Turn on battery saver mode and close all background apps immediately.",
        "Look for the nearest railway station waiting room — they're open 24/7 and free.",
      ],
      status: "fallback",
    };
  }
}
