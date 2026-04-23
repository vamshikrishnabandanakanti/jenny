// =============================================
// JENNY BACKEND — Main Server Entry Point
// =============================================

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const apiRoutes  = require("./routes/api");
const actionChatRoutes = require("./routes/chat");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────

// CORS — allow frontend origin
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// JSON body parser
app.use(express.json({ limit: "10kb" }));

// Request logging
app.use(morgan("dev"));

// Rate limiting — prevents abuse
const limiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute window
  max: 30,                     // Max 30 requests per minute per IP
  message: {
    error: "Too many requests. Please slow down and try again in a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

app.use("/api", apiRoutes);
app.use("/api/v2/chat", actionChatRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Jenny AI Backend",
    version: "1.0.0",
    status: "running",
    docs: "POST /api/chat with { message, sessionId }",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.stack);
  res.status(500).json({ error: "Internal server error. Jenny is having trouble." });
});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║        JENNY AI BACKEND              ║
║        Running on port ${PORT}          ║
╚══════════════════════════════════════╝
  Model  : ${process.env.GEMINI_MODEL || "gemini-1.5-flash (default)"}
  AI     : Google Gemini (Free Tier)
  Mode   : ${process.env.NODE_ENV || "development"}

  Endpoints:
  → POST http://localhost:${PORT}/api/chat
  → POST http://localhost:${PORT}/api/analyze
  → GET  http://localhost:${PORT}/api/health
  `);
});

module.exports = app;
