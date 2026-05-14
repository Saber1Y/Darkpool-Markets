import { notFound } from "next/navigation";
import { getMarketById, statusLabel } from "../../../lib/contracts/markets";
import { formatDateFromUnix, shortAddress } from "../../../lib/format";
import { MarketDetailClient } from "./market-detail-client";

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
  if (!market) notFound();

  return <MarketDetailClient market={market} />;
}
