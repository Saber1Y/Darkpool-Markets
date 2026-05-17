"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { statusLabel } from "../../../lib/contracts/markets";
import { formatDateFromUnix, shortAddress } from "../../../lib/format";
import { BetPanel } from "../../../components/bet-panel";
import { ResolveMarket } from "../../../components/resolve-market";
import { ClaimPayout } from "../../../components/claim-payout";
import { useMarketStatus } from "../../../lib/hooks/use-market";
import type { MarketView } from "../../../lib/contracts/markets";

type Props = {
  market: MarketView;
};

export function MarketDetailClient({ market }: Props) {
  const { address } = useAccount();
  const { status } = useMarketStatus(market.marketAddress);
  const isCreator = !!address && address.toLowerCase() === market.creator.toLowerCase();
  const currentStatus = status ?? market.status;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8">
      <Link
        href="/"
        className="mb-5 inline-flex items-center text-sm text-teal-300 transition hover:text-teal-200"
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to markets
      </Link>

      <section className="mb-6 rounded-xl border border-slate-800/70 bg-slate-900/40 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded border border-slate-700 px-2 py-1 text-slate-300">
            Market #{market.marketId.toString()}
          </span>
          <span
            className={`rounded px-2 py-1 ${
              currentStatus === 0n
                ? "bg-emerald-900/40 text-emerald-200"
                : currentStatus === 1n
                  ? "bg-amber-900/40 text-amber-200"
                  : currentStatus === 2n
                    ? "bg-teal-900/40 text-teal-200"
                    : "bg-red-900/40 text-red-200"
            }`}
          >
            {statusLabel(currentStatus)}
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-slate-100">{market.question}</h1>
        <p className="mt-2 text-sm text-slate-400">Metadata: {market.metadataURI || "No metadata"}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confidence YES</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">{market.confidenceYesPct.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">24h Delta</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">
              {market.confidenceDeltaBps24h >= 0 ? "+" : ""}
              {Number(market.confidenceDeltaBps24h) / 100}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Participants</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">{market.participantCount.toString()}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Outcome</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">
              {currentStatus === 2n
                ? market.resolvedOutcome
                  ? "YES"
                  : "NO"
                : currentStatus === 3n
                  ? "CANCELLED"
                  : "Pending"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Creator:</span> {shortAddress(market.creator)}
            {isCreator && <span className="ml-2 text-xs text-teal-400">(you)</span>}
          </p>
          <p>
            <span className="text-slate-500">Contract:</span>{" "}
            <span className="font-mono text-xs">{market.marketAddress}</span>
          </p>
          <p>
            <span className="text-slate-500">Created:</span> {formatDateFromUnix(market.createdAt)}
          </p>
          <p>
            <span className="text-slate-500">Deadline:</span> {formatDateFromUnix(market.deadline)}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-slate-100">
          {currentStatus === 0n ? "Place Your Bet" : "Your Position"}
        </h2>
        <BetPanel market={market} />
      </section>

      {isCreator && (currentStatus === 0n || currentStatus === 1n) && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-slate-100">{currentStatus === 0n ? "Close Market" : "Resolution"}</h2>
          <ResolveMarket market={market} currentStatus={currentStatus} />
        </section>
      )}

      {currentStatus === 2n && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium text-slate-100">Claim Payout</h2>
          <ClaimPayout market={market} isCreator={isCreator} />
        </section>
      )}
    </main>
  );
}
