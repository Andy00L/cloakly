"use client";

import { type CSSProperties } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { useTokenPairs } from "@/lib/registry/use-token-pairs";
import { SiteHeader } from "@/components/site-header";
import { ConnectButton } from "@/components/connect-button";
import { TokenPairCard } from "@/components/token-pair-card";
import { TokenCardSkeleton } from "@/components/token-card-skeleton";
import { DecryptPanel } from "@/components/decrypt-panel";
import { AlertTriangleIcon, LayersIcon, LockClosedIcon, RefreshIcon } from "@/components/icons";
import { EASE_ENTER } from "@/lib/motion";

// The card grid: as many ~360px columns as fit, filling the row.
const GRID_STYLE: CSSProperties = {
  display: "grid",
  gap: 24,
  gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))",
};

const SKELETON_COUNT = 4;

// The main view: the warm paper field, the sticky header, wallet-state gating, the
// onchain registry grid (with loading, empty, and error states), and the decrypt panel.
export function Dashboard() {
  const { isConnected, chainId } = useAccount();
  const { pairs, isLoading, isFetching, error, refetch } = useTokenPairs();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const wrongNetwork = isConnected && chainId !== APP_CHAIN_ID;

  return (
    <div className="ck-field flex min-h-screen flex-col">
      <div className="ck-vignette" aria-hidden="true" />
      <div className="ck-grain" aria-hidden="true" />

      <SiteHeader />

      <main className="relative z-[1] mx-auto w-full max-w-[68rem] flex-1 px-5 pb-[132px] pt-[26px] sm:px-8">
        <p className="font-serif text-[19px] font-medium leading-[1.4] tracking-[-0.02em] text-muted">
          Confidential ERC-7984 wrapper registry on Ethereum Sepolia
        </p>

        {!isConnected ? (
          <DisconnectedNotice />
        ) : (
          <div className="mt-[34px] flex flex-col gap-14">
            {wrongNetwork ? (
              <WrongNetworkBanner
                switching={isSwitching}
                onSwitch={() => switchChain({ chainId: APP_CHAIN_ID })}
              />
            ) : null}

            <section>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif text-[26px] font-medium tracking-[-0.02em] text-ink">
                  Registry pairs
                </h2>
                <button type="button" className="ck-btn-quiet" onClick={refetch}>
                  <span
                    className="inline-flex"
                    style={{ animation: isFetching ? "ck-spin 0.8s linear infinite" : "none" }}
                  >
                    <RefreshIcon size={15} />
                  </span>
                  <span>Refresh</span>
                </button>
              </div>

              <div className="mt-5">
                {isLoading ? (
                  <div style={GRID_STYLE}>
                    {Array.from({ length: SKELETON_COUNT }, (_unused, position) => (
                      <TokenCardSkeleton key={position} index={position} />
                    ))}
                  </div>
                ) : error ? (
                  <ErrorBanner onRetry={refetch} />
                ) : pairs.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div style={GRID_STYLE}>
                    {pairs.map((pair, position) => (
                      <TokenPairCard key={pair.confidential} pair={pair} index={position} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <DecryptPanel />
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}

function DisconnectedNotice() {
  return (
    <div className="mt-11 flex justify-center" style={{ animation: `ck-rise 320ms ${EASE_ENTER} backwards` }}>
      <div className="ck-card flex w-full max-w-[540px] flex-col items-center gap-[18px] px-9 py-10 text-center">
        <LockClosedIcon size={26} strokeWidth={1.8} className="text-bronze" />
        <p className="max-w-[32ch] font-serif text-[22px] font-medium leading-[1.4] tracking-[-0.02em] text-ink">
          Connect a wallet to browse the registry and move confidential tokens.
        </p>
        <ConnectButton />
      </div>
    </div>
  );
}

function WrongNetworkBanner({ switching, onSwitch }: { switching: boolean; onSwitch: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] py-[13px] pl-4 pr-[14px]"
      style={{
        background: "rgba(154,91,19,0.08)",
        border: "1px solid rgba(154,91,19,0.22)",
        animation: `ck-rise 300ms ${EASE_ENTER} backwards`,
      }}
    >
      <div className="flex min-w-0 items-center gap-[11px]">
        <AlertTriangleIcon size={16} className="flex-none text-bronze" />
        <span className="text-sm text-ink-soft">Your wallet is on the wrong network. Switch to Sepolia.</span>
      </div>
      <button type="button" className="ck-btn" onClick={onSwitch} disabled={switching}>
        {switching ? "Switching…" : "Switch to Sepolia"}
      </button>
    </div>
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl py-[18px] pl-5 pr-[18px]"
      style={{
        background: "rgba(166,61,50,0.10)",
        border: "1px solid rgba(166,61,50,0.22)",
        animation: `ck-rise 320ms ${EASE_ENTER} backwards`,
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <AlertTriangleIcon size={17} className="flex-none text-revoked" />
        <span className="text-[14.5px] text-ink-soft">Could not read the registry.</span>
      </div>
      <button type="button" className="ck-btn-quiet" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-4 px-6 py-[72px] text-center"
      style={{ animation: `ck-rise 320ms ${EASE_ENTER} backwards` }}
    >
      <LayersIcon size={34} className="text-[color:rgba(28,25,23,0.22)]" />
      <div className="font-serif text-xl font-medium tracking-[-0.02em] text-muted">
        No pairs are registered yet.
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-14 border-t border-line pt-[22px]">
      <p className="flex max-w-[72ch] items-start gap-[9px] text-[12.5px] leading-[1.55] text-faint">
        <span className="mt-0.5 flex-none">
          <LockClosedIcon size={13} className="text-bronze" />
        </span>
        <span>
          cloakly reads the on-chain Confidential Wrappers Registry as its source of truth. Balances
          stay encrypted until you decrypt them.
        </span>
      </p>
    </footer>
  );
}
