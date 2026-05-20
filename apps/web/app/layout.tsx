import "./globals.css";
import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import { Providers } from "../components/providers";
import { Header } from "../components/header";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"]
});

export const metadata = {
  title: "DarkPool Markets",
  description: "Privacy-preserving prediction markets powered by fully homomorphic encryption"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} min-h-screen bg-slate-950 text-slate-100`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
