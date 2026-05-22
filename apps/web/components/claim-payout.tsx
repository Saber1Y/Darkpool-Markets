"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { isAddress } from "viem";
import { predictionMarketAbi } from "../lib/contracts/abi";
import type { MarketView } from "../lib/contracts/markets";
import { LoadingSpinner } from "./loading-spinner";
import { TxHashRow } from "./tx-hash-row";

type ClaimPayoutProps = {
  market: MarketView;
  isCreator: boolean;
  currentStatus: bigint;
};

export function ClaimPayout({ market, isCreator, currentStatus }: ClaimPayoutProps) {
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  const [settleResult, setSettleResult] = useState<string | null>(null);
  const [settleAddress, setSettleAddress] = useState("");
  const [settleWinner, setSettleWinner] = useState(market.resolvedOutcome);
  const settleAddressValid = isAddress(settleAddress);
  const settleAddressArg = (settleAddressValid
    ? settleAddress
    : "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const { writeContractAsync, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });
  const { data: isAlreadySettled, refetch: refetchSettleStatus } = useReadContract({
    address: market.marketAddress,
    abi: predictionMarketAbi,
    functionName: "claimSettled",
    args: [settleAddressArg],
    query: { enabled: settleAddressValid }
  });

  useEffect(() => {
    if (address && !settleAddress) {
      setSettleAddress(address);
    }
  }, [address, settleAddress]);

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      await writeContractAsync({
        address: market.marketAddress,
        abi: predictionMarketAbi,
        functionName: "claim",
        gas: 3_000_000n
      });
      setClaimResult("Claim submitted! Check your position.");
    } catch (error) {
      setClaimResult(`Claim failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSettleClaim = async () => {
    if (!isCreator) return;

    if (!settleAddressValid) {
      setSettleResult("Settle failed: provide a valid recipient address.");
      return;
    }
    if (isAlreadySettled) {
      setSettleResult("This address is already settled for this market.");
      return;
    }

    try {
      setIsSettling(true);
      setSettleResult(null);
      await writeContractAsync({
        address: market.marketAddress,
        abi: predictionMarketAbi,
        functionName: "settleClaim",
        args: [settleAddress as `0x${string}`, settleWinner],
        gas: 3_000_000n
      });
      setSettleResult("Settlement transaction submitted.");
      await refetchSettleStatus();
    } catch (error) {
      setSettleResult(`Settle failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSettling(false);
    }
  };

  if (currentStatus !== 2n) return null;

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
          disabled={isClaiming || isPending || isConfirming || isSettling}
          className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
        >
          {isClaiming || isPending ? <LoadingSpinner size="sm" /> : "Claim Winnings"}
        </button>
      </div>

      {claimResult && (
        <p className={`mt-3 text-sm ${claimResult.includes("failed") ? "text-red-400" : "text-emerald-400"}`}>
          {claimResult}
        </p>
      )}
      <TxHashRow label="Claim/settle tx" hash={txHash} isConfirming={isConfirming} />

      {isCreator && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm font-medium text-slate-200">Settle a User Claim (Creator)</p>
          <p className="mt-1 text-xs text-slate-500">
            Settle can only run once per address per market.
          </p>

          <div className="mt-3 grid gap-3">
            <label className="text-xs text-slate-400">
              Recipient Address
              <input
                value={settleAddress}
                onChange={(e) => setSettleAddress(e.target.value)}
                placeholder="0x..."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
              />
            </label>
          </div>

          {settleAddressValid && (
            <p className={`mt-2 text-xs ${isAlreadySettled ? "text-amber-300" : "text-slate-400"}`}>
              Settlement status: {isAlreadySettled ? "Already settled" : "Not settled yet"}
            </p>
          )}

          <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={settleWinner}
              onChange={(e) => setSettleWinner(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800"
            />
            Winner claim
          </label>

          <button
            onClick={handleSettleClaim}
            disabled={isPending || isConfirming || isSettling || Boolean(isAlreadySettled)}
            className="mt-4 rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-900/50 disabled:opacity-50"
          >
            {isSettling ? <LoadingSpinner size="sm" /> : "Settle Claim"}
          </button>

          {settleResult && (
            <p className={`mt-3 text-sm ${settleResult.includes("failed") ? "text-red-400" : "text-emerald-400"}`}>
              {settleResult}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
