import { Router, Request, Response } from "express";
import { z } from "zod";
import { suggestResolution } from "../services/ai-resolver";

const router = Router();

const ResolveSuggestionSchema = z.object({
  question: z.string().min(1)
});

router.post("/suggest-resolution", async (req: Request, res: Response) => {
  try {
    const { question } = ResolveSuggestionSchema.parse(req.body);
    const suggestion = await suggestResolution(question);
    res.json(suggestion);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI resolution failed";
    console.error("[ai-resolve] Error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
