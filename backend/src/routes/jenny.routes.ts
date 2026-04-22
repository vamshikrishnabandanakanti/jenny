import { Router, Request, Response } from "express";
import { runJennyOrchestrator } from "../orchestrator/jenny.orchestrator";
import { JennyRequest } from "../types/jenny.types";

const router = Router();

router.post("/analyze", async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    const { message, sessionId } = req.body as JennyRequest;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({
        error: "Missing or invalid 'message' field. Please provide a non-empty string.",
      });
      return;
    }

    console.log(
      `[Route] Incoming request | session=${sessionId || "anonymous"} | message="${message.substring(0, 80)}..."`
    );

    const jennyResponse = await runJennyOrchestrator(message.trim());

    const elapsed = Date.now() - startTime;
    console.log(`[Route] Response sent in ${elapsed}ms`);

    res.json(jennyResponse);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[Route] Error after ${elapsed}ms:`, error);

    res.status(500).json({
      error: "Jenny encountered an internal error. Please try again.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
