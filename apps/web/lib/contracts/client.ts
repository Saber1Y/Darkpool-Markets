import { createPublicClient, http, isAddress, type PublicClient } from "viem";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getChainId(): number {
  const parsed = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
  return Number.isFinite(parsed) ? parsed : 31337;
}

function isLocalRpcUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

export function getRpcUrl(): string {
  const fallback = getChainId() === 11155111
    ? "https://ethereum-sepolia-rpc.publicnode.com"
    : "http://127.0.0.1:8545";
  return process.env.NEXT_PUBLIC_RPC_URL ?? fallback;
}

export function getFactoryAddress(): `0x${string}` {
  const address = requireEnv("NEXT_PUBLIC_FACTORY_ADDRESS");
  if (!isAddress(address)) {
    throw new Error(`Invalid NEXT_PUBLIC_FACTORY_ADDRESS: ${address}`);
  }
  return address;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

export function getRpcCandidates(): string[] {
  const configured = getRpcUrl();
  const localCandidates = unique([
    configured,
    configured.replace("127.0.0.1", "localhost"),
    "http://127.0.0.1:8545",
    "http://localhost:8545"
  ]);

  if (getChainId() === 31337 || isLocalRpcUrl(configured)) {
    return localCandidates;
  }

  return unique([configured]);
}

export const publicClients: PublicClient[] = getRpcCandidates().map((url) =>
  createPublicClient({
    transport: http(url, { timeout: 2_500 })
  })
);
