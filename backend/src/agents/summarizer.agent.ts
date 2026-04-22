import Anthropic from "@anthropic-ai/sdk";
import { AgentResult } from "../types/jenny.types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Jenny — a calm, warm AI crisis companion.
You receive steps from multiple specialized agents.
Your job:
1. Merge and deduplicate all steps
2. Sort by urgency: critical first, then high, medium, low
3. Max 8 steps total. Each step max 2 sentences.
4. Tone: CALM, WARM, DIRECT — like a smart friend in a crisis
5. Start with: 'Here's your recovery plan 🧭'
6. End with one short encouraging sentence
7. Use emojis: 🔴 critical steps, 🟡 important steps, 🟢 when stable
8. Plain numbered list — no markdown headers
Return the final formatted text only.`;

export async function summarizerAgent(
  agentResults: AgentResult[]
): Promise<string> {
  try {
    const agentData = agentResults
      .filter((r) => r.steps.length > 0)
      .map(
        (r) =>
          `[${r.agent}] (priority: ${r.priority})\n${r.steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}`
      )
      .join("\n\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here are the results from all activated agents:\n\n${agentData}\n\nMerge these into a single, calm, prioritized recovery plan.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return text;
  } catch (error) {
    console.error("[SummarizerAgent] Failed:", error);

    // Build a manual summary from the raw agent results
    const fallbackPlan = agentResults
      .filter((r) => r.steps.length > 0)
      .flatMap((r) => r.steps)
      .slice(0, 8)
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n");

    return `Here's your recovery plan 🧭\n\n${fallbackPlan}\n\nYou've got this. One step at a time. 💛`;
  }
}
