import { createPublicClient, http, isAddress, type PublicClient } from "viem";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";
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
  return unique([configured, configured.replace("127.0.0.1", "localhost"), "http://127.0.0.1:8545", "http://localhost:8545"]);
}

export const publicClients: PublicClient[] = getRpcCandidates().map((url) =>
  createPublicClient({
    transport: http(url, { timeout: 2_500 })
  })
);
