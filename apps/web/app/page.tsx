import Link from "next/link";
import { getMarkets, signalLabel, statusLabel } from "../lib/contracts/markets";
import { formatDateFromUnix, formatSignedBps, shortAddress } from "../lib/format";

export const dynamic = "force-dynamic";

export default async function Page() {
  const markets = await getMarkets(0n, 25n);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <section className="mb-6 rounded-xl border border-slate-800/70 bg-slate-900/50 p-5">
        <h1 className="text-2xl font-semibold">Prediction Markets</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live markets fetched from your local chain through <code>MarketFactory.listMarkets</code>.
        </p>
      </section>

      {markets.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          No markets found. Create one with the local script first.
        </section>
      ) : (
        <section className="grid gap-4">
          {markets.map((market) => (
            <Link
              key={market.marketId.toString()}
              href={`/markets/${market.marketId.toString()}`}
              className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-5 transition hover:border-teal-500/50"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">
                  Market #{market.marketId.toString()}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">{statusLabel(market.status)}</span>
                  <span className="rounded bg-teal-900/40 px-2 py-1 text-teal-200">
                    Signal {signalLabel(market.signalStrength)}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-medium text-slate-100">{market.question}</h2>

              <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                <p>Confidence YES: {market.confidenceYesPct.toFixed(2)}%</p>
                <p>24h Delta: {formatSignedBps(market.confidenceDeltaBps24h)}</p>
                <p>Participants: {market.participantCount.toString()}</p>
                <p>Deadline: {formatDateFromUnix(market.deadline)}</p>
              </div>

              <p className="mt-3 text-xs text-slate-500">Creator: {shortAddress(market.creator)}</p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
