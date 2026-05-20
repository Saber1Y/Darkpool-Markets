import Link from "next/link";
import { MarketView, signalLabel, statusLabel } from "../lib/contracts/markets";
import { formatDateFromUnix, formatSignedBps, shortAddress } from "../lib/format";

type MarketCardProps = {
  market: MarketView;
};

export function MarketCard({ market }: MarketCardProps) {
  const statusVariant = getStatusVariant(market.status);
  const yesPct = market.confidenceYesPct;
  const noPct = Math.max(0, 100 - yesPct);
  const delta = formatSignedBps(market.confidenceDeltaBps24h);
  const signal = signalLabel(market.signalStrength);

  return (
    <Link
      href={`/markets/${market.marketId.toString()}`}
      className="group panel block overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-300">
          Event #{market.marketId.toString()}
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-700/70 bg-slate-900 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">
            {signal}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${statusVariant.bg} ${statusVariant.text}`}>
            {statusLabel(market.status)}
          </span>
        </div>
      </div>

      <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-slate-100 group-hover:text-cyan-100">
        {market.question}
      </h2>
      <p className="mt-1.5 text-xs text-slate-500">
        Encrypted position sizing. Public confidence only.
      </p>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Market Probability</span>
          <span>{delta} 24h</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/80">
          <div
            className="h-full rounded-full bg-emerald-500/90 transition-all"
            style={{ width: `${yesPct.toFixed(2)}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-left">
            <p className="text-[11px] uppercase tracking-[0.1em] text-emerald-300">Yes</p>
            <p className="text-base font-semibold text-emerald-100">{yesPct.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-left">
            <p className="text-[11px] uppercase tracking-[0.1em] text-rose-300">No</p>
            <p className="text-base font-semibold text-rose-100">{noPct.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-300">
        <p className="text-slate-500">
          Participants
        </p>
        <p className="text-right font-medium text-slate-200">{market.participantCount.toString()}</p>
        <p className="text-slate-500">
          Deadline
        </p>
        <p className="text-right font-medium text-slate-200">{formatDateFromUnix(market.deadline)}</p>
        <p className="text-slate-500">
          Creator
        </p>
        <p className="text-right font-medium text-slate-200">{shortAddress(market.creator)}</p>
      </div>
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
