import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jennyRoutes from "./routes/jenny.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "Jenny is online", agents: 8 });
});

// Jenny API routes
app.use("/api/jenny", jennyRoutes);

app.listen(PORT, () => {
  console.log(`\n🧭 Jenny backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API:    http://localhost:${PORT}/api/jenny/analyze\n`);
});
