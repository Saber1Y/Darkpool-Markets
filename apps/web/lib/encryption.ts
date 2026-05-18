"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Call the API to encrypt bet data using fhEVM
 */
export async function prepareBetArgs(
  sideYes: boolean,
  userAddress: `0x${string}`,
  contractAddress: `0x${string}`
): Promise<{
  encryptedSide: `0x${string}`;
  proof: `0x${string}`;
}> {
  const response = await fetch(`${API_BASE}/api/encrypt-bet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sideYes,
      userAddress,
      contractAddress
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Encryption failed");
  }

  const data = await response.json();
  return {
    encryptedSide: data.encryptedSide,
    proof: data.proof
  };
}
