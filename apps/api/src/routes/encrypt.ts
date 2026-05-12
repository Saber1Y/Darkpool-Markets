import { Router, Request, Response } from "express";
import { z } from "zod";

const router = Router();

const EncryptSchema = z.object({
  sideYes: z.boolean(),
  amount: z.number().min(0)
});

function toHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function mergeProofs(...proofs: Uint8Array[]): Uint8Array {
  const totalLength = proofs.reduce((sum, p) => sum + p.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const proof of proofs) {
    merged.set(proof, offset);
    offset += proof.length;
  }
  return merged;
}

router.post("/encrypt-bet", async (req: Request, res: Response) => {
  try {
    const { sideYes, amount } = EncryptSchema.parse(req.body);

    const { createInstance } = await import("@zama-fhe/sdk");
    const fhe = await createInstance({ network: "localhost" });

    const [sideResult, amountResult] = await Promise.all([
      fhe.encrypt_bool(sideYes),
      fhe.encrypt_uin32(amount)
    ]);

    const result = {
      encryptedSide: toHex(sideResult.handle),
      encryptedAmount: toHex(amountResult.handle),
      proof: toHex(mergeProofs(sideResult.inputProof, amountResult.inputProof))
    };

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Encryption failed";
    console.error("[encrypt] Error:", message);
    res.status(400).json({ error: message });
  }
});

export default router;
