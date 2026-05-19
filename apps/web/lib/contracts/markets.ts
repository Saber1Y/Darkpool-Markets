import type { PublicClient } from "viem";
import { getChainId, getFactoryAddress, getRpcCandidates, publicClients } from "./client";
import { marketFactoryAbi, predictionMarketAbi } from "./abi";

type RawMarketRecord = {
  marketId: bigint;
  creator: `0x${string}`;
  marketAddress: `0x${string}`;
  question: string;
  metadataURI: string;
  deadline: bigint;
  createdAt: bigint;
};

type RawMarketState = {
  status: bigint;
  participantCount: bigint;
  confidenceYesBps: bigint;
  confidenceDeltaBps24h: bigint;
  signalStrength: bigint;
  outcomeSet: boolean;
  resolvedOutcome: boolean;
};

export type MarketView = RawMarketRecord &
  RawMarketState & {
    confidenceYesPct: number;
  };

const MARKET_STATUS_LABEL: Record<number, string> = {
  0: "ACTIVE",
  1: "CLOSED",
  2: "RESOLVED",
  3: "CANCELLED"
};

const SIGNAL_STRENGTH_LABEL: Record<number, string> = {
  0: "LOW",
  1: "MEDIUM",
  2: "HIGH"
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown RPC error";
}

async function readWithRpcFallback<T>(action: (client: PublicClient) => Promise<T>): Promise<T> {
  const endpoints = getRpcCandidates();
  const reasons: string[] = [];

  for (let i = 0; i < publicClients.length; i++) {
    try {
      return await action(publicClients[i]);
    } catch (error) {
      reasons.push(`${endpoints[i] ?? "unknown"}: ${toErrorMessage(error)}`);
    }
  }

  throw new Error(
    [
      "Unable to reach the configured RPC or read contract data.",
      getChainId() === 31337
        ? "Start/keep your Hardhat node running, then redeploy and update NEXT_PUBLIC_FACTORY_ADDRESS if needed."
        : "Check NEXT_PUBLIC_RPC_URL and NEXT_PUBLIC_FACTORY_ADDRESS for your current network.",
      `Tried endpoints: ${endpoints.join(", ")}`,
      `Errors: ${reasons.join(" | ")}`
    ].join(" ")
  );
}

async function assertFactoryExists(factoryAddress: `0x${string}`): Promise<void> {
  const code = await readWithRpcFallback((client) => client.getCode({ address: factoryAddress }));
  if (!code || code === "0x") {
    throw new Error(
      `No contract code found at NEXT_PUBLIC_FACTORY_ADDRESS (${factoryAddress}). Redeploy contracts and update apps/web/.env.local.`
    );
  }
}

export function statusLabel(value: bigint): string {
  return MARKET_STATUS_LABEL[Number(value)] ?? `UNKNOWN(${value.toString()})`;
}

export function signalLabel(value: bigint): string {
  return SIGNAL_STRENGTH_LABEL[Number(value)] ?? `UNKNOWN(${value.toString()})`;
}

async function readMarketState(marketAddress: `0x${string}`): Promise<RawMarketState> {
  const toBigInt = (value: bigint | number) => (typeof value === "bigint" ? value : BigInt(value));

  const [status, participantCount, confidenceYesBps, confidenceDeltaBps24h, signalStrength, outcomeSet, resolvedOutcome] =
    await Promise.all([
      readWithRpcFallback((client) =>
        client.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "status" })
      ),
      readWithRpcFallback((client) =>
        client.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "participantCount" })
      ),
      readWithRpcFallback((client) =>
        client.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "confidenceYesBps" })
      ),
      readWithRpcFallback((client) =>
        client.readContract({
        address: marketAddress,
        abi: predictionMarketAbi,
        functionName: "confidenceDeltaBps24h"
      })
      ),
      readWithRpcFallback((client) =>
        client.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "signalStrength" })
      ),
      readWithRpcFallback((client) =>
        client.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "outcomeSet" })
      ),
      readWithRpcFallback((client) =>
        client.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "resolvedOutcome" })
      )
    ]);

  return {
    status: toBigInt(status),
    participantCount: toBigInt(participantCount),
    confidenceYesBps: toBigInt(confidenceYesBps),
    confidenceDeltaBps24h: toBigInt(confidenceDeltaBps24h),
    signalStrength: toBigInt(signalStrength),
    outcomeSet,
    resolvedOutcome
  };
}

function toView(record: RawMarketRecord, state: RawMarketState): MarketView {
  return {
    ...record,
    ...state,
    confidenceYesPct: Number(state.confidenceYesBps) / 100
  };
}

export async function getMarkets(offset = 0n, limit = 20n): Promise<MarketView[]> {
  const factoryAddress = getFactoryAddress();
  console.log("[getMarkets] Factory address:", factoryAddress);
  await assertFactoryExists(factoryAddress);

  const markets = (await readWithRpcFallback((client) =>
    client.readContract({
      address: factoryAddress,
      abi: marketFactoryAbi,
      functionName: "listMarkets",
      args: [offset, limit]
    })
  )) as RawMarketRecord[];

  console.log("[getMarkets] Raw markets:", markets);

  const states = await Promise.all(markets.map((m) => readMarketState(m.marketAddress)));
  const result = markets.map((m, i) => toView(m, states[i]));
  console.log("[getMarkets] Processed markets:", result);
  return result;
}

export async function getMarketById(marketId: bigint): Promise<MarketView | null> {
  const factoryAddress = getFactoryAddress();
  console.log("[getMarketById] Looking up marketId:", marketId.toString());
  try {
    await assertFactoryExists(factoryAddress);
    const market = (await readWithRpcFallback((client) =>
      client.readContract({
        address: factoryAddress,
        abi: marketFactoryAbi,
        functionName: "getMarket",
        args: [marketId]
      })
    )) as RawMarketRecord;

    console.log("[getMarketById] Found market:", market);
    const state = await readMarketState(market.marketAddress);
    const result = toView(market, state);
    console.log("[getMarketById] Processed market:", result);
    return result;
  } catch (error) {
    console.error("[getMarketById] Error:", error);
    return null;
  }
}
