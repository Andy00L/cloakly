import { createConfig, http } from "wagmi";
// Import from the connector's own subpath, not the "wagmi/connectors" barrel: the
// barrel pulls wagmi's "tempo" connector, which has an unresolvable 'accounts' import
// in 3.6.21 and breaks the webpack build.
import { injected } from "wagmi/connectors/injected";
import { APP_CHAIN, RPC_PROXY_PATH } from "@/lib/chain";

// Builds the wagmi config. It is created once, client-side, inside the Providers
// component (via a useState initializer) so the relative RPC proxy path resolves
// against the browser origin. The transport points at /api/rpc (same-origin), so
// the Infura key that SEPOLIA_RPC_URL carries stays server-side.
//
// Injected connector only: MetaMask and compatible browser-extension wallets.
export function createWagmiConfig() {
  return createConfig({
    chains: [APP_CHAIN],
    connectors: [injected()],
    transports: {
      [APP_CHAIN.id]: http(RPC_PROXY_PATH, {
        // Batch multiple eth_call reads into fewer round-trips through the proxy.
        batch: true,
      }),
    },
    // Config is instantiated in the browser; no server-side transport calls.
    ssr: false,
  });
}

export type WagmiAppConfig = ReturnType<typeof createWagmiConfig>;
