import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-slate-100">
        <header className="sticky top-0 z-10 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
            <Link href="/" className="text-sm font-semibold tracking-wide text-teal-300">
              DarkPool Markets
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              <Link href="/" className="hover:text-white">
                Markets
              </Link>
              <span className="rounded border border-teal-500/40 px-2 py-1 text-xs text-teal-300">
                Local Read-Only
              </span>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
