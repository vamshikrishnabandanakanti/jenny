const { Telegraf, Markup } = require('telegraf');
const { handlePanicSituation } = require('../agent/humanAgent');
const { addMessage, getHistory, updateContext, getContext } = require('../memory/sessionStore');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Start command
bot.start((ctx) => {
    ctx.reply(
        "🚨 *Hello, I am Jenny.* Your multi-agent emergency response assistant.\n\n" +
        "I am here to help you out of any panic or crisis situation. " +
        "Please tell me what's happening, or share your location if you need immediate physical help.\n\n" +
        "💡 *Tip:* Use the button below to share location. If it doesn't work, use the 📎 icon > Location.",
        {
            parse_mode: 'Markdown',
            ...Markup.keyboard([
                [Markup.button.locationRequest('📍 Share My Location')]
            ]).resize().oneTime()
        }
    );
});

// Handle Location
bot.on('location', async (ctx) => {
    console.log(`[Telegram Bot] Location received from ${ctx.from.username || ctx.from.id}`);
    const sessionId = `tg_${ctx.chat.id}`;
    const location = {
        lat: ctx.message.location.latitude,
        lng: ctx.message.location.longitude
    };

    // Store location in session context
    updateContext(sessionId, { location });

    // Respond immediately to location receipt
    await processMessage(ctx, "I have shared my location. Please find nearby help based on my coordinates.", location);
});

// Handle Text Messages
bot.on('text', async (ctx) => {
    const sessionId = `tg_${ctx.chat.id}`;
    const context = getContext(sessionId);
    const location = context.location;

    await processMessage(ctx, ctx.message.text, location);
});

/**
 * Main message processing logic
 */
async function processMessage(ctx, userMessage, location) {
    const sessionId = `tg_${ctx.chat.id}`;
    
    try {
        // Show typing status
        await ctx.sendChatAction('typing');

        const history = getHistory(sessionId);
        
        // Call Jenny's Multi-Agent logic
        const jennyResponse = await handlePanicSituation(userMessage, location, 1, history);

        // Update history
        addMessage(sessionId, 'user', userMessage);
        addMessage(sessionId, 'assistant', jennyResponse.message);

        // ── LOCATION REQUEST: Show a button instead of plain text ──
        if (jennyResponse.type === 'request_location') {
            // Strip the plain-text location prompt from the message
            const cleanMessage = jennyResponse.message
                .replace(/\n\nCan you allow location access.*$/s, '')
                .trim();

            await ctx.reply(
                cleanMessage + '\n\n📍 *Please share your location using the button below so I can find help nearby:*',
                {
                    parse_mode: 'Markdown',
                    ...Markup.keyboard([
                        [Markup.button.locationRequest('📍 Share My Location')]
                    ]).resize().oneTime()
                }
            );
            return;
        }

        // Prepare response text
        let responseText = jennyResponse.message;

        // ── STEP-BY-STEP PLAN ──
        if (jennyResponse.steps && jennyResponse.steps.length > 0) {
            responseText += '\n\n📋 *Recovery Plan:*';
            jennyResponse.steps.forEach((step, i) => {
                responseText += `\n${i + 1}. ${step}`;
            });
        }

        // ── TRAVEL OPTIONS ──
        if (jennyResponse.ride_estimates) {
            const re = jennyResponse.ride_estimates;
            responseText += `\n\n🚕 *Travel Options to ${re.destination_name}:*\n` +
                `🚶 Walk: ~${re.walk.time_mins} mins (Free)\n` +
                `🏍️ Rapido Bike: ~${re.bike.time_mins} mins (₹${re.bike.cost})\n` +
                `🚗 Ola/Uber Cab: ~${re.cab.time_mins} mins (₹${re.cab.cost})\n` +
                `🚌 Bus: ~${re.bus.time_mins} mins (₹${re.bus.cost})`;
        }

        // ── INLINE BUTTONS ──
        const buttons = [];

        // Booking buttons when travel is relevant
        if (jennyResponse.ride_estimates) {
            const re = jennyResponse.ride_estimates;
            const dropLat = re.drop_lat || '';
            const dropLng = re.drop_lng || '';

            buttons.push([
                Markup.button.url('🚗 Book Ola', `https://book.olacabs.com/?drop_lat=${dropLat}&drop_lng=${dropLng}`),
                Markup.button.url('🚕 Book Uber', `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${dropLat}&dropoff[longitude]=${dropLng}`)
            ]);
            buttons.push([
                Markup.button.url('🏍️ Book Rapido', `https://www.rapido.bike/`),
                Markup.button.url('🗺️ Google Maps', `https://www.google.com/maps/dir/?api=1&destination=${dropLat},${dropLng}`)
            ]);
        }

        // Navigate to nearest place (police, hospital, etc.)
        if (jennyResponse.type === 'action_response' && jennyResponse.data && jennyResponse.data.length > 0) {
            const nearest = jennyResponse.data[0];
            const placeLabel = nearest.type ? nearest.type.charAt(0).toUpperCase() + nearest.type.slice(1) : 'Place';
            buttons.push([
                Markup.button.url(`📍 Navigate to ${nearest.name}`, `https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lng}`)
            ]);

            // Show second nearest if available
            if (jennyResponse.data.length > 1) {
                const second = jennyResponse.data[1];
                buttons.push([
                    Markup.button.url(`📍 Alternative: ${second.name}`, `https://www.google.com/maps/dir/?api=1&destination=${second.lat},${second.lng}`)
                ]);
            }
        }

        // WhatsApp update for family
        if (jennyResponse.whatsapp_draft) {
            const encodedDraft = encodeURIComponent(jennyResponse.whatsapp_draft);
            buttons.push([Markup.button.url('📲 Update Family (WhatsApp)', `https://wa.me/?text=${encodedDraft}`)]);
        }

        // Emergency helpline info (Telegram doesn't support tel: URLs)
        buttons.push([Markup.button.url('📞 Emergency: Dial 112', 'https://www.google.com/search?q=emergency+helpline+112+India')]);

        // Send the response
        await ctx.replyWithMarkdown(responseText, Markup.inlineKeyboard(buttons));

    } catch (error) {
        console.error('[Telegram Bot] Error:', error);
        ctx.reply("I'm sorry, I'm having trouble processing your request right now. Please stay calm, help is still on the way.");
    }
}

/**
 * Initialize the bot
 */
function initTelegramBot(app) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const backendUrl = process.env.BACKEND_URL;

    if (!token || token === 'your_telegram_bot_token_here') {
        console.warn('[Telegram Bot] Token not configured. Bot will not start.');
        return;
    }

    if (backendUrl && backendUrl.startsWith('http')) {
        // WEBHOOK MODE (Best for production/Render)
        // We use a secret path to prevent unauthorized POST requests to the webhook
        const secretPath = `/telegraf-webhook-${token.slice(-10)}`;
        
        // Register the middleware with the express app
        app.use(bot.webhookCallback(secretPath));
        
        // Tell Telegram to send updates to this URL
        bot.telegram.setWebhook(`${backendUrl}${secretPath}`)
            .then(() => {
                console.log(`✅ Jenny Telegram Bot is running via Webhook: ${backendUrl}${secretPath}`);
            })
            .catch(err => {
                console.error('❌ Failed to set Telegram Webhook:', err);
            });
    } else {
        // POLLING MODE (Best for local development)
        bot.launch().then(() => {
            console.log('✅ Jenny Telegram Bot is running via Polling...');
        }).catch(err => {
            console.error('❌ Failed to launch Telegram Bot (Polling):', err);
        });
    }

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { initTelegramBot };
