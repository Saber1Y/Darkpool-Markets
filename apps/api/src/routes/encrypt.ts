import { Router, Request, Response } from "express";
import { zod } from "zod";
import { createInstance } from "@zama-fhe/sdk";

const router = Router();

const EncryptSchema = zod.object({
  sideYes: zod.boolean(),
  amount: zod.number().min(0)
});

type EncryptRequest = zod.infer<typeof EncryptSchema>;

let fheInstance: Awaited<ReturnType<typeof createInstance>> | null = null;

async function getFheInstance() {
  if (fheInstance) return fheInstance;

  fheInstance = await createInstance({
    network: "localhost"
  });

  return fheInstance;
}

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

    const fhe = await getFheInstance();

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
    res.status(400).json({
      error: error instanceof Error ? error.message : "Encryption failed"
    });
  }
});

export default router;