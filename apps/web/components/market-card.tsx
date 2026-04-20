import Link from "next/link";
import { MarketView, signalLabel, statusLabel } from "../lib/contracts/markets";
import { formatDateFromUnix, formatSignedBps, shortAddress } from "../lib/format";

type MarketCardProps = {
  market: MarketView;
};

export function MarketCard({ market }: MarketCardProps) {
  const statusVariant = getStatusVariant(market.status);
  const signalVariant = getSignalVariant(market.signalStrength);

  return (
    <Link
      href={`/markets/${market.marketId.toString()}`}
      className="block rounded-xl border border-slate-800/70 bg-slate-900/40 p-5 transition hover:border-teal-500/50"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">
          Market #{market.marketId.toString()}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded px-2 py-1 ${statusVariant.bg} ${statusVariant.text}`}>
            {statusLabel(market.status)}
          </span>
          <span className={`rounded px-2 py-1 ${signalVariant.bg} ${signalVariant.text}`}>
            Signal {signalLabel(market.signalStrength)}
          </span>
        </div>
      </div>

      <h2 className="text-lg font-medium text-slate-100 line-clamp-2">{market.question}</h2>

      <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
        <p>
          <span className="text-slate-500">Confidence YES:</span> {market.confidenceYesPct.toFixed(2)}%
        </p>
        <p>
          <span className="text-slate-500">24h Delta:</span> {formatSignedBps(market.confidenceDeltaBps24h)}
        </p>
        <p>
          <span className="text-slate-500">Participants:</span> {market.participantCount.toString()}
        </p>
        <p>
          <span className="text-slate-500">Deadline:</span> {formatDateFromUnix(market.deadline)}
        </p>
      </div>

      <p className="mt-3 text-xs text-slate-500">Creator: {shortAddress(market.creator)}</p>
    </Link>
  );
}

function getStatusVariant(status: bigint) {
  switch (status) {
    case 0n:
      return { bg: "bg-emerald-900/40", text: "text-emerald-200" };
    case 1n:
      return { bg: "bg-amber-900/40", text: "text-amber-200" };
    case 2n:
      return { bg: "bg-teal-900/40", text: "text-teal-200" };
    case 3n:
      return { bg: "bg-red-900/40", text: "text-red-200" };
    default:
      return { bg: "bg-slate-800", text: "text-slate-200" };
  }
}

function getSignalVariant(signal: bigint) {
  switch (signal) {
    case 0n:
      return { bg: "bg-slate-800", text: "text-slate-400" };
    case 1n:
      return { bg: "bg-yellow-900/40", text: "text-yellow-200" };
    case 2n:
      return { bg: "bg-orange-900/40", text: "text-orange-200" };
    default:
      return { bg: "bg-slate-800", text: "text-slate-200" };
  }
}