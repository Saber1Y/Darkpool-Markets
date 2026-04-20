import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "../components/providers";
import { Header } from "../components/header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
