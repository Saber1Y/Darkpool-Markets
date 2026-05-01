"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { predictionMarketAbi } from "../lib/contracts/abi";
import type { MarketView } from "../lib/contracts/markets";
import { LoadingSpinner } from "./loading-spinner";

type ResolveMarketProps = {
  market: MarketView;
  isResolver: boolean;
};

export function ResolveMarket({ market, isResolver }: ResolveMarketProps) {
  const [outcomeYes, setOutcomeYes] = useState(true);
  const [confidenceYesPct, setConfidenceYesPct] = useState("5000");
  const [deltaBps24h, setDeltaBps24h] = useState("0");
  const [signalStrength, setSignalStrength] = useState<0 | 1 | 2>(0);

  const { writeContractAsync, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const isDisabled = !isResolver || market.status !== 1n;

  const handleResolve = async () => {
    try {
      await writeContractAsync({
        address: market.marketAddress,
        abi: predictionMarketAbi,
        functionName: "resolveMarket",
        args: [outcomeYes]
      });
    } catch (error) {
      console.error("Failed to resolve market:", error);
    }
  };

  const handleSnapshot = async () => {
    try {
      await writeContractAsync({
        address: market.marketAddress,
        abi: predictionMarketAbi,
        functionName: "publishSnapshot",
        args: [parseInt(confidenceYesPct), parseInt(deltaBps24h), signalStrength]
      });
    } catch (error) {
      console.error("Failed to publish snapshot:", error);
    }
  };

  if (!isResolver) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="mb-4 text-lg font-medium text-slate-100">Resolve Market</h3>

      <div className="mb-4">
        <label className="mb-2 block text-xs text-slate-400">Market Outcome</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOutcomeYes(true)}
            disabled={isDisabled}
            className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
              outcomeYes
                ? "bg-emerald-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-slate-600"
            } disabled:opacity-50`}
          >
            YES
          </button>
          <button
            type="button"
            onClick={() => setOutcomeYes(false)}
            disabled={isDisabled}
            className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
              !outcomeYes
                ? "bg-red-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-slate-600"
            } disabled:opacity-50`}
          >
            NO
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Confidence % (x100)</label>
          <input
            type="number"
            value={confidenceYesPct}
            onChange={(e) => setConfidenceYesPct(e.target.value)}
            disabled={isDisabled}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">24h Delta (bps)</label>
          <input
            type="number"
            value={deltaBps24h}
            onChange={(e) => setDeltaBps24h(e.target.value)}
            disabled={isDisabled}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Signal Strength</label>
          <select
            value={signalStrength}
            onChange={(e) => setSignalStrength(parseInt(e.target.value) as 0 | 1 | 2)}
            disabled={isDisabled}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
          >
            <option value={0}>LOW</option>
            <option value={1}>MEDIUM</option>
            <option value={2}>HIGH</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSnapshot}
          disabled={isDisabled || isPending || isConfirming}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? <LoadingSpinner size="sm" /> : "Publish Snapshot"}
        </button>
        <button
          type="button"
          onClick={handleResolve}
          disabled={isDisabled || isPending || isConfirming}
          className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
        >
          {isPending ? <LoadingSpinner size="sm" /> : "Resolve Market"}
        </button>
      </div>
    </div>
  );
}
