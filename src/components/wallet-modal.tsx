"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useConnect, type Connector } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { ArrowUpRightIcon, CloseIcon, Spinner, WalletIcon } from "@/components/icons";
import { EASE_ENTER } from "@/lib/motion";

// Popular wallets suggested for install when the browser exposes none of them.
const INSTALLABLE_WALLETS = [
  { name: "MetaMask", match: /metamask/i, url: "https://metamask.io/download/" },
  { name: "Rabby", match: /rabby/i, url: "https://rabby.io" },
  { name: "Coinbase Wallet", match: /coinbase/i, url: "https://www.coinbase.com/wallet/downloads" },
] as const;

// The generic injected connector carries no wallet-specific name.
function walletLabel(connector: Connector): string {
  return connector.id === "injected" ? "Browser wallet" : connector.name;
}

function describeConnectError(error: Error): string {
  if (error.name === "ProviderNotFoundError" || /provider not found/i.test(error.message)) {
    return "No wallet found in this browser. Install one below, then reload.";
  }
  if (/reject|denied/i.test(error.message)) {
    return "Connection request was rejected in your wallet.";
  }
  return "shortMessage" in error && typeof error.shortMessage === "string"
    ? error.shortMessage
    : error.message;
}

// The wallet picker: lists installed wallets (EIP-6963 discovery) to connect, and
// suggests popular wallets to install when they are not detected. Rendered into
// document.body so the header's backdrop-filter does not trap the fixed overlay.
export function WalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connect, connectors, isPending, error } = useConnect();
  const [connectingUid, setConnectingUid] = useState<string | null>(null);

  // Escape closes the picker (external system: document keydown).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Prefer EIP-6963 discovered wallets (named, with an icon); fall back to the generic
  // injected entry when the browser exposes no discoverable wallet.
  const discovered = connectors.filter((candidate) => candidate.id !== "injected");
  const detected = discovered.length > 0 ? [...discovered] : [...connectors];
  const toInstall = INSTALLABLE_WALLETS.filter(
    (wallet) => !detected.some((connector) => wallet.match.test(connector.name)),
  );

  function handleConnect(connector: Connector) {
    setConnectingUid(connector.uid);
    connect(
      { connector, chainId: APP_CHAIN_ID },
      { onSuccess: onClose, onSettled: () => setConnectingUid(null) },
    );
  }

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "rgba(28,25,23,0.42)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    animation: "ck-fade-in 180ms ease",
  };
  const cardStyle: CSSProperties = {
    width: "100%",
    maxWidth: 380,
    padding: 20,
    animation: `ck-modal-in 260ms ${EASE_ENTER}`,
  };

  return createPortal(
    <div style={overlayStyle} onMouseDown={onClose}>
      <div
        className="ck-card"
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Connect a wallet"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-[19px] font-medium tracking-[-0.02em] text-ink">
            Connect a wallet
          </h2>
          <button
            type="button"
            className="ck-btn-ghost"
            style={{ height: 32, padding: "0 8px" }}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-0.5">
          {detected.map((connector) => {
            const busy = connectingUid === connector.uid && isPending;
            return (
              <button
                key={connector.uid}
                type="button"
                className="ck-wallet-option"
                disabled={connectingUid !== null}
                onClick={() => handleConnect(connector)}
              >
                <WalletBadge connector={connector} />
                <span className="min-w-0 flex-1 truncate">{walletLabel(connector)}</span>
                {busy ? <Spinner size={14} tone="bronze" /> : null}
              </button>
            );
          })}
        </div>

        {toInstall.length > 0 ? (
          <div className="mt-3 border-t border-line pt-3">
            <p className="ck-eyebrow px-3 pb-1.5">Don&apos;t have a wallet?</p>
            {toInstall.map((wallet) => (
              <a
                key={wallet.name}
                href={wallet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ck-wallet-option"
              >
                <span className="flex h-6 w-6 flex-none items-center justify-center text-faint">
                  <WalletIcon size={18} />
                </span>
                <span className="min-w-0 flex-1 truncate text-muted">Install {wallet.name}</span>
                <ArrowUpRightIcon size={12} className="flex-none text-bronze" />
              </a>
            ))}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 px-1 text-[12.5px] leading-snug text-revoked">
            {describeConnectError(error)}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

// A wallet's own icon (EIP-6963 data URI) when present, else a neutral wallet glyph.
function WalletBadge({ connector }: { connector: Connector }) {
  if (connector.icon) {
    return (
      <span
        aria-hidden="true"
        className="h-6 w-6 flex-none rounded-md bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${connector.icon}")` }}
      />
    );
  }
  return (
    <span className="flex h-6 w-6 flex-none items-center justify-center text-muted">
      <WalletIcon size={18} />
    </span>
  );
}
