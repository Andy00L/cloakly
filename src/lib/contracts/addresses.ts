import type { Address } from "viem";
import type { RegistryNetwork } from "@/lib/chain";

// Zama Wrappers Registry addresses. The registry is the PRIMARY source of truth: pairs
// are enumerated onchain via getTokenConfidentialTokenPairs() rather than hardcoded. A
// local catalog (see tokens/catalog.ts) is layered on top only to enrich Sepolia display
// metadata and to declare custom / dev-only pairs.
// sourceRef (Sepolia):  https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia#wrappers-registry
// sourceRef (Ethereum): https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum#wrappers-registry
export const WRAPPERS_REGISTRY_ADDRESS: Address =
  "0x2f0750Bbb0A246059d80e94c454586a7F27a128e";

export const WRAPPERS_REGISTRY_ADDRESS_MAINNET: Address =
  "0xeb5015fF021DB115aCe010f23F55C2591059bBA0";

// The registry address for a browsing network.
export function registryAddressFor(network: RegistryNetwork): Address {
  return network === "mainnet"
    ? WRAPPERS_REGISTRY_ADDRESS_MAINNET
    : WRAPPERS_REGISTRY_ADDRESS;
}
