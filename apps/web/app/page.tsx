import { getMarkets, type MarketView } from "../lib/contracts/markets";
import { MarketCard } from "../components/market-card";
import { LoadingSpinner } from "../components/loading-spinner";

export const dynamic = "force-dynamic";

export default async function Page() {
  let markets: MarketView[] = [];
  let loadError: string | null = null;

  try {
    markets = await getMarkets(0n, 25n);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load markets from local RPC.";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <section className="mb-8 rounded-xl border border-slate-800/70 bg-slate-900/50 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Prediction Markets</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Privacy-preserving prediction markets powered by fully homomorphic encryption. Your bets are encrypted on-chain.
        </p>
      </section>

      {loadError ? (
        <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-5">
          <p className="text-sm font-medium text-amber-200">Could not load markets</p>
          <p className="mt-2 text-xs text-amber-300/90">{loadError}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-amber-200/90">
            <li>Run `pnpm --filter @darkpool/contracts node`.</li>
            <li>Run `pnpm --filter @darkpool/contracts deploy:local`.</li>
            <li>Set `NEXT_PUBLIC_FACTORY_ADDRESS` in `apps/web/.env.local` to the new factory address.</li>
          </ol>
        </div>
      ) : markets.length === 0 ? (
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
