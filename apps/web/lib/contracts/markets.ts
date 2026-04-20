import { getFactoryAddress, publicClient } from "./client";
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
      publicClient.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "status" }),
      publicClient.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "participantCount" }),
      publicClient.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "confidenceYesBps" }),
      publicClient.readContract({
        address: marketAddress,
        abi: predictionMarketAbi,
        functionName: "confidenceDeltaBps24h"
      }),
      publicClient.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "signalStrength" }),
      publicClient.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "outcomeSet" }),
      publicClient.readContract({ address: marketAddress, abi: predictionMarketAbi, functionName: "resolvedOutcome" })
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
  const markets = (await publicClient.readContract({
    address: factoryAddress,
    abi: marketFactoryAbi,
    functionName: "listMarkets",
    args: [offset, limit]
  })) as RawMarketRecord[];

  const states = await Promise.all(markets.map((m) => readMarketState(m.marketAddress)));
  return markets.map((m, i) => toView(m, states[i]));
}

export async function getMarketById(marketId: bigint): Promise<MarketView | null> {
  const factoryAddress = getFactoryAddress();
  try {
    const market = (await publicClient.readContract({
      address: factoryAddress,
      abi: marketFactoryAbi,
      functionName: "getMarket",
      args: [marketId]
    })) as RawMarketRecord;

    const state = await readMarketState(market.marketAddress);
    return toView(market, state);
  } catch {
    return null;
  }
}
