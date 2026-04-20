import { notFound } from "next/navigation";
import { getMarketById, statusLabel } from "../../../lib/contracts/markets";
import { formatDateFromUnix, shortAddress } from "../../../lib/format";
import { BetPanel } from "../../../components/bet-panel";
import dynamic from "next/dynamic";

const LoadingSpinner = dynamic(() => import("../../../components/loading-spinner").then((mod) => mod.LoadingSpinner), {
  ssr: false
});

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
      <a
        href="/"
        className="mb-5 inline-flex items-center text-sm text-teal-300 transition hover:text-teal-200"
      >
        <svg
          className="mr-1.5 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to markets
      </a>

      <section className="mb-6 rounded-xl border border-slate-800/70 bg-slate-900/40 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded border border-slate-700 px-2 py-1 text-slate-300">
            Market #{market.marketId.toString()}
          </span>
          <span
            className={`rounded px-2 py-1 ${
              market.status === 0n
                ? "bg-emerald-900/40 text-emerald-200"
                : market.status === 1n
                  ? "bg-amber-900/40 text-amber-200"
                  : market.status === 2n
                    ? "bg-teal-900/40 text-teal-200"
                    : "bg-red-900/40 text-red-200"
            }`}
          >
            {statusLabel(market.status)}
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
              {market.status === 2n
                ? market.resolvedOutcome
                  ? "YES"
                  : "NO"
                : market.status === 3n
                  ? "CANCELLED"
                  : "Pending"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Creator:</span> {shortAddress(market.creator)}
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

      <section>
        <h2 className="mb-4 text-lg font-medium text-slate-100">Place Your Bet</h2>
        <BetPanel market={market} />
      </section>
    </main>
  );
}
