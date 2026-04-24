const twilio = require('twilio');
const { handlePanicSituation } = require('../agent/humanAgent');
const { addMessage, getHistory, updateContext, getContext } = require('../memory/sessionStore');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client;
if (accountSid && accountSid.startsWith('AC')) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('[WhatsApp Service] Twilio credentials not properly configured. WhatsApp messages will not be sent.');
}

/**
 * Helper to send a WhatsApp message via Twilio
 */
async function sendWhatsApp(to, body) {
    if (!client) {
        console.log('[WhatsApp Service] NO TWILIO CLIENT. Would have sent:\n', body);
        return;
    }
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
        ? process.env.TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

    // WhatsApp has a ~1600 char limit per message, split if needed
    const chunks = splitMessage(body, 1550);
    for (const chunk of chunks) {
        await client.messages.create({ body: chunk, from: fromNumber, to });
    }
}

/**
 * Process an incoming WhatsApp message from Twilio.
 * Uses the SAME handlePanicSituation logic as Telegram for consistent AI responses.
 */
async function processWhatsAppMessage(from, body, latitude, longitude) {
    const sessionId = `wa_${from.replace('whatsapp:', '')}`;
    
    console.log(`[WhatsApp Service] Message from ${from}: ${body || 'LOCATION'}`);

    // 1. Handle Location
    let location = null;
    if (latitude && longitude) {
        location = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
        updateContext(sessionId, { location });
    } else {
        const context = getContext(sessionId);
        location = context.location;
    }

    const history = getHistory(sessionId);
    const userMessage = body || "I have shared my location. Please find nearby help based on my coordinates.";

    try {
        // Handle satisfaction responses directly (fast path)
        const satisfiedPattern = /^(satisfied|yes.*(satisfied|happy|good|done|thanks)|i'?m\s+(good|fine|okay|ok|done|satisfied))[\s!.]*$/i;
        const notSatisfiedPattern = /^(not\s*satisfied|no|need\s*more\s*help|not\s*(good|done|okay))[\s!.]*$/i;

        if (satisfiedPattern.test(userMessage.trim()) || userMessage.trim() === '1') {
            const endMsg = "I'm glad I could help! 💙 Remember, you're stronger than you think. Stay safe, and don't hesitate to reach out anytime you need me. Take care! 🌟\n\nSend *hi* anytime to start a new session.";
            addMessage(sessionId, 'user', userMessage);
            addMessage(sessionId, 'assistant', endMsg);
            await sendWhatsApp(from, endMsg);
            return;
        }

        if (notSatisfiedPattern.test(userMessage.trim()) || userMessage.trim() === '2') {
            const continueMsg = "I understand — let's keep going. Tell me what else is troubling you or what specific help you need. I'm not going anywhere. 💪";
            addMessage(sessionId, 'user', userMessage);
            addMessage(sessionId, 'assistant', continueMsg);
            await sendWhatsApp(from, continueMsg);
            return;
        }

        // 2. Call the SAME handlePanicSituation that Telegram uses
        const jennyResponse = await handlePanicSituation(userMessage, location, 1, history);

        // 3. Update history
        addMessage(sessionId, 'user', userMessage);
        addMessage(sessionId, 'assistant', jennyResponse.message);

        // 4. Format the response as WhatsApp text (matching Telegram's format)
        const responseText = formatForWhatsApp(jennyResponse, location);

        // 5. Send
        await sendWhatsApp(from, responseText);

    } catch (error) {
        console.error('[WhatsApp Service] Error:', error);
        await sendWhatsApp(from, "🚨 Jenny is having trouble right now. Please stay calm.\n\n🆘 *Dial 112* for immediate emergency help.\n🚔 Police: *100*\n🚑 Ambulance: *108*");
    }
}

/**
 * Format a Jenny response for WhatsApp text —
 * mirrors the exact same structure as the Telegram bot.
 */
function formatForWhatsApp(jennyResponse, location) {
    let text = '';

    // ── 💬 CALMING MESSAGE ──
    text += `🚨 *JENNY AI — Emergency Assistant*\n\n`;
    text += jennyResponse.message;

    // ── 📍 LOCATION REQUEST ──
    if (jennyResponse.type === 'request_location') {
        text += `\n\n📍 _Please share your live location so I can find help nearby._`;
    }

    // ── 📋 RECOVERY PLAN ──
    if (jennyResponse.steps && jennyResponse.steps.length > 0) {
        text += `\n\n━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📋 *Recovery Plan:*\n`;
        jennyResponse.steps.forEach((step, i) => {
            text += `${i + 1}. ${step}\n`;
        });
    }

    // ── 🚕 TRAVEL OPTIONS ──
    if (jennyResponse.ride_estimates) {
        const re = jennyResponse.ride_estimates;
        text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🚕 *Travel Options to ${re.destination_name}:*\n`;
        text += `🚶 Walk: ~${re.walk.time_mins} mins (Free)\n`;
        text += `🏍️ Rapido Bike: ~${re.bike.time_mins} mins (₹${re.bike.cost})\n`;
        text += `🚗 Ola/Uber Cab: ~${re.cab.time_mins} mins (₹${re.cab.cost})\n`;
        text += `🚌 Bus: ~${re.bus.time_mins} mins (₹${re.bus.cost})`;

        const dropLat = re.drop_lat || '';
        const dropLng = re.drop_lng || '';

        if (dropLat && dropLng) {
            text += `\n\n🚗 *Book Ola:* https://book.olacabs.com/?drop_lat=${dropLat}&drop_lng=${dropLng}`;
            text += `\n🚕 *Book Uber:* https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${dropLat}&dropoff[longitude]=${dropLng}`;
            text += `\n🏍️ *Book Rapido:* https://www.rapido.bike/`;
            text += `\n🗺️ *Google Maps:* https://www.google.com/maps/dir/?api=1&destination=${dropLat},${dropLng}`;
        }
    }

    // ── 📍 NEARBY PLACES (Navigate buttons) ──
    if (jennyResponse.type === 'action_response' && jennyResponse.data && jennyResponse.data.length > 0) {
        text += `\n\n━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📍 *Nearby Help:*\n`;
        jennyResponse.data.slice(0, 3).forEach((place, i) => {
            text += `\n${i + 1}. *${place.name}*`;
            if (place.address) text += `\n   ${place.address}`;
            if (place.distance) text += ` (${place.distance}m away)`;
            text += `\n   🗺️ Navigate: https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}\n`;
        });
    }

    // ── 📲 WHATSAPP FAMILY UPDATE ──
    if (jennyResponse.whatsapp_draft) {
        const encodedDraft = encodeURIComponent(jennyResponse.whatsapp_draft);
        text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `📲 *Update Family (WhatsApp):*\n`;
        text += `_"${jennyResponse.whatsapp_draft}"_\n`;
        text += `\n👉 Tap to send: https://wa.me/?text=${encodedDraft}`;
    }

    // ── 🆘 EMERGENCY ──
    text += `\n\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🆘 *Emergency Helplines:*\n`;
    text += `📞 Emergency: *112*\n`;
    text += `🚔 Police: *100*\n`;
    text += `🚑 Ambulance: *108*\n`;
    text += `👩 Women Helpline: *1091*`;

    // ── ✅ SATISFACTION CHECK ──
    if (jennyResponse.askSatisfaction) {
        text += `\n\n━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `❓ *Are you satisfied with this help?*\n`;
        text += `Reply *1* for ✅ Satisfied\n`;
        text += `Reply *2* for 🔄 Need More Help`;
    }

    // ── SESSION END ──
    if (jennyResponse.type === 'session_end') {
        text += `\n\n💙 Session ended. Send *hi* anytime you need help again.`;
    }

    return text;
}

/**
 * Split a long message into chunks at line breaks
 */
function splitMessage(text, maxLen) {
    if (text.length <= maxLen) return [text];
    
    const chunks = [];
    let remaining = text;
    
    while (remaining.length > maxLen) {
        let splitIndex = remaining.lastIndexOf('\n', maxLen);
        if (splitIndex === -1 || splitIndex < maxLen * 0.5) {
            splitIndex = maxLen;
        }
        chunks.push(remaining.substring(0, splitIndex));
        remaining = remaining.substring(splitIndex).trimStart();
    }
    
    if (remaining.length > 0) {
        chunks.push(remaining);
    }
    
    return chunks;
}

module.exports = { processWhatsAppMessage };
