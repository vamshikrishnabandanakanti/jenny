// =============================================
// CHAT ROUTE — Action-Oriented Endpoint
// =============================================

const express = require("express");
const router = express.Router();
const { handlePanicSituation } = require("../agent/humanAgent");

router.post("/", async (req, res) => {
  try {
    const { message, location, step = 1, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ 
        type: "text_response", 
        message: "Message is required." 
      });
    }

    console.log(`[Action Chat] Step: ${step} | History length: ${history.length}`);
    if (location) {
      console.log("Incoming location:", location);
    }

    // 1. Delegate entirely to the Universal Human Agent
    const responsePayload = await handlePanicSituation(message, location, step, history);
    
    // 2. Return strictly formatted JSON
    return res.json(responsePayload);

  } catch (error) {
    console.error("[Action Chat] Error handling request:", error);
    return res.status(500).json({
      type: "text_response",
      message: "An internal server error occurred while processing your request.",
      data: []
    });
  }
});

module.exports = router;
