import { getMarkets, type MarketView } from "../../lib/contracts/markets";
import { ResolveMarket } from "../../components/resolve-market";
import { Container } from "../../components/ui/container";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
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
    <Container size="lg" className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-100">Resolver Dashboard</h1>

      {loadError && (
        <div className="mb-6 rounded-xl border border-amber-700/40 bg-amber-900/10 p-5">
          <p className="text-sm font-medium text-amber-200">Could not load markets</p>
          <p className="mt-2 text-xs text-amber-300/90">{loadError}</p>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{activeMarkets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Closed Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-400">{closedMarkets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-teal-400">{resolvedMarkets.length}</p>
          </CardContent>
        </Card>
      </div>

      {closedMarkets.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-200">Markets Ready to Resolve</h2>
          <div className="grid gap-4">
            {closedMarkets.map((market) => (
              <ResolveMarket key={market.marketId.toString()} market={market} currentStatus={market.status} />
            ))}
          </div>
        </section>
      )}

      {resolvedMarkets.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-200">Resolved Markets</h2>
          <div className="grid gap-3">
            {resolvedMarkets.map((market) => (
              <div
                key={market.marketId.toString()}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-4"
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
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-slate-400">No markets found. Create markets first.</p>
        </div>
      )}
    </Container>
  );
}
