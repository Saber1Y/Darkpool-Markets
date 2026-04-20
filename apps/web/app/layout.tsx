import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "../components/providers";
import dynamic from "next/dynamic";

const ConnectWallet = dynamic(() => import("../components/connect-wallet").then((mod) => mod.ConnectWallet), {
  ssr: false,
  loading: () => <span className="h-7 w-20 animate-pulse rounded-lg bg-slate-800" />
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-slate-100">
        <Providers>
          <header className="sticky top-0 z-10 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
              <a href="/" className="text-sm font-semibold tracking-wide text-teal-300">
                DarkPool Markets
              </a>
              <nav className="flex items-center gap-4 text-sm text-slate-300">
                <a href="/" className="hover:text-white">
                  Markets
                </a>
                <ConnectWallet />
              </nav>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
