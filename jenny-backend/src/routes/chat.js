// =============================================
// CHAT ROUTE — Action-Oriented Endpoint
// =============================================

const express = require("express");
const router = express.Router();
const { detectIntent } = require("../agent/intentDetector");
const { processDecision } = require("../agent/decisionEngine");

router.post("/", async (req, res) => {
  try {
    const { message, location } = req.body;

    if (!message) {
      return res.status(400).json({ 
        type: "text_response", 
        message: "Message is required." 
      });
    }

    console.log(`[Action Chat] Received message: "${message.substring(0, 50)}..."`);
    if (location) {
      console.log(`[Action Chat] Location provided: ${location.lat}, ${location.lng}`);
    }

    // 1. Detect Intent
    const intent = await detectIntent(message);
    console.log(`[Action Chat] Detected Intent: ${intent}`);

    // 2. Process Decision (Action)
    const responsePayload = await processDecision(intent, location);
    
    // 3. Return strictly formatted JSON
    return res.json(responsePayload);

  } catch (error) {
    console.error("[Action Chat] Error handling request:", error);
    return res.status(500).json({
      type: "text_response",
      message: "An internal server error occurred while processing your request.",
      data: {}
    });
  }
});

module.exports = router;
