"use client";

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { shortenAddress } from "@/lib/format";
import { WalletModal } from "@/components/wallet-modal";

// Wallet control for the header. Disconnected: opens the wallet picker (installed wallets
// to connect + install suggestions). Connected: shows the address with a network dot
// (green on Sepolia, bronze off it) and a disconnect action.
export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!isConnected) {
    return (
      <>
        <button type="button" className="ck-btn" onClick={() => setPickerOpen(true)}>
          Connect wallet
        </button>
        <WalletModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
      </>
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
