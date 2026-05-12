import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

const EncryptSchema = z.object({
  sideYes: z.boolean(),
  amount: z.number().min(0)
});

/**
 * Generate mock encrypted handles for local Hardhat testing.
 * The fhEVM Hardhat plugin uses mock encryption, so the contract
 * accepts any properly formatted encrypted handles + proof.
 */
function generateHandle(value: number): string {
  const buf = Buffer.alloc(32);
  buf.writeUInt32LE(value, 0);
  // Randomize remaining bytes
  const random = crypto.randomBytes(28);
  random.copy(buf, 4);
  return `0x${buf.toString("hex")}`;
}

function generateProof(): string {
  return `0x${crypto.randomBytes(64).toString("hex")}`;
}

router.post("/encrypt-bet", async (req: Request, res: Response) => {
  try {
    const { sideYes, amount } = EncryptSchema.parse(req.body);

    const result = {
      encryptedSide: generateHandle(sideYes ? 1 : 0),
      encryptedAmount: generateHandle(amount),
      proof: generateProof()
    };

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Encryption failed";
    console.error("[encrypt] Error:", message);
    res.status(400).json({ error: message });
  }
});

export default router;
