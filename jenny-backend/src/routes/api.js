// =============================================
// ROUTES — Jenny API Endpoints
// =============================================

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { orchestrate } = require("../utils/orchestrator");
const { getContext, getHistory } = require("../memory/sessionStore");

const router = express.Router();

// ─────────────────────────────────────────
// POST /api/chat
// Main endpoint — handles BOTH initial messages and follow-ups.
// Frontend sends all messages here. Session ID tracks conversation.
// ─────────────────────────────────────────
router.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "message is required and must be a non-empty string." });
  }

  // Use provided sessionId or generate new one
  const sid = sessionId || uuidv4();

  try {
    const result = await orchestrate(sid, message.trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Route /chat] Error:", error.message);
    return res.status(500).json({
      error: "Jenny encountered an error processing your request.",
      sessionId: sid,
      detectedCategories: ["general"],
      agentsActivated: ["System"],
      recoveryPlan: "I'm having trouble right now. Please stay calm. If this is an emergency, call 112 immediately.",
      urgencyLevel: "high",
      estimatedResolutionTime: "N/A",
      agentResults: [],
    });
  }
});

// ─────────────────────────────────────────
// POST /api/analyze
// Alias for /chat — for initial panic analysis.
// Same logic, kept separate for semantic clarity.
// ─────────────────────────────────────────
router.post("/analyze", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "message is required." });
  }

  const sid = sessionId || uuidv4();

  try {
    const result = await orchestrate(sid, message.trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Route /analyze] Error:", error.message);
    return res.status(500).json({ error: "Analysis failed. Please try again.", sessionId: sid });
  }
});

// ─────────────────────────────────────────
// GET /api/session/:sessionId
// Returns current session context (for debugging / frontend state sync).
// ─────────────────────────────────────────
router.get("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const context = getContext(sessionId);
  const history = getHistory(sessionId);

  return res.status(200).json({
    sessionId,
    context,
    messageCount: history.length,
    history: history.slice(-6), // Return last 6 messages only
  });
});

// ─────────────────────────────────────────
// GET /api/health
// Health check endpoint.
// ─────────────────────────────────────────
router.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "Jenny AI Backend",
    timestamp: new Date().toISOString(),
    aiProvider: "Google Gemini",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  });
});

module.exports = router;
