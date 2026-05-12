"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useMemo } from "react";
import { predictionMarketAbi } from "../contracts/abi";
import { parseEther } from "viem";

type UseUserPositionResult = {
  sideYes: boolean | null;
  amount: bigint | null;
  exists: boolean;
  claimed: boolean;
  isLoading: boolean;
  error: Error | null;
};

export function useUserPosition(marketAddress: `0x${string}`): UseUserPositionResult {
  const { address } = useAccount();
  const { data, isLoading, error } = useReadContract({
    address: marketAddress,
    abi: predictionMarketAbi,
    functionName: "getMyPosition",
    query: { enabled: !!address }
  });

  return useMemo(() => {
    if (!address || !data) {
      return { sideYes: null, amount: null, exists: false, claimed: false, isLoading: false, error: null };
    }
    const [handlesSideYes, handlesAmount, exists, claimed] = data;
    return {
      sideYes: handlesSideYes as unknown as boolean,
      amount: handlesAmount as unknown as bigint,
      exists,
      claimed,
      isLoading,
      error: error as Error | null
    };
  }, [address, data, isLoading, error]);
}

type PlaceBetParams = {
  marketAddress: `0x${string}`;
  amount: string;
  encryptedSide: `0x${string}`;
  encryptedAmount: `0x${string}`;
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
      args: [params.encryptedSide, params.encryptedAmount, params.proof],
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
  encryptedAmount: `0x${string}`;
  proof: `0x${string}`;
};

export function useIncreaseBet() {
  const { writeContractAsync, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const increaseBet = async (params: IncreaseBetParams) => {
    await writeContractAsync({
      address: params.marketAddress,
      abi: predictionMarketAbi,
      functionName: "increaseBet",
      args: [params.encryptedAmount, params.proof],
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

  return { status: data as unknown as bigint | undefined, isLoading, error };
}
