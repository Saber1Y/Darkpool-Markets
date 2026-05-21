import { getMarkets, type MarketView } from "../../lib/contracts/markets";
import { ResolveMarket } from "../../components/resolve-market";
import { Container } from "../../components/ui/container";
import { Badge } from "../../components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let markets: MarketView[] = [];
  let loadError: string | null = null;
  try {
    markets = await getMarkets(0n, 100n);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load markets from RPC.";
  }

  const activeMarkets = markets.filter((m) => m.status === 0n);
  const closedMarkets = markets.filter((m) => m.status === 1n);
  const resolvedMarkets = markets.filter((m) => m.status === 2n);

  return (
    <Container size="lg" className="py-8 md:py-10">
      <section className="panel mb-8 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Operations Console</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-100">Resolver Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Close stale markets, publish confidence snapshots, and finalize outcomes.
        </p>
      </section>

      {loadError && (
        <div className="panel mb-6 border-amber-700/40 bg-amber-900/10 p-5">
          <p className="text-sm font-medium text-amber-200">Could not load markets</p>
          {/* <p className="mt-2 text-xs text-amber-300/90">{loadError}</p> */}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Active Markets" value={activeMarkets.length.toString()} tone="text-emerald-300" />
        <MetricCard label="Closed Markets" value={closedMarkets.length.toString()} tone="text-amber-300" />
        <MetricCard label="Resolved Markets" value={resolvedMarkets.length.toString()} tone="text-cyan-300" />
      </div>

      {closedMarkets.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Markets Ready to Resolve</h2>
          <div className="grid gap-4">
            {closedMarkets.map((market) => (
              <ResolveMarket key={market.marketId.toString()} market={market} currentStatus={market.status} />
            ))}
          </div>
        </section>
      )}

      {resolvedMarkets.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Resolved Markets</h2>
          <div className="grid gap-3">
            {resolvedMarkets.map((market) => (
              <div
                key={market.marketId.toString()}
                className="panel flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium text-slate-100">{market.question}</p>
                  <p className="text-xs text-slate-500">Market #{market.marketId.toString()}</p>
                </div>
                <Badge variant={market.resolvedOutcome ? "success" : "danger"}>
                  {market.resolvedOutcome ? "YES" : "NO"}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {markets.length === 0 && (
        <div className="panel border-dashed p-8 text-center">
          <p className="text-slate-400">No markets found. Create markets first.</p>
        </div>
      )}
    </Container>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
