import { createConfig, http } from "wagmi";
// Import from the connector's own subpath, not the "wagmi/connectors" barrel: the
// barrel pulls wagmi's "tempo" connector, which has an unresolvable 'accounts' import
// in 3.6.21 and breaks the webpack build.
import { injected } from "wagmi/connectors/injected";
import { APP_CHAIN, MAINNET_CHAIN, REGISTRY_NETWORKS } from "@/lib/chain";

// Builds the wagmi config. Created once, client-side, inside the Providers component (via
// a useState initializer) so the relative RPC proxy paths resolve against the browser
// origin. Both transports point at the same-origin /api/rpc proxy (with a ?chain selector)
// so the Sepolia provider key stays server-side.
//
// EIP-6963 multi-injected discovery is on by default in wagmi, so useConnect().connectors
// lists every browser wallet the user has installed; injected() is the generic fallback.
// Ethereum mainnet is included for read-only registry browsing only.
export function createWagmiConfig() {
  return createConfig({
    chains: [APP_CHAIN, MAINNET_CHAIN],
    connectors: [injected()],
    transports: {
      [APP_CHAIN.id]: http(REGISTRY_NETWORKS.sepolia.rpcPath, { batch: true }),
      [MAINNET_CHAIN.id]: http(REGISTRY_NETWORKS.mainnet.rpcPath, { batch: true }),
    },
    // Next.js server-renders this client tree to HTML, so use wagmi's SSR-safe hydration:
    // the first render is disconnected on both server and client, and any prior connection
    // is restored after mount. Without this, a returning connected user hydrates mismatched
    // on the wallet controls. sourceRef: wagmi SSR guide.
    ssr: true,
  });
}

export type WagmiAppConfig = ReturnType<typeof createWagmiConfig>;
