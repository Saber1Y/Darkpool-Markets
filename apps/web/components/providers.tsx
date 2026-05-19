"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { ReactNode, useState } from "react";

const configuredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? hardhat.id);
const selectedChainId = configuredChainId === sepolia.id ? sepolia.id : hardhat.id;
const defaultRpcUrl = selectedChainId === sepolia.id
  ? "https://ethereum-sepolia-rpc.publicnode.com"
  : "http://127.0.0.1:8545";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? defaultRpcUrl;

const config = createConfig({
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http(selectedChainId === hardhat.id ? rpcUrl : "http://127.0.0.1:8545"),
    [sepolia.id]: http(selectedChainId === sepolia.id ? rpcUrl : "https://ethereum-sepolia-rpc.publicnode.com")
  },
  multiInjectedProviderDiscovery: true
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
