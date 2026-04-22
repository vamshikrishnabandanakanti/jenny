import Anthropic from "@anthropic-ai/sdk";
import { AgentResult, ManagerOutput, UrgencyLevel } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny's Safety Agent. Assess physical risk.
Return 2-3 IMMEDIATE safety actions only if risk exists.
If situation is physically safe, return empty steps array.
Be DIRECT and CALM. No fluff. All actions start with verbs.
India-specific context. Return JSON only:
{ "priority": string, "steps": string[] }`;

export async function safetyAgent(
  userMessage: string,
  managerOutput: ManagerOutput
): Promise<AgentResult> {
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
      agent: "Safety",
      priority: parsed.priority as UrgencyLevel,
      steps: parsed.steps || [],
      status: "success",
    };
  } catch (error) {
    console.error("[SafetyAgent] Failed:", error);
    return {
      agent: "Safety",
      priority: "high",
      steps: ["Move to a well-lit, populated area immediately."],
      status: "fallback",
    };
  }
}
