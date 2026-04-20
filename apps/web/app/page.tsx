import { getMarkets } from "../lib/contracts/markets";
import { MarketCard } from "../components/market-card";
import { LoadingSpinner } from "../components/loading-spinner";

export const dynamic = "force-dynamic";

export default async function Page() {
  const markets = await getMarkets(0n, 25n);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <section className="mb-8 rounded-xl border border-slate-800/70 bg-slate-900/50 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Prediction Markets</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Privacy-preserving prediction markets powered by fully homomorphic encryption. Your bets are encrypted on-chain.
        </p>
      </section>

      {markets.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-700 p-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-slate-400">Loading markets...</p>
          </div>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {markets.map((market) => (
            <MarketCard key={market.marketId.toString()} market={market} />
          ))}
        </section>
      )}

      {markets.length > 0 && (
        <p className="mt-6 text-center text-xs text-slate-500">
          Showing {markets.length} markets from local chain
        </p>
      )}
    </main>
  );
}
