"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { cn } from "../lib/utils";

export function Header() {
  const { authenticated, user, login, logout } = usePrivy();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="text-sm font-semibold tracking-wide text-teal-300 hover:text-teal-200">
          DarkPool Markets
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm text-slate-300 transition hover:text-white">
            Markets
          </Link>
          {authenticated && user?.wallet ? (
            <button
              onClick={() => logout()}
              className={cn(
                "rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200",
                "transition hover:bg-slate-700"
              )}
            >
              {shortAddress(user.wallet.address)}
            </button>
          ) : (
            <button
              onClick={() => login()}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-500"
            >
              Connect Wallet
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
