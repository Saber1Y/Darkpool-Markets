"use client";

import { useMemo, useState } from "react";

type TxHashRowProps = {
  label: string;
  hash?: `0x${string}`;
  isConfirming?: boolean;
};

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export function TxHashRow({ label, hash, isConfirming = false }: TxHashRowProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const txUrl = useMemo(() => {
    if (!hash) return null;
    const configuredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
    const fallbackPrefix = configuredChainId === 11155111 ? "https://sepolia.etherscan.io/tx" : undefined;
    const rawPrefix = process.env.NEXT_PUBLIC_TX_EXPLORER_URL_PREFIX ?? fallbackPrefix;
    if (!rawPrefix) return null;
    return `${withTrailingSlash(rawPrefix)}${hash}`;
  }, [hash]);

  if (!hash) return null;

  const shortHash = `${hash.slice(0, 10)}...${hash.slice(-8)}`;

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    } finally {
      setTimeout(() => setCopyState("idle"), 1500);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-500">{label}:</span>
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">{shortHash}</code>
        {isConfirming ? (
          <span className="text-amber-300">Confirming...</span>
        ) : (
          <span className="text-emerald-300">Confirmed</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyHash}
          className="rounded border border-slate-700 px-2 py-1 text-slate-200 transition hover:border-slate-600"
        >
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy hash"}
        </button>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-teal-700 px-2 py-1 text-teal-300 transition hover:border-teal-600"
          >
            Open explorer
          </a>
        )}
      </div>
    </div>
  );
}
