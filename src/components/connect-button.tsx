"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { shortenAddress } from "@/lib/format";

// Wallet control for the header: connect an injected wallet, or show the connected
// address with a disconnect action. The network dot is green on Sepolia and bronze off
// it; switching networks is offered by the wrong-network banner, not here.
export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    const injectedConnector = connectors[0];
    return (
      <button
        type="button"
        className="ck-btn"
        disabled={isConnecting || !injectedConnector}
        onClick={() => {
          if (injectedConnector) connect({ connector: injectedConnector });
        }}
      >
        {isConnecting ? "Connecting..." : "Connect wallet"}
      </button>
    );
  }

  const onSepolia = chainId === APP_CHAIN_ID;

  return (
    <div className="flex items-center gap-2">
      <div className="ck-well inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-[15px] font-mono text-[13px] text-ink">
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] flex-none rounded-full"
          style={{
            background: onSepolia ? "var(--color-registered)" : "var(--color-bronze)",
            boxShadow: "0 0 0 3px rgba(28,25,23,0.05)",
          }}
        />
        {address ? shortenAddress(address) : ""}
      </div>
      <button type="button" className="ck-btn-ghost" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  );
}
