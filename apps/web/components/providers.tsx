"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { ReactNode, useState } from "react";

const config = createConfig({
  chains: [mainnet, baseSepolia],
  transports: {
    [mainnet.id]: http(),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL)
  },
  connectors: [injected()]
});

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} reconnectTimeout={0}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
