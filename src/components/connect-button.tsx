"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { shortenAddress } from "@/lib/format";

const PRIMARY_BUTTON =
  "rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50";
const SUBTLE_BUTTON =
  "rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800";

// Wallet control: connect an injected wallet, prompt a network switch to Sepolia, or
// show the connected address with a disconnect action.
export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  if (!isConnected) {
    const injectedConnector = connectors[0];
    return (
      <button
        type="button"
        className={PRIMARY_BUTTON}
        disabled={isConnecting || !injectedConnector}
        onClick={() => {
          if (injectedConnector) connect({ connector: injectedConnector });
        }}
      >
        {isConnecting ? "Connecting..." : "Connect wallet"}
      </button>
    );
  }

  if (chainId !== APP_CHAIN_ID) {
    return (
      <button
        type="button"
        className={PRIMARY_BUTTON}
        disabled={isSwitching}
        onClick={() => switchChain({ chainId: APP_CHAIN_ID })}
      >
        {isSwitching ? "Switching..." : "Switch to Sepolia"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
        {address ? shortenAddress(address) : ""}
      </span>
      <button type="button" className={SUBTLE_BUTTON} onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  );
}
