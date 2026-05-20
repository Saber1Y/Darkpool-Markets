"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { signalLabel, statusLabel } from "../../../lib/contracts/markets";
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
  const yesPct = market.confidenceYesPct;
  const noPct = Math.max(0, 100 - yesPct);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40"
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to markets
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 uppercase tracking-[0.12em] text-slate-300">
            Event #{market.marketId.toString()}
          </span>
          <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 uppercase tracking-[0.12em] text-slate-400">
            Signal {signalLabel(market.signalStrength)}
          </span>
          <span className={`rounded-full px-2.5 py-1 uppercase tracking-[0.12em] ${statusPill(currentStatus)}`}>
            {statusLabel(currentStatus)}
          </span>
        </div>
      </div>

      <div className="mb-6 panel p-6">
        <h1 className="max-w-5xl text-2xl font-semibold leading-tight text-slate-100 md:text-3xl">{market.question}</h1>
        <p className="mt-3 text-sm text-slate-400">
          Market metadata: <span className="font-mono text-xs text-slate-300">{market.metadataURI || "none"}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-6">
          <div className="panel p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Probability Snapshot</h2>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {market.confidenceDeltaBps24h >= 0 ? "+" : ""}
                {(Number(market.confidenceDeltaBps24h) / 100).toFixed(2)}% 24h
              </p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/90">
              <div className="h-full rounded-full bg-emerald-500/90" style={{ width: `${yesPct.toFixed(2)}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <OutcomeChip label="Yes" value={yesPct.toFixed(2)} tone="yes" />
              <OutcomeChip label="No" value={noPct.toFixed(2)} tone="no" />
            </div>
          </div>

          <div className="panel p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-100">Market Intel</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Participants" value={market.participantCount.toString()} />
              <DetailRow label="Created" value={formatDateFromUnix(market.createdAt)} />
              <DetailRow label="Deadline" value={formatDateFromUnix(market.deadline)} />
              <DetailRow
                label="Outcome"
                value={
                  currentStatus === 2n
                    ? market.resolvedOutcome
                      ? "YES"
                      : "NO"
                    : currentStatus === 3n
                      ? "CANCELLED"
                      : "PENDING"
                }
              />
              <DetailRow label="Creator" value={`${shortAddress(market.creator)}${isCreator ? " (you)" : ""}`} />
              <DetailRow label="Contract" value={shortAddress(market.marketAddress)} />
            </div>
          </div>

          <div className="panel p-6">
            <h3 className="mb-3 text-base font-semibold text-slate-100">Contract Addresses</h3>
            <div className="space-y-2 text-xs text-slate-300">
              <p className="rounded-lg border border-slate-700/70 bg-slate-900/80 px-3 py-2 font-mono">
                Market: {market.marketAddress}
              </p>
              <p className="rounded-lg border border-slate-700/70 bg-slate-900/80 px-3 py-2 font-mono">
                Creator: {market.creator}
              </p>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="panel sticky top-20 p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-100">
              {currentStatus === 0n ? "Trade This Market" : "Your Position"}
            </h2>
            <BetPanel market={market} currentStatus={currentStatus} />
          </div>

          {isCreator && (currentStatus === 0n || currentStatus === 1n) && (
            <div className="panel p-5">
              <h2 className="mb-4 text-base font-semibold text-slate-100">Manage Market</h2>
              <ResolveMarket market={market} currentStatus={currentStatus} />
            </div>
          )}

          {currentStatus === 2n && (
            <div className="panel p-5">
              <h2 className="mb-4 text-base font-semibold text-slate-100">Claim & Settlement</h2>
              <ClaimPayout market={market} isCreator={isCreator} currentStatus={currentStatus} />
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function statusPill(status: bigint): string {
  if (status === 0n) return "bg-emerald-900/40 text-emerald-200";
  if (status === 1n) return "bg-amber-900/40 text-amber-200";
  if (status === 2n) return "bg-cyan-900/40 text-cyan-200";
  return "bg-rose-900/40 text-rose-200";
}

function OutcomeChip({ label, value, tone }: { label: "Yes" | "No"; value: string; tone: "yes" | "no" }) {
  const style =
    tone === "yes"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : "border-rose-500/30 bg-rose-500/10 text-rose-100";

  return (
    <div className={`rounded-xl border px-3 py-2 ${style}`}>
      <p className="text-[11px] uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}%</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}
