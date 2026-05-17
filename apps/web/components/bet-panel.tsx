"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { usePlaceBet, useIncreaseBet, useUserPosition } from "../lib/hooks/use-market";
import { LoadingSpinner } from "./loading-spinner";
import type { MarketView } from "../lib/contracts/markets";

type BetPanelProps = {
  market: MarketView;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function decryptHandle(handle: `0x${string}`): Promise<bigint> {
  const r = await fetch(`${apiUrl}/api/decrypt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handles: [handle] })
  });
  if (!r.ok) return 0n;
  const d = await r.json() as { values: string[] };
  const v = d.values[0];
  if (!v || v === "0x") return 0n;
  return BigInt(v);
}

export function BetPanel({ market }: BetPanelProps) {
  const { isConnected, address: userAddress } = useAccount();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [decryptedSide, setDecryptedSide] = useState<boolean | null>(null);
  const [decryptedAmount, setDecryptedAmount] = useState<string | null>(null);

  const { sideYesHandle, amountHandle, exists: hasExistingPosition, claimed, refetch } =
    useUserPosition(market.marketAddress);
  const { placeBet, isLoading: isPlacing, txHash: placeTxHash, isConfirming: isPlaceConfirming } = usePlaceBet();
  const { increaseBet, isLoading: isIncreasing, txHash: increaseTxHash, isConfirming: isIncreaseConfirming } = useIncreaseBet();

  useEffect(() => {
    if (!hasExistingPosition && amount && parseFloat(amount) <= 0) {
      setLocalError("Amount must be greater than 0");
    } else {
      setLocalError(null);
    }
  }, [amount, hasExistingPosition]);

  const confirmRefetch = useCallback(async () => {
    await new Promise(r => setTimeout(r, 2000));
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (isPlaceConfirming === false && placeTxHash) {
      setSuccessMsg("Bet placed successfully!");
      confirmRefetch();
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [isPlaceConfirming, placeTxHash, confirmRefetch]);

  useEffect(() => {
    if (isIncreaseConfirming === false && increaseTxHash) {
      setSuccessMsg("Funds added!");
      confirmRefetch();
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [isIncreaseConfirming, increaseTxHash, confirmRefetch]);

  useEffect(() => {
    let cancelled = false;

    if (!hasExistingPosition || !sideYesHandle || !amountHandle) {
      setDecryptedSide(null);
      setDecryptedAmount(null);
      return;
    }

    Promise.all([decryptHandle(sideYesHandle), decryptHandle(amountHandle)])
      .then(([sideValue, amountValue]) => {
        if (cancelled) return;
        setDecryptedSide(sideValue === 1n);
        const amountEth = Number(amountValue) / 1000;
        setDecryptedAmount(amountEth > 0 ? amountEth.toFixed(4) : null);
      })
      .catch(() => {
        if (cancelled) return;
        setDecryptedSide(null);
        setDecryptedAmount(null);
      });

    return () => {
      cancelled = true;
    };
  }, [hasExistingPosition, sideYesHandle, amountHandle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      setLocalError("Please enter a valid amount");
      return;
    }

    if (!userAddress) {
      setLocalError("Connect wallet before submitting a bet.");
      return;
    }

    if (hasExistingPosition && decryptedSide === null) {
      setLocalError("Waiting for your encrypted side to decrypt. Please try again in a moment.");
      return;
    }

    let amountWei: bigint;
    let amountMilliEth: bigint;
    try {
      amountWei = parseEther(amount);
      amountMilliEth = parseUnits(amount, 3);
    } catch {
      setLocalError("Invalid amount. Use a positive value with up to 3 decimal places.");
      return;
    }

    if (amountWei <= 0n) {
      setLocalError("Please enter a valid amount");
      return;
    }

    try {
      setSuccessMsg(null);
      const encRes = await fetch(`${apiUrl}/api/encrypt-bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sideYes: hasExistingPosition ? decryptedSide : side === "yes",
          amountMilliEth: amountMilliEth.toString(),
          userAddress,
          contractAddress: market.marketAddress
        })
      });
      if (!encRes.ok) {
        const errData = (await encRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error ?? "Encryption failed");
      }
      const encData = await encRes.json() as { encryptedSide: `0x${string}`; encryptedAmount: `0x${string}`; proof: `0x${string}` };

      if (hasExistingPosition) {
        await increaseBet({
          marketAddress: market.marketAddress,
          additionalAmount: amount,
          encryptedAmount: encData.encryptedAmount,
          proof: encData.proof
        });
      } else {
        await placeBet({
          marketAddress: market.marketAddress,
          amount,
          encryptedSide: encData.encryptedSide,
          encryptedAmount: encData.encryptedAmount,
          proof: encData.proof
        });
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  const isPending = isPlacing || isIncreasing;
  const isDisabled =
    market.status !== 0n || !isConnected || isPending || (hasExistingPosition && claimed);

  if (successMsg) {
    return (
      <div className="rounded-xl border border-emerald-800 bg-emerald-900/30 p-5 text-center">
        <p className="text-lg font-medium text-emerald-300">{successMsg}</p>
        <p className="mt-1 text-xs text-emerald-500">Refreshing position...</p>
      </div>
    );
  }

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
            Side: <span className="text-slate-200">{decryptedSide === null ? "Encrypted" : decryptedSide ? "YES" : "NO"}</span>
          </p>
          <p className="text-slate-400">
            Amount:{" "}
            <span className="text-slate-200">
              {decryptedAmount ? `${decryptedAmount} ETH` : "Encrypted"}
            </span>
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
              {isPending ? <LoadingSpinner size="sm" /> : "Add Funds"}
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
        {isPending ? <LoadingSpinner size="sm" /> : `Bet ${side.toUpperCase()} ${amount ? `(${amount} ETH)` : ""}`}
      </button>
    </form>
  );
}
