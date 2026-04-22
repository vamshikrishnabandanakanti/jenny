import Anthropic from "@anthropic-ai/sdk";
import { AgentResult } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny's Fallback Agent — the guaranteed safety net.
Generate exactly 3 recovery steps that work with NO internet, NO money, NO battery.
Be calm, human, warm. Universal steps for any panic situation in India.
Return JSON only: { "priority": "medium", "steps": [3 items] }`;

export async function fallbackAgent(
  userMessage: string
): Promise<AgentResult> {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    return {
      agent: "Fallback",
      priority: "medium",
      steps: parsed.steps || [],
      status: "success",
    };
  } catch (error) {
    console.error("[FallbackAgent] Failed:", error);
    return {
      agent: "Fallback",
      priority: "medium",
      steps: [
        "Take 3 slow, deep breaths. You are going to be okay.",
        "Look around for the nearest person who looks safe — a shop owner, security guard, or family — and ask for help.",
        "Head to the nearest well-lit, populated area. Railway stations and petrol pumps are open 24/7.",
      ],
      status: "fallback",
    };
  }
}
