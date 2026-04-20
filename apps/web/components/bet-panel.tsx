"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { usePlaceBet, useIncreaseBet, useUserPosition } from "../lib/hooks/use-market";
import { LoadingSpinner } from "./loading-spinner";
import type { MarketView } from "../lib/contracts/markets";

type BetPanelProps = {
  market: MarketView;
};

export function BetPanel({ market }: BetPanelProps) {
  const { isConnected } = useAccount();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { sideYes: existingSide, amount: existingAmount, exists: hasExistingPosition, claimed } =
    useUserPosition(market.marketAddress);
  const { placeBet, isLoading: isPlacing } = usePlaceBet();
  const { increaseBet, isLoading: isIncreasing } = useIncreaseBet();

  useEffect(() => {
    if (!hasExistingPosition && amount && parseFloat(amount) <= 0) {
      setLocalError("Amount must be greater than 0");
    } else {
      setLocalError(null);
    }
  }, [amount, hasExistingPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setLocalError("Please enter a valid amount");
      return;
    }

    try {
      if (hasExistingPosition) {
        await increaseBet({
          marketAddress: market.marketAddress,
          additionalAmount: amount
        });
      } else {
        await placeBet({
          marketAddress: market.marketAddress,
          sideYes: side === "yes",
          amount
        });
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  const isDisabled =
    market.status !== 0n || !isConnected || isPlacing || isIncreasing || (hasExistingPosition && claimed);

  if (market.status !== 0n) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <p className="text-sm text-slate-400">
          This market is {market.status === 1n ? "closed" : market.status === 2n ? "resolved" : "cancelled"} and
          no longer accepting bets.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-center">
        <p className="text-sm text-slate-400">Connect your wallet to place a bet</p>
      </div>
    );
  }

  if (hasExistingPosition && claimed) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-center">
        <p className="text-sm text-slate-400">You have already claimed your winnings</p>
      </div>
    );
  }

  if (hasExistingPosition) {
    return (
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-medium text-slate-200">Your Current Position</h3>
        <div className="mt-3 grid gap-2 text-sm">
          <p className="text-slate-400">
            Side: <span className="text-slate-200">{existingSide ? "YES" : "NO"}</span>
          </p>
          <p className="text-slate-400">
            Amount: <span className="text-slate-200">{existingAmount ? `${existingAmount.toString()} ETH` : "N/A"}</span>
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-xs text-slate-400">Add more ETH</label>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              disabled={isDisabled}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isDisabled || !amount}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
            >
              {isIncreasing ? <LoadingSpinner size="sm" /> : "Add Funds"}
            </button>
          </div>
        </div>

        {localError && <p className="mt-2 text-xs text-red-400">{localError}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="text-sm font-medium text-slate-200">Place Your Bet</h3>

      <div className="mt-4">
        <label className="block text-xs text-slate-400">Select your side</label>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setSide("yes")}
            disabled={isDisabled}
            className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
              side === "yes"
                ? "bg-emerald-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-slate-600"
            } disabled:opacity-50`}
          >
            YES
          </button>
          <button
            type="button"
            onClick={() => setSide("no")}
            disabled={isDisabled}
            className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
              side === "no"
                ? "bg-red-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-slate-600"
            } disabled:opacity-50`}
          >
            NO
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs text-slate-400">Amount (ETH)</label>
        <input
          type="number"
          step="0.001"
          min="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.01"
          disabled={isDisabled}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 disabled:opacity-50"
        />
      </div>

      {localError && <p className="mt-2 text-xs text-red-400">{localError}</p>}

      <button
        type="submit"
        disabled={isDisabled || !amount}
        className="mt-4 w-full rounded-lg bg-teal-600 py-3 text-sm font-medium text-white transition hover:bg-teal-500 disabled:opacity-50"
      >
        {isPlacing ? <LoadingSpinner size="sm" /> : `Bet ${side.toUpperCase()} ${amount ? `(${amount} ETH)` : ""}`}
      </button>
    </form>
  );
}