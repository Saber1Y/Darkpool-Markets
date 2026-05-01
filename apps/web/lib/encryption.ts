"use client";

import { createInstance } from "@zama-fhe/sdk";

type FheInstance = Awaited<ReturnType<typeof createInstance>>;

let instance: FheInstance | null = null;

export async function getFheInstance(): Promise<FheInstance> {
  if (instance) return instance;

  instance = await createInstance({
    network: "localhost"
  });

  return instance;
}

/**
 * Encrypt a boolean (true = YES, false = NO) for the prediction market
 */
export async function encryptBool(value: boolean): Promise<{ handle: Uint8Array; inputProof: Uint8Array }> {
  const fhe = await getFheInstance();
  const encrypted = fhe.encrypt_bool(value);
  return {
    handle: encrypted.handle,
    inputProof: encrypted.inputProof
  };
}

/**
 * Encrypt a uint32 amount for the prediction market
 */
export async function encryptUint32(value: number): Promise<{ handle: Uint8Array; inputProof: Uint8Array }> {
  const fhe = await getFheInstance();
  const encrypted = fhe.encrypt_uin32(value);
  return {
    handle: encrypted.handle,
    inputProof: encrypted.inputProof
  };
}

/**
 * Convert encrypted data to hex string for contract interaction
 */
export function toHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Prepare bet arguments for the contract
 */
export async function prepareBetArgs(
  sideYes: boolean,
  amountWei: bigint
): Promise<{
  encryptedSide: `0x${string}`;
  encryptedAmount: `0x${string}`;
  proof: `0x${string}`;
}> {
  const [sideResult, amountResult] = await Promise.all([encryptBool(sideYes), encryptUint32(Number(amountWei))]);

  return {
    encryptedSide: toHex(sideResult.handle),
    encryptedAmount: toHex(amountResult.handle),
    proof: toHex(mergeProofs(sideResult.inputProof, amountResult.inputProof))
  };
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
