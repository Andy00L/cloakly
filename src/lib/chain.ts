import { mainnet, sepolia } from "viem/chains";

// The writable chain: all transacting (shield / unshield / decrypt / faucet) happens on
// Ethereum Sepolia, as the Bounty Track requires ("Support Sepolia").
// sourceRef: 02-bounty-track-wrapper-registry.md.
export const APP_CHAIN = sepolia;
export const APP_CHAIN_ID = sepolia.id; // 11155111

// Ethereum mainnet is supported for read-only registry browsing only (see below).
export const MAINNET_CHAIN = mainnet;
export const MAINNET_CHAIN_ID = mainnet.id; // 1

// The two registry-browsing networks. Each rpcPath below points at the same-origin
// /api/rpc proxy (route handler at src/app/api/rpc/route.ts) with a ?chain selector, so
// Sepolia keeps its provider key server-side and the browser never calls a provider
// directly. Sepolia is the live, writable network; Ethereum
// mainnet is browse-only (read the official registry, no transacting), which lets the
// app surface both networks' pairs without putting real funds at risk.
export type RegistryNetwork = "sepolia" | "mainnet";

export interface RegistryNetworkConfig {
  network: RegistryNetwork;
  chainId: number;
  label: string;
  // Whether wrap / unwrap / faucet / decrypt are available (true only for Sepolia).
  writable: boolean;
  // Address explorer base, no trailing slash.
  explorerBase: string;
  // Same-origin proxy path with the chain selector.
  rpcPath: string;
}

export const REGISTRY_NETWORKS: Record<RegistryNetwork, RegistryNetworkConfig> = {
  sepolia: {
    network: "sepolia",
    chainId: sepolia.id,
    label: "Sepolia",
    writable: true,
    explorerBase: "https://sepolia.etherscan.io/address",
    rpcPath: "/api/rpc?chain=sepolia",
  },
  mainnet: {
    network: "mainnet",
    chainId: mainnet.id,
    label: "Ethereum",
    writable: false,
    explorerBase: "https://etherscan.io/address",
    rpcPath: "/api/rpc?chain=mainnet",
  },
};
