import Anthropic from "@anthropic-ai/sdk";
import { AgentResult, ManagerOutput, UrgencyLevel } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny's Context Agent.
Add time/environment-aware advice for India.
Current time will be provided. Give 1-2 tips only if they add real value.
Consider: night safety, heat, monsoon, crowds, power cuts.
Return JSON only: { "priority": string, "steps": string[] }`;

export async function contextAgent(
  userMessage: string,
  managerOutput: ManagerOutput
): Promise<AgentResult> {
  try {
    const now = new Date();
    const timeInfo = `Current time: ${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Crisis: "${userMessage}"\n${timeInfo}\nDetected categories: ${managerOutput.categories.join(", ")}\nContext: ${JSON.stringify(managerOutput.context)}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    return {
      agent: "Context",
      priority: parsed.priority as UrgencyLevel,
      steps: parsed.steps || [],
      status: "success",
    };
  } catch (error) {
    console.error("[ContextAgent] Failed:", error);
    return {
      agent: "Context",
      priority: "low",
      steps: [],
      status: "fallback",
    };
  }
}
