"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { predictionMarketAbi } from "../lib/contracts/abi";
import type { MarketView } from "../lib/contracts/markets";
import { LoadingSpinner } from "./loading-spinner";

type ClaimPayoutProps = {
  market: MarketView;
  isCreator: boolean;
};

export function ClaimPayout({ market, isCreator }: ClaimPayoutProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<string | null>(null);

  const { writeContractAsync, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      await writeContractAsync({
        address: market.marketAddress,
        abi: predictionMarketAbi,
        functionName: "claim"
      });
      setClaimResult("Claim submitted! Check your position.");
    } catch (error) {
      setClaimResult(`Claim failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSettleClaim = async (winner: boolean) => {
    if (!isCreator) return;
    try {
      await writeContractAsync({
        address: market.marketAddress,
        abi: predictionMarketAbi,
        functionName: "settleClaim",
        args: ["0x0000000000000000000000000000000000000000" as `0x${string}`, winner, "0"]
      });
    } catch (error) {
      console.error("Settle failed:", error);
    }
  };

  if (market.status !== 2n) return null;

  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-5">
      <h3 className="mb-4 text-lg font-medium text-slate-100">Claim Payout</h3>

      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-sm text-slate-400">Market Outcome</p>
        <p className={`mt-1 text-xl font-semibold ${market.resolvedOutcome ? "text-emerald-400" : "text-red-400"}`}>
          {market.resolvedOutcome ? "YES" : "NO"}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleClaim}
          disabled={isClaiming || isPending || isConfirming}
          className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
        >
          {isClaiming || isPending ? <LoadingSpinner size="sm" /> : "Claim Winnings"}
        </button>

        {isCreator && (
          <button
            onClick={() => handleSettleClaim(true)}
            disabled={isPending}
            className="rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-900/50 disabled:opacity-50"
          >
            Settle Winner
          </button>
        )}
      </div>

      {claimResult && (
        <p className={`mt-3 text-sm ${claimResult.includes("failed") ? "text-red-400" : "text-emerald-400"}`}>
          {claimResult}
        </p>
      )}
    </div>
  );
}
