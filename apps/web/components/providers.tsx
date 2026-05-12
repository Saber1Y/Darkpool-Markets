"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";
import { ReactNode, useState } from "react";

const config = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http()
  }
});

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "your-privy-app-id"}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#14b8a6"
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets"
        }
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
