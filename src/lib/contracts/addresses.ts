import type { Address } from "viem";

// Zama Wrappers Registry on Sepolia. This is the PRIMARY source of truth for the
// app: pairs are enumerated onchain via getTokenConfidentialTokenPairs() rather
// than hardcoded. A local catalog (see tokens/catalog.ts) is layered on top only
// to declare custom / dev-only pairs and to enrich display metadata.
// sourceRef: https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia#wrappers-registry
export const WRAPPERS_REGISTRY_ADDRESS: Address =
  "0x2f0750Bbb0A246059d80e94c454586a7F27a128e";
