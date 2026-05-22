import { getMarkets, type MarketView } from "../lib/contracts/markets";
import { MarketCard } from "../components/market-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  let markets: MarketView[] = [];
  let loadError: string | null = null;

  try {
    markets = await getMarkets(0n, 25n);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load markets from local RPC.";
  }

  const activeMarkets = markets.filter((market) => market.status === 0n);
  const resolvedMarkets = markets.filter((market) => market.status === 2n);
  const featuredMarket = [...activeMarkets].sort((a, b) =>
    Number(b.participantCount - a.participantCount),
  )[0];
  const closingSoon = [...activeMarkets]
    .sort((a, b) => Number(a.deadline - b.deadline))
    .slice(0, 4);
  const recentResolved = [...resolvedMarkets]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 3);
  const totalParticipants = markets.reduce(
    (acc, market) => acc + Number(market.participantCount),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 md:py-10">
      <section className="panel market-grid-bg mb-8 overflow-hidden p-6 md:p-8">
        <div className="relative z-[1]">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
            DarkPool Exchange
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-slate-100 md:text-4xl">
            Trade Belief. Keep Position Size Private.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Public confidence signals with confidential on-chain order intent,
            powered by fhEVM. See where markets lean without exposing individual
            conviction size.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Markets Listed" value={markets.length.toString()} />
          <Metric label="Live Events" value={activeMarkets.length.toString()} />
          <Metric
            label="Total Participants"
            value={totalParticipants.toLocaleString()}
          />
        </div>
      </section>

      {featuredMarket && (
        <section className="panel mb-8 p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Featured Market
            </p>
            <Link
              href={`/markets/${featuredMarket.marketId.toString()}`}
              className="text-sm font-medium text-cyan-300"
            >
              Open Event
            </Link>
          </div>
          <h2 className="max-w-4xl text-2xl font-semibold text-slate-100">
            {featuredMarket.question}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric
              label="Yes Probability"
              value={`${featuredMarket.confidenceYesPct.toFixed(2)}%`}
            />
            <Metric
              label="Participants"
              value={featuredMarket.participantCount.toString()}
            />
            <Metric
              label="24h Delta"
              value={`${featuredMarket.confidenceDeltaBps24h >= 0 ? "+" : ""}${(
                Number(featuredMarket.confidenceDeltaBps24h) / 100
              ).toFixed(2)}%`}
            />
          </div>
        </section>
      )}

      {loadError ? (
        <div className="panel border-amber-500/30 bg-amber-900/10 p-5">
          <p className="text-sm font-semibold text-amber-200">
            Could not load markets
          </p>
          {/* <p className="mt-1 text-xs text-amber-100/90">{loadError}</p> */}
        </div>
      ) : markets.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-lg text-slate-200">No markets yet.</p>
          <p className="mt-2 text-sm text-slate-400">
            Create your first market and this feed will populate automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                Live Markets
              </h3>
              <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {activeMarkets.length} active
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeMarkets.map((market) => (
                <MarketCard key={market.marketId.toString()} market={market} />
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="panel p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">
                Closing Soon
              </h4>
              {closingSoon.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No active markets at the moment.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {closingSoon.map((market) => (
                    <Link
                      key={market.marketId.toString()}
                      href={`/markets/${market.marketId.toString()}`}
                      className="block rounded-xl border border-slate-700/70 bg-slate-900/70 p-3 transition hover:border-cyan-400/35"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-slate-100">
                        {market.question}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        YES {market.confidenceYesPct.toFixed(2)}% ·{" "}
                        {market.participantCount.toString()} traders
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="panel p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">
                Recently Resolved
              </h4>
              {recentResolved.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No resolved markets yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {recentResolved.map((market) => (
                    <Link
                      key={market.marketId.toString()}
                      href={`/markets/${market.marketId.toString()}`}
                      className="block rounded-xl border border-slate-700/70 bg-slate-900/70 p-3 transition hover:border-cyan-400/35"
                    >
                      <p className="line-clamp-2 text-sm font-medium text-slate-100">
                        {market.question}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Outcome:{" "}
                        <span
                          className={
                            market.resolvedOutcome
                              ? "text-emerald-300"
                              : "text-rose-300"
                          }
                        >
                          {market.resolvedOutcome ? "YES" : "NO"}
                        </span>
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}

      {markets.length > 0 && (
        <p className="mt-8 text-center text-xs uppercase tracking-[0.16em] text-slate-500">
          Confidential prediction markets on-chain
        </p>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
