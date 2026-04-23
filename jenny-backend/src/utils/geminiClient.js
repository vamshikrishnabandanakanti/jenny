// =============================================
// MISTRAL CLIENT (Replaced Gemini Integration)
// =============================================

const { Mistral } = require("@mistralai/mistralai");

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const MODEL_NAME = process.env.MISTRAL_MODEL || "mistral-small-latest";

/**
 * Core Mistral call. Works with any number of messages.
 */
async function callMistral(systemPrompt, messages, forceJSON = false) {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not set in .env file");
  }

  const mistralMessages = [];
  
  if (systemPrompt) {
    // For json_object mode, the string "json" must be in the prompt.
    const finalSystemPrompt = forceJSON 
      ? systemPrompt + "\n\nYou must return a valid JSON object." 
      : systemPrompt;
      
    mistralMessages.push({ role: "system", content: finalSystemPrompt });
  }

  for (const m of messages) {
    mistralMessages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "help me"
    });
  }

  const options = {
    model: MODEL_NAME,
    messages: mistralMessages,
    temperature: forceJSON ? 0.2 : 0.7,
  };

  if (forceJSON) {
    options.responseFormat = { type: 'json_object' };
  }

  const result = await client.chat.complete(options);
  return result.choices[0].message.content;
}

/**
 * Invoke Mistral for plain text response.
 * (Exported as invokeGemini to avoid changing agent imports)
 */
async function invokeGemini(systemPrompt, messages, maxTokens = 1500) {
  try {
    return await callMistral(systemPrompt, messages, false);
  } catch (error) {
    console.error("[Mistral] Text error:", error.message);
    throw error;
  }
}

/**
 * Invoke Mistral expecting a JSON response.
 * (Exported as invokeGeminiJSON to avoid changing agent imports)
 */
async function invokeGeminiJSON(systemPrompt, messages) {
  try {
    const raw = await callMistral(systemPrompt, messages, true);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[Mistral] JSON error:", error.message);
    return null;
  }
}

module.exports = { invokeGemini, invokeGeminiJSON };
