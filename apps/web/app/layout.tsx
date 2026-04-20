import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "../components/providers";
import { Header } from "../components/header";

export const metadata = {
  title: "DarkPool Markets",
  description: "Privacy-preserving prediction markets powered by fully homomorphic encryption"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sora">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
