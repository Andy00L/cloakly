import { sepolia } from "viem/chains";

// cloakly targets Ethereum Sepolia only. The Bounty Track requires that
// shield / unshield / decrypt all work on Sepolia.
// sourceRef: 02-bounty-track-wrapper-registry.md ("Support Sepolia").
export const APP_CHAIN = sepolia;

// Numeric chain id, 11155111 for Sepolia. Kept as a named constant so UI code
// can compare the connected chain without importing the whole chain object.
export const APP_CHAIN_ID = sepolia.id;

// Same-origin path of the JSON-RPC proxy (route handler at src/app/api/rpc/route.ts).
// The browser talks to this instead of Infura directly, so the RPC key that
// SEPOLIA_RPC_URL carries stays server-side and never enters the client bundle.
export const RPC_PROXY_PATH = "/api/rpc";
