// =============================================
// MEMORY STORE — In-Memory Session Manager
// =============================================
// Stores conversation history per session.
// Sessions expire after SESSION_TTL_MINUTES.

const sessions = new Map();
const TTL_MS = (parseInt(process.env.SESSION_TTL_MINUTES) || 30) * 60 * 1000;

/**
 * Get or create a session.
 * @param {string} sessionId
 * @returns {object} session object
 */
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      messages: [],         // Full conversation history
      context: {            // Extracted structured context
        location: null,
        destination: null,
        urgency: null,
        money: null,
        battery: null,
        riskLevel: null,
        situationSummary: null,
      },
    });
  }
  const session = sessions.get(sessionId);
  session.lastActiveAt = Date.now();
  return session;
}

/**
 * Add a message to session history.
 * @param {string} sessionId
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
function addMessage(sessionId, role, content) {
  const session = getSession(sessionId);
  session.messages.push({ role, content });

  // Keep last 20 messages to avoid token overflow
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }
}

/**
 * Update structured context extracted from conversation.
 * @param {string} sessionId
 * @param {object} contextUpdate
 */
function updateContext(sessionId, contextUpdate) {
  const session = getSession(sessionId);
  session.context = { ...session.context, ...contextUpdate };
}

/**
 * Get conversation history formatted for Gemini.
 * @param {string} sessionId
 * @returns {Array} messages array
 */
function getHistory(sessionId) {
  const session = getSession(sessionId);
  return session.messages;
}

/**
 * Get extracted context for a session.
 * @param {string} sessionId
 * @returns {object} context
 */
function getContext(sessionId) {
  const session = getSession(sessionId);
  return session.context;
}

/**
 * Cleanup expired sessions (run periodically).
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActiveAt > TTL_MS) {
      sessions.delete(id);
    }
  }
}

// Auto-cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

module.exports = { getSession, addMessage, updateContext, getHistory, getContext };
