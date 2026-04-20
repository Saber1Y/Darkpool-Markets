import { createPublicClient, http, isAddress } from "viem";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getRpcUrl(): string {
  return requireEnv("NEXT_PUBLIC_RPC_URL");
}

export function getFactoryAddress(): `0x${string}` {
  const address = requireEnv("NEXT_PUBLIC_FACTORY_ADDRESS");
  if (!isAddress(address)) {
    throw new Error(`Invalid NEXT_PUBLIC_FACTORY_ADDRESS: ${address}`);
  }
  return address;
}

export const publicClient = createPublicClient({
  transport: http(getRpcUrl())
});
