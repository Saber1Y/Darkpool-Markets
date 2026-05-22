"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

const navItems = [
  { href: "/", label: "Markets" },
  { href: "/dashboard", label: "Resolver" },
];

export function Header() {
  const { authenticated, user, login, logout } = usePrivy();
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="sticky top-0 z-30 border-b border-slate-700/70 bg-slate-950/85 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.25 }}
        className="border-b border-slate-800/80 bg-slate-900/50"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.85)]" />
            Live Markets
          </span>
          <span>Encrypted Positioning via fhEVM</span>
        </div>
      </motion.div>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-sm font-semibold text-cyan-200">
            DP
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide text-slate-100 group-hover:text-cyan-200">
              DarkPool Markets
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Confidential Prediction Exchange
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.href}
                whileHover={{ y: -1, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 350, damping: 24 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-600 md:inline-flex"
          >
            Explore
          </Link>
          {authenticated && user?.wallet ? (
            <motion.button
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => logout()}
              className={cn(
                "rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100",
                "transition hover:border-cyan-300/60 hover:bg-cyan-500/20",
              )}
            >
              {shortAddress(user.wallet.address)}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => login()}
              className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Connect Wallet
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
