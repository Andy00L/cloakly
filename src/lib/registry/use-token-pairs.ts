"use client";

import { useMemo } from "react";
import { erc20Abi } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { REGISTRY_NETWORKS, type RegistryNetwork } from "@/lib/chain";
import { registryAddressFor } from "@/lib/contracts/addresses";
import { WRAPPERS_REGISTRY_ABI } from "@/lib/contracts/registry-abi";
import { CONFIDENTIAL_WRAPPER_ABI } from "@/lib/contracts/wrapper-abi";
import { findCatalogEntry } from "@/lib/tokens/catalog";
import { LOCAL_PAIRS } from "@/lib/tokens/local-pairs";
import { shortenAddress } from "@/lib/format";
import type { TokenPair } from "@/lib/tokens/types";

export interface UseTokenPairsResult {
  pairs: TokenPair[];
  isLoading: boolean;
  // True while a read is in flight, including background refetches (drives the refresh spinner).
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

// Reads the confidential-token pairs from the onchain Wrappers Registry (the primary
// source of truth) on the given network. On Sepolia it enriches each pair with verified
// catalog metadata and merges locally declared pairs; on mainnet every pair's metadata is
// read onchain (the catalog and local pairs are Sepolia-specific).
export function useTokenPairs(network: RegistryNetwork = "sepolia"): UseTokenPairsResult {
  const chainId = REGISTRY_NETWORKS[network].chainId;
  const registryAddress = registryAddressFor(network);
  const useCatalog = network === "sepolia";

  const pairsQuery = useReadContract({
    address: registryAddress,
    abi: WRAPPERS_REGISTRY_ABI,
    functionName: "getTokenConfidentialTokenPairs",
    chainId,
  });

  const pairsData = pairsQuery.data;

  // Pairs the catalog does not describe (all of them off Sepolia): fetch metadata onchain.
  const uncatalogued = useMemo(
    () =>
      (pairsData ?? []).filter(
        (pair) => !(useCatalog && findCatalogEntry(pair.confidentialTokenAddress)),
      ),
    [pairsData, useCatalog],
  );

  const metaContracts = useMemo(
    () =>
      uncatalogued.flatMap((pair) => [
        { address: pair.tokenAddress, abi: erc20Abi, functionName: "symbol", chainId },
        { address: pair.tokenAddress, abi: erc20Abi, functionName: "name", chainId },
        { address: pair.tokenAddress, abi: erc20Abi, functionName: "decimals", chainId },
        {
          address: pair.confidentialTokenAddress,
          abi: CONFIDENTIAL_WRAPPER_ABI,
          functionName: "decimals",
          chainId,
        },
      ] as const),
    [uncatalogued, chainId],
  );

  const metaQuery = useReadContracts({
    contracts: metaContracts,
    query: { enabled: metaContracts.length > 0 },
  });

  const pairs = useMemo<TokenPair[]>(() => {
    const registryPairs = (pairsData ?? []).map<TokenPair>((pair) => {
      const entry = useCatalog ? findCatalogEntry(pair.confidentialTokenAddress) : undefined;
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

    // Layer local (Sepolia dev-only) pairs on top, skipping any already present onchain.
    const seen = new Set(registryPairs.map((pair) => pair.confidential.toLowerCase()));
    const localExtra = useCatalog
      ? LOCAL_PAIRS.filter((pair) => !seen.has(pair.confidential.toLowerCase()))
      : [];
    return [...registryPairs, ...localExtra];
  }, [pairsData, uncatalogued, metaQuery.data, useCatalog]);

  return {
    pairs,
    isLoading: pairsQuery.isLoading || metaQuery.isLoading,
    isFetching: pairsQuery.isFetching || metaQuery.isFetching,
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
