"use client";

import { type ReactNode } from "react";
import { useAccount } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { useTokenPairs } from "@/lib/registry/use-token-pairs";
import { ConnectButton } from "@/components/connect-button";
import { TokenPairCard } from "@/components/token-pair-card";
import { DecryptPanel } from "@/components/decrypt-panel";

// The main interactive view: wallet state, the onchain registry grid, and the
// arbitrary-token decrypt panel. Kept as a client component so page.tsx stays server.
export function Dashboard() {
  const { isConnected, chainId } = useAccount();
  const { pairs, isLoading, error, refetch } = useTokenPairs();
  const wrongNetwork = isConnected && chainId !== APP_CHAIN_ID;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">cloakly</h1>
          <p className="text-sm text-zinc-500">
            Confidential ERC-7984 wrapper registry on Ethereum Sepolia.
          </p>
        </div>
        <ConnectButton />
      </header>

      {!isConnected ? (
        <Notice>Connect a wallet to browse the registry and move confidential tokens.</Notice>
      ) : wrongNetwork ? (
        <Notice tone="warn">
          Your wallet is on the wrong network. Switch to Sepolia to continue.
        </Notice>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Registry pairs</h2>
          <button
            type="button"
            onClick={refetch}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>
        {isLoading ? (
          <p className="text-sm text-zinc-500">Reading the onchain registry...</p>
        ) : error ? (
          <Notice tone="warn">Could not read the registry: {error.message}</Notice>
        ) : pairs.length === 0 ? (
          <p className="text-sm text-zinc-500">No pairs are registered yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pairs.map((pair) => (
              <TokenPairCard key={pair.confidential} pair={pair} />
            ))}
          </div>
        )}
      </section>

      <DecryptPanel />

      <footer className="border-t border-zinc-900 pt-6 text-xs text-zinc-600">
        cloakly reads the onchain Confidential Wrappers Registry as its source of truth. Test
        tokens come from public faucets; confidential balances stay encrypted until you decrypt
        them with your wallet.
      </footer>
    </div>
  );
}

function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  const toneClass =
    tone === "warn"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-zinc-800 bg-zinc-900/60 text-zinc-400";
  return <div className={`rounded-xl border px-4 py-3 text-sm ${toneClass}`}>{children}</div>;
}
