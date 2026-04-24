const express = require('express');
const router = express.Router();
const { processWhatsAppMessage } = require('../services/whatsappService');

/**
 * Twilio Webhook for incoming WhatsApp messages
 * Twilio sends data as application/x-www-form-urlencoded
 */
router.post('/webhook', async (req, res) => {
    // Respond immediately to Twilio to avoid timeout
    res.status(200).send('<Response></Response>');

    const { From, Body, Latitude, Longitude } = req.body;

    // Process asynchronously
    try {
        await processWhatsAppMessage(From, Body, Latitude, Longitude);
    } catch (error) {
        console.error('[WhatsApp Route] Error processing message:', error);
    }
});

module.exports = router;
