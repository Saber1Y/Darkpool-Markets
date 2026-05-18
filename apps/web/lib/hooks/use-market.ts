"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useMemo } from "react";
import { predictionMarketAbi } from "../contracts/abi";
import { parseEther } from "viem";

type UseUserPositionResult = {
  sideYesHandle: `0x${string}` | null;
  amountHandle: `0x${string}` | null;
  exists: boolean;
  claimed: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useUserPosition(marketAddress: `0x${string}`): UseUserPositionResult {
  const { address } = useAccount();
  const { data, isLoading, error, refetch } = useReadContract({
    address: marketAddress,
    abi: predictionMarketAbi,
    functionName: "getMyPosition",
    query: { enabled: !!address }
  });

  return useMemo(() => {
    if (!address || !data) {
      return {
        sideYesHandle: null,
        amountHandle: null,
        exists: false,
        claimed: false,
        isLoading: false,
        error: null,
        refetch
      };
    }
    const [handlesSideYes, handlesAmount, exists, claimed] = data;
    return {
      sideYesHandle: handlesSideYes as `0x${string}`,
      amountHandle: handlesAmount as `0x${string}`,
      exists,
      claimed,
      isLoading,
      error: error as Error | null,
      refetch
    };
  }, [address, data, isLoading, error, refetch]);
}

type PlaceBetParams = {
  marketAddress: `0x${string}`;
  amount: string;
  encryptedSide: `0x${string}`;
  proof: `0x${string}`;
};

export function usePlaceBet() {
  const { writeContractAsync, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const placeBet = async (params: PlaceBetParams) => {
    await writeContractAsync({
      address: params.marketAddress,
      abi: predictionMarketAbi,
      functionName: "placeBet",
      gas: 15_000_000n,
      args: [params.encryptedSide, params.proof],
      value: parseEther(params.amount)
    });
  };

  return {
    placeBet,
    isPending,
    isConfirming,
    isLoading: isPending || isConfirming,
    txHash
  };
}

type IncreaseBetParams = {
  marketAddress: `0x${string}`;
  additionalAmount: string;
};

export function useIncreaseBet() {
  const { writeContractAsync, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const increaseBet = async (params: IncreaseBetParams) => {
    await writeContractAsync({
      address: params.marketAddress,
      abi: predictionMarketAbi,
      functionName: "increaseBet",
      gas: 15_000_000n,
      args: [],
      value: parseEther(params.additionalAmount)
    });
  };

  return {
    increaseBet,
    isPending,
    isConfirming,
    isLoading: isPending || isConfirming,
    txHash
  };
}

export function useMarketStatus(marketAddress: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: marketAddress,
    abi: predictionMarketAbi,
    functionName: "status"
  });

  const status = useMemo(() => {
    if (typeof data === "bigint") return data;
    if (typeof data === "number") return BigInt(data);
    return undefined;
  }, [data]);

  return { status, isLoading, error };
}
