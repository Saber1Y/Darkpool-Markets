import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import {
  SepoliaConfig,
  createInstance,
  type Auth,
  type FhevmInstance
} from "@zama-fhe/relayer-sdk/node";

const router = Router();

const EncryptSchema = z.object({
  sideYes: z.boolean(),
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const DecryptSchema = z.object({
  handles: z.array(z.string().regex(/^0x[a-fA-F0-9]{64}$/))
});

const HARDHAT_RPC = process.env.HARDHAT_RPC_URL ?? "http://127.0.0.1:8545";
const SEPOLIA_RPC_URL =
  process.env.FHEVM_RPC_URL ??
  process.env.SEPOLIA_RPC_URL ??
  process.env.ZAMA_TESTNET_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";
const CHAIN_ID = 31337;

type EncryptionMode = "local" | "sepolia";

function getEncryptionMode(): EncryptionMode {
  const configured = process.env.FHEVM_ENCRYPTION_MODE?.trim().toLowerCase();
  if (configured === "local" || configured === "sepolia") {
    return configured;
  }
  if (process.env.FHEVM_RPC_URL || process.env.SEPOLIA_RPC_URL || process.env.ZAMA_TESTNET_RPC_URL) {
    return "sepolia";
  }
  return "local";
}

function bytesToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

function getRelayerAuth(): Auth | undefined {
  const relayerApiKey =
    process.env.ZAMA_FHEVM_API_KEY ??
    process.env.FHEVM_RELAYER_API_KEY ??
    process.env.FHEVM_API_KEY;

  if (!relayerApiKey || relayerApiKey.trim().length === 0) {
    return undefined;
  }

  return {
    __type: "ApiKeyHeader",
    value: relayerApiKey
  };
}

let cachedSepoliaInstance: Promise<FhevmInstance> | null = null;

function getSepoliaInstance(): Promise<FhevmInstance> {
  if (!cachedSepoliaInstance) {
    cachedSepoliaInstance = createInstance({
      ...SepoliaConfig,
      network: SEPOLIA_RPC_URL,
      auth: getRelayerAuth()
    });
  }
  return cachedSepoliaInstance!;
}

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

async function encryptLocal(sideYes: boolean, userAddress: string, contractAddress: string) {
  const fheTypes = [0];
  const fhevmTypes = [0];
  const rand1 = crypto.randomBytes(32);

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
        "0x" + (sideYes ? "1" : "0")
      ],
      metadatas: [
        { blockNumber: 0, index: 0, transactionHash: "0x" + "0".repeat(64) }
      ],
      fheTypes,
      fhevmTypes,
      aclContractAddress,
      random32List: [
        "0x" + Buffer.from(rand1).toString("hex")
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

  return {
    encryptedSide: ("0x" + handles[0]) as `0x${string}`,
    proof: inputProofHex as `0x${string}`
  };
}

async function encryptSepolia(sideYes: boolean, userAddress: string, contractAddress: string) {
  const instance = await getSepoliaInstance();
  const encryptedInput = instance.createEncryptedInput(contractAddress, userAddress);
  encryptedInput.addBool(sideYes);
  const { handles, inputProof } = await encryptedInput.encrypt();
  const firstHandle = handles[0];

  if (!firstHandle) {
    throw new Error("Relayer encryption returned no handles");
  }

  return {
    encryptedSide: bytesToHex(firstHandle),
    proof: bytesToHex(inputProof)
  };
}

router.post("/encrypt-bet", async (req: Request, res: Response) => {
  try {
    const { sideYes, userAddress, contractAddress } = EncryptSchema.parse(req.body);
    const mode = getEncryptionMode();
    const payload =
      mode === "sepolia"
        ? await encryptSepolia(sideYes, userAddress, contractAddress)
        : await encryptLocal(sideYes, userAddress, contractAddress);

    res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Encryption failed";
    console.error("[encrypt] Error:", message);
    res.status(400).json({ error: message });
  }
});

router.post("/decrypt", async (req: Request, res: Response) => {
  try {
    const allowInsecureDecrypt = process.env.ENABLE_INSECURE_DECRYPT === "true";
    if (!allowInsecureDecrypt) {
      const configuredToken = process.env.DECRYPT_API_TOKEN;
      const providedToken = req.header("x-decrypt-token");
      if (!configuredToken || providedToken !== configuredToken) {
        res.status(403).json({
          error: "Decrypt endpoint disabled. Set ENABLE_INSECURE_DECRYPT=true for local debug or provide valid x-decrypt-token."
        });
        return;
      }
    }

    if (getEncryptionMode() !== "local") {
      res.status(400).json({
        error: "Decrypt endpoint only supports local mode via fhevm_getClearText. Use user-decryption flow for Sepolia."
      });
      return;
    }

    const { handles } = DecryptSchema.parse(req.body);
    const result = await rpcCall("fhevm_getClearText", [handles]);
    res.json({ values: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decryption failed";
    console.error("[decrypt] Error:", message);
    res.status(400).json({ error: message });
  }
});

export default router;
