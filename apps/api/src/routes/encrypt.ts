import { Router, Request, Response } from "express";
import { z } from "zod";

const router = Router();

const EncryptSchema = z.object({
  sideYes: z.boolean(),
  amount: z.number().min(0)
});

function padHex(value: string, bytes: number): string {
  return value.padStart(bytes * 2, "0");
}

router.post("/encrypt-bet", async (req: Request, res: Response) => {
  try {
    const { sideYes, amount } = EncryptSchema.parse(req.body);

    const encryptedSide = `0x${sideYes ? "01" : "00"}${"0".repeat(62)}`;
    const encryptedAmount = `0x${padHex(amount.toString(16), 32)}`;
    const proof = `0x${"00".repeat(64)}`;

    res.json({ encryptedSide, encryptedAmount, proof });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Encryption failed";
    console.error("[encrypt] Error:", message);
    res.status(400).json({ error: message });
  }
});

export default router;
