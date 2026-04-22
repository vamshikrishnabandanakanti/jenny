import Anthropic from "@anthropic-ai/sdk";
import { ManagerOutput, UrgencyLevel, CrisisCategory } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny's Manager Agent — a crisis classifier.
Analyze the panic message and return ONLY a JSON object (no markdown).
Crisis categories: travel, financial, device, safety, health, shelter, communication, navigation, legal, chaos, mental.
Extract context: location, battery, cash, time_of_day, people_nearby, specific_issue.
Urgency rules:
- critical: physical danger, medical emergency, immediate safety threat
- high: stranded, no money + no shelter, device dying in unsafe place
- medium: missed transport, payment issues, navigation lost
- low: inconvenience, stress, needs planning
Return format: { "categories": string[], "context": {}, "urgencyLevel": string }`;

export async function managerAgent(userMessage: string): Promise<ManagerOutput> {
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
      categories: parsed.categories as CrisisCategory[],
      context: parsed.context || {},
      urgencyLevel: parsed.urgencyLevel as UrgencyLevel,
    };
  } catch (error) {
    console.error("[ManagerAgent] Failed:", error);
    return {
      categories: ["chaos"],
      context: {},
      urgencyLevel: "high",
    };
  }
}
