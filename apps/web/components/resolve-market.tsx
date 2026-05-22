"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { predictionMarketAbi } from "../lib/contracts/abi";
import type { MarketView } from "../lib/contracts/markets";
import { LoadingSpinner } from "./loading-spinner";
import { TxHashRow } from "./tx-hash-row";

type ResolveMarketProps = {
  market: MarketView;
  currentStatus: bigint;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ResolveMarket({ market, currentStatus }: ResolveMarketProps) {
  const [outcomeYes, setOutcomeYes] = useState(true);
  const [confidenceYesPct, setConfidenceYesPct] = useState("5000");
  const [deltaBps24h, setDeltaBps24h] = useState("0");
  const [signalStrength, setSignalStrength] = useState<0 | 1 | 2>(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const { writeContractAsync, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const isClosed = currentStatus === 1n;
  const isActive = currentStatus === 0n;

  const handleClose = async () => {
    try {
      await writeContractAsync({
        address: market.marketAddress,
        abi: predictionMarketAbi,
        functionName: "closeMarket",
        gas: 3_000_000n
      });
    } catch (error) {
      console.error("Failed to close market:", error);
    }
  };

  const handleResolve = async () => {
    try {
      await writeContractAsync({
        address: market.marketAddress,
        abi: predictionMarketAbi,
        functionName: "resolveMarket",
        args: [outcomeYes],
        gas: 3_000_000n
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
        args: [parseInt(confidenceYesPct), parseInt(deltaBps24h), signalStrength],
        gas: 3_000_000n
      });
    } catch (error) {
      console.error("Failed to publish snapshot:", error);
    }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    setAiReasoning(null);
    setAiError(null);
    try {
      const r = await fetch(`${apiUrl}/api/suggest-resolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: market.question })
      });
      if (!r.ok) {
        const errorPayload = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorPayload.error ?? "AI request failed");
      }
      const data = await r.json() as {
        outcomeYes: boolean;
        confidenceYesPct: number;
        deltaBps24h: number;
        signalStrength: number;
        reasoning: string;
      };
      setOutcomeYes(data.outcomeYes);
      setConfidenceYesPct(data.confidenceYesPct.toString());
      setDeltaBps24h(data.deltaBps24h.toString());
      setSignalStrength(data.signalStrength as 0 | 1 | 2);
      setAiReasoning(data.reasoning);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI suggest failed";
      setAiError(message);
      console.error("AI suggest failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  if (isActive) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="mb-4 text-lg font-medium text-slate-100">Close Market</h3>
        <p className="mb-4 text-sm text-slate-400">
          Close the market after the deadline to stop accepting bets and enable resolution.
        </p>
        <button
          type="button"
          onClick={handleClose}
          disabled={isPending || isConfirming}
          className="w-full rounded-lg bg-amber-600 py-3 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
        >
          {isPending ? <LoadingSpinner size="sm" /> : "Close Market"}
        </button>
        <TxHashRow label="Close market tx" hash={txHash} isConfirming={isConfirming} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-100">Resolve Market</h3>
        <button
          type="button"
          onClick={handleAiSuggest}
          disabled={!isClosed || aiLoading}
          className="rounded-lg border border-purple-700 bg-purple-900/30 px-3 py-1.5 text-xs font-medium text-purple-200 transition hover:bg-purple-900/50 disabled:opacity-50"
        >
          {aiLoading ? <LoadingSpinner size="sm" /> : "AI Suggest"}
        </button>
      </div>

      {aiReasoning && (
        <div className="mb-4 rounded-lg border border-purple-800/50 bg-purple-900/20 p-3">
          <p className="text-xs text-purple-300">{aiReasoning}</p>
        </div>
      )}
      {aiError && (
        <div className="mb-4 rounded-lg border border-red-800/50 bg-red-900/20 p-3">
          <p className="text-xs text-red-300">{aiError}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-2 block text-xs text-slate-400">Market Outcome</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOutcomeYes(true)}
            disabled={!isClosed}
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
            disabled={!isClosed}
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
            disabled={!isClosed}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">24h Delta (bps)</label>
          <input
            type="number"
            value={deltaBps24h}
            onChange={(e) => setDeltaBps24h(e.target.value)}
            disabled={!isClosed}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Signal Strength</label>
          <select
            value={signalStrength}
            onChange={(e) => setSignalStrength(parseInt(e.target.value) as 0 | 1 | 2)}
            disabled={!isClosed}
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
          disabled={!isClosed || isPending || isConfirming}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? <LoadingSpinner size="sm" /> : "Publish Snapshot"}
        </button>
        <button
          type="button"
          onClick={handleResolve}
          disabled={!isClosed || isPending || isConfirming}
          className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
        >
          {isPending ? <LoadingSpinner size="sm" /> : "Resolve Market"}
        </button>
      </div>
      <TxHashRow label="Latest resolver tx" hash={txHash} isConfirming={isConfirming} />
    </div>
  );
}
