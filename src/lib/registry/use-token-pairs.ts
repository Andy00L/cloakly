"use client";

import { useMemo } from "react";
import { erc20Abi } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { WRAPPERS_REGISTRY_ADDRESS } from "@/lib/contracts/addresses";
import { WRAPPERS_REGISTRY_ABI } from "@/lib/contracts/registry-abi";
import { CONFIDENTIAL_WRAPPER_ABI } from "@/lib/contracts/wrapper-abi";
import { findCatalogEntry } from "@/lib/tokens/catalog";
import { LOCAL_PAIRS } from "@/lib/tokens/local-pairs";
import { shortenAddress } from "@/lib/format";
import type { TokenPair } from "@/lib/tokens/types";

export interface UseTokenPairsResult {
  pairs: TokenPair[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Reads the confidential-token pairs from the onchain Wrappers Registry (the primary
// source of truth), enriches each with verified catalog metadata, falls back to onchain
// metadata for any pair not in the catalog, and merges in locally declared pairs.
export function useTokenPairs(): UseTokenPairsResult {
  const pairsQuery = useReadContract({
    address: WRAPPERS_REGISTRY_ADDRESS,
    abi: WRAPPERS_REGISTRY_ABI,
    functionName: "getTokenConfidentialTokenPairs",
    chainId: APP_CHAIN_ID,
  });

  const pairsData = pairsQuery.data;

  // Pairs the local catalog does not describe: fetch their metadata onchain.
  const uncatalogued = useMemo(
    () =>
      (pairsData ?? []).filter(
        (pair) => !findCatalogEntry(pair.confidentialTokenAddress),
      ),
    [pairsData],
  );

  const metaContracts = useMemo(
    () =>
      uncatalogued.flatMap((pair) => [
        {
          address: pair.tokenAddress,
          abi: erc20Abi,
          functionName: "symbol",
          chainId: APP_CHAIN_ID,
        },
        {
          address: pair.tokenAddress,
          abi: erc20Abi,
          functionName: "name",
          chainId: APP_CHAIN_ID,
        },
        {
          address: pair.tokenAddress,
          abi: erc20Abi,
          functionName: "decimals",
          chainId: APP_CHAIN_ID,
        },
        {
          address: pair.confidentialTokenAddress,
          abi: CONFIDENTIAL_WRAPPER_ABI,
          functionName: "decimals",
          chainId: APP_CHAIN_ID,
        },
      ] as const),
    [uncatalogued],
  );

  const metaQuery = useReadContracts({
    contracts: metaContracts,
    query: { enabled: metaContracts.length > 0 },
  });

  const pairs = useMemo<TokenPair[]>(() => {
    const registryPairs = (pairsData ?? []).map<TokenPair>((pair) => {
      const entry = findCatalogEntry(pair.confidentialTokenAddress);
      if (entry) {
        return {
          underlying: pair.tokenAddress,
          confidential: pair.confidentialTokenAddress,
          isValid: pair.isValid,
          source: "registry",
          underlyingSymbol: entry.underlyingSymbol,
          confidentialSymbol: entry.confidentialSymbol,
          name: entry.name,
          underlyingDecimals: entry.underlyingDecimals,
          confidentialDecimals: entry.confidentialDecimals,
          hasPublicFaucet: entry.hasPublicFaucet,
        };
      }
      // Uncatalogued pair: read its metadata from the multicall by position.
      const metaIndex = uncatalogued.findIndex(
        (candidate) =>
          candidate.confidentialTokenAddress === pair.confidentialTokenAddress,
      );
      const base = metaIndex * 4;
      const symbol =
        readString(metaQuery.data?.[base]?.result) ?? shortenAddress(pair.tokenAddress);
      const name = readString(metaQuery.data?.[base + 1]?.result) ?? symbol;
      const underlyingDecimals = readNumber(metaQuery.data?.[base + 2]?.result) ?? 18;
      const confidentialDecimals = readNumber(metaQuery.data?.[base + 3]?.result) ?? 6;
      return {
        underlying: pair.tokenAddress,
        confidential: pair.confidentialTokenAddress,
        isValid: pair.isValid,
        source: "registry",
        underlyingSymbol: symbol,
        confidentialSymbol: `c${symbol}`,
        name,
        underlyingDecimals,
        confidentialDecimals,
        hasPublicFaucet: false,
      };
    });

    // Layer local (dev-only) pairs on top, skipping any already present onchain.
    const seen = new Set(registryPairs.map((pair) => pair.confidential.toLowerCase()));
    const localExtra = LOCAL_PAIRS.filter(
      (pair) => !seen.has(pair.confidential.toLowerCase()),
    );
    return [...registryPairs, ...localExtra];
  }, [pairsData, uncatalogued, metaQuery.data]);

  return {
    pairs,
    isLoading: pairsQuery.isLoading || metaQuery.isLoading,
    error: pairsQuery.error ?? metaQuery.error ?? null,
    refetch: () => {
      void pairsQuery.refetch();
    },
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return null;
}
