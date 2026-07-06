import type { Address } from "viem";

// Static display + faucet metadata for the official Sepolia cToken pairs, each verified
// onchain (every wrapper's underlying() and both tokens' decimals were read from chain;
// the wrapper implementation is Sourcify-verified). This is the SECONDARY, enrichment
// layer: the app enumerates pairs from the onchain Wrappers Registry as the source of
// truth, then matches by confidential address to attach these labels and the faucet flag.
// New custom / dev-only pairs can be declared here too (source: "local" in the reader).
//
// All confidential wrappers report decimals() = 6. Every underlying is an ERC20Mock with
// a public mint(address,uint256) faucet.
// sourceRef: https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia
export interface CatalogEntry {
  confidential: Address;
  underlying: Address;
  underlyingSymbol: string;
  confidentialSymbol: string;
  name: string;
  underlyingDecimals: number;
  confidentialDecimals: number;
  hasPublicFaucet: boolean;
}

export const CTOKEN_CATALOG: readonly CatalogEntry[] = [
  {
    confidential: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
    underlying: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
    underlyingSymbol: "USDC",
    confidentialSymbol: "cUSDC",
    name: "USD Coin",
    underlyingDecimals: 6,
    confidentialDecimals: 6,
    hasPublicFaucet: true,
  },
  {
    confidential: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
    underlying: "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0",
    underlyingSymbol: "USDT",
    confidentialSymbol: "cUSDT",
    name: "Tether USD",
    underlyingDecimals: 6,
    confidentialDecimals: 6,
    hasPublicFaucet: true,
  },
  {
    confidential: "0x46208622DA27d91db4f0393733C8BA082ed83158",
    underlying: "0xff54739b16576FA5402F211D0b938469Ab9A5f3F",
    underlyingSymbol: "WETH",
    confidentialSymbol: "cWETH",
    name: "Wrapped Ether",
    underlyingDecimals: 18,
    confidentialDecimals: 6,
    hasPublicFaucet: true,
  },
  {
    confidential: "0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891",
    underlying: "0xFf021fB13cA64e5354c62c954b949a88cfDEb25E",
    underlyingSymbol: "BRON",
    confidentialSymbol: "cBRON",
    name: "Bron",
    underlyingDecimals: 18,
    confidentialDecimals: 6,
    hasPublicFaucet: true,
  },
  {
    confidential: "0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB",
    underlying: "0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57",
    underlyingSymbol: "ZAMA",
    confidentialSymbol: "cZAMA",
    name: "Zama",
    underlyingDecimals: 18,
    confidentialDecimals: 6,
    hasPublicFaucet: true,
  },
  {
    confidential: "0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC",
    underlying: "0x93c931278A2aad1916783F952f94276eA5111442",
    underlyingSymbol: "tGBP",
    confidentialSymbol: "ctGBP",
    name: "Test GBP",
    underlyingDecimals: 18,
    confidentialDecimals: 6,
    hasPublicFaucet: true,
  },
  {
    confidential: "0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7",
    underlying: "0x24377AE4AA0C45ecEe71225007f17c5D423dd940",
    underlyingSymbol: "XAUt",
    confidentialSymbol: "cXAUt",
    name: "Tether Gold",
    underlyingDecimals: 6,
    confidentialDecimals: 6,
    hasPublicFaucet: true,
  },
] as const;

// Case-insensitive lookup by confidential (wrapper) address.
const BY_CONFIDENTIAL: ReadonlyMap<string, CatalogEntry> = new Map(
  CTOKEN_CATALOG.map((entry) => [entry.confidential.toLowerCase(), entry] as const),
);

export function findCatalogEntry(confidential: Address): CatalogEntry | undefined {
  return BY_CONFIDENTIAL.get(confidential.toLowerCase());
}
