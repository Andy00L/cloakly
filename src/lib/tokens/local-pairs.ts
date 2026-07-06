import type { TokenPair } from "@/lib/tokens/types";

// Custom / dev-only pairs declared locally, merged on top of the onchain registry
// (which stays the primary source of truth). This is the documented extension point:
// to surface a pair that is not yet registered onchain, append a TokenPair below.
// A registry pair with the same confidential address always takes precedence.
// See the README section "Adding a new pair".
//
// Example:
//   {
//     underlying: "0xYourErc20...",
//     confidential: "0xYourErc7984Wrapper...",
//     isValid: true,
//     source: "local",
//     underlyingSymbol: "DAI",
//     confidentialSymbol: "cDAI",
//     name: "Dai Stablecoin",
//     underlyingDecimals: 18,
//     confidentialDecimals: 6,
//     hasPublicFaucet: false,
//   },
export const LOCAL_PAIRS: readonly TokenPair[] = [];
