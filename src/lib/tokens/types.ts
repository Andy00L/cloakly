import type { Address } from "viem";

// A confidential-token pair as surfaced to the UI: the ERC-20 underlying and its
// ERC-7984 confidential wrapper, with display metadata and provenance. Built by the
// registry reader from onchain pairs (source of truth) enriched with the local catalog.
export interface TokenPair {
  // ERC-20 underlying token address.
  underlying: Address;
  // ERC-7984 confidential wrapper address.
  confidential: Address;
  // false once the registry revokes the wrapper; such pairs are shown but not actionable.
  isValid: boolean;
  // Where the pair was discovered: the onchain registry, or a local (dev-only) declaration.
  source: "registry" | "local";
  underlyingSymbol: string;
  confidentialSymbol: string;
  name: string;
  underlyingDecimals: number;
  confidentialDecimals: number;
  // Whether the underlying exposes the public ERC20Mock mint() faucet.
  hasPublicFaucet: boolean;
}
