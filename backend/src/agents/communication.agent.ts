import Anthropic from "@anthropic-ai/sdk";
import { AgentResult, ManagerOutput, UrgencyLevel } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny's Communication Agent.
Write the EXACT message to send to family right now (under 2 sentences).
Specify who to contact and how.
Format: 'Send this: [exact message]'
Return JSON only: { "priority": string, "steps": string[] }`;

const RELEVANT_CATEGORIES = ["communication", "safety", "travel"];

export async function communicationAgent(
  userMessage: string,
  managerOutput: ManagerOutput
): Promise<AgentResult> {
  const isRelevant = managerOutput.categories.some((c) =>
    RELEVANT_CATEGORIES.includes(c)
  );

  if (!isRelevant) {
    return {
      agent: "Communication",
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
      agent: "Communication",
      priority: parsed.priority as UrgencyLevel,
      steps: parsed.steps || [],
      status: "success",
    };
  } catch (error) {
    console.error("[CommunicationAgent] Failed:", error);
    return {
      agent: "Communication",
      priority: "high",
      steps: [
        "Send this to your closest family member: 'I'm safe but need help. Will call when I can. Don't worry.'",
      ],
      status: "fallback",
    };
  }
}
