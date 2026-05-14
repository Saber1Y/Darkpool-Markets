import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

const EncryptSchema = z.object({
  sideYes: z.boolean(),
  amount: z.number().min(0),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const HARDHAT_RPC = process.env.HARDHAT_RPC_URL ?? "http://127.0.0.1:8545";
const CHAIN_ID = 31337;

async function rpcCall(method: string, params: unknown[]): Promise<any> {
  const r = await fetch(HARDHAT_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  const j = await r.json() as any;
  if (j.error) throw new Error(`RPC error: ${j.error.message}`);
  return j.result;
}

router.post("/encrypt-bet", async (req: Request, res: Response) => {
  try {
    const { sideYes, amount, userAddress, contractAddress } = EncryptSchema.parse(req.body);

    const rawAmount = BigInt(Math.round(amount * 1000));

    const fheTypes = [0, 4];
    const fhevmTypes = [0, 4];
    const rand1 = crypto.randomBytes(32);
    const rand2 = crypto.randomBytes(32);

    const metadata = await rpcCall("fhevm_relayer_metadata", []);
    const aclContractAddress: string = metadata.ACLAddress;

    const mockPayload = {
      contractAddress,
      userAddress,
      ciphertextWithInputVerification: "0x" + crypto.randomBytes(32).toString("hex"),
      contractChainId: "0x" + CHAIN_ID.toString(16),
      extraData: "0x00",
      mockData: {
        clearTextValuesBigIntHex: [
          "0x" + (sideYes ? "1" : "0"),
          "0x" + rawAmount.toString(16)
        ],
        metadatas: [
          { blockNumber: 0, index: 0, transactionHash: "0x" + "0".repeat(64) },
          { blockNumber: 0, index: 0, transactionHash: "0x" + "0".repeat(64) }
        ],
        fheTypes,
        fhevmTypes,
        aclContractAddress,
        random32List: [
          "0x" + Buffer.from(rand1).toString("hex"),
          "0x" + Buffer.from(rand2).toString("hex")
        ]
      }
    };

    const result = await rpcCall("fhevm_relayer_v1_input_proof", [mockPayload]);
    const handles: string[] = result.handles;
    const signatures: string[] = result.signatures;

    const numHandles = handles.length;
    const numSigners = signatures.length;
    let inputProofHex = "0x" +
      numHandles.toString(16).padStart(2, "0") +
      numSigners.toString(16).padStart(2, "0");

    for (const handle of handles) {
      inputProofHex += handle.padStart(64, "0");
    }
    for (const sig of signatures) {
      inputProofHex += sig.padStart(130, "0");
    }
    inputProofHex += "00";

    res.json({
      encryptedSide: ("0x" + handles[0]) as `0x${string}`,
      encryptedAmount: ("0x" + handles[1]) as `0x${string}`,
      proof: inputProofHex as `0x${string}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Encryption failed";
    console.error("[encrypt] Error:", message);
    res.status(400).json({ error: message });
  }
});

export default router;
