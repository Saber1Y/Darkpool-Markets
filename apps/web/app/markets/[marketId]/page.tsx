import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarketById, signalLabel, statusLabel } from "../../../lib/contracts/markets";
import { formatDateFromUnix, formatSignedBps, shortAddress } from "../../../lib/format";

export const dynamic = "force-dynamic";

type MarketDetailPageProps = {
  params: Promise<{
    marketId: string;
  }>;
};

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const routeParams = await params;
  let parsed: bigint;
  try {
    parsed = BigInt(routeParams.marketId);
  } catch {
    notFound();
  }
  const market = await getMarketById(parsed);
  if (!market) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8">
      <div className="mb-5">
        <Link href="/" className="text-sm text-teal-300 hover:text-teal-200">
          ← Back to markets
        </Link>
      </div>

      <section className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded border border-slate-700 px-2 py-1 text-slate-300">
            Market #{market.marketId.toString()}
          </span>
          <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">{statusLabel(market.status)}</span>
          <span className="rounded bg-teal-900/40 px-2 py-1 text-teal-200">
            Signal {signalLabel(market.signalStrength)}
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-slate-100">{market.question}</h1>
        <p className="mt-2 text-sm text-slate-400">Metadata URI: {market.metadataURI}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confidence YES</p>
            <p className="mt-1 text-xl font-semibold">{market.confidenceYesPct.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">24h Delta</p>
            <p className="mt-1 text-xl font-semibold">{formatSignedBps(market.confidenceDeltaBps24h)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Participants</p>
            <p className="mt-1 text-xl font-semibold">{market.participantCount.toString()}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Outcome</p>
            <p className="mt-1 text-xl font-semibold">
              {market.outcomeSet ? (market.resolvedOutcome ? "YES" : "NO") : "Pending"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 text-sm text-slate-300">
          <p>Creator: {shortAddress(market.creator)}</p>
          <p>Market Contract: {market.marketAddress}</p>
          <p>Created At: {formatDateFromUnix(market.createdAt)}</p>
          <p>Deadline: {formatDateFromUnix(market.deadline)}</p>
        </div>
      </section>
    </main>
  );
}
