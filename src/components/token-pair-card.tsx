"use client";

import { useState } from "react";
import { erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { useFaucet } from "@/lib/actions/use-faucet";
import { useWrap, type WrapStep } from "@/lib/actions/use-wrap";
import { useUnwrap, type UnwrapStep } from "@/lib/actions/use-unwrap";
import { useDecryptBalance } from "@/lib/actions/use-decrypt-balance";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
import { AmountAction } from "@/components/amount-action";
import type { TokenPair } from "@/lib/tokens/types";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/address/";

export function TokenPairCard({ pair }: { pair: TokenPair }) {
  const { address, isConnected, chainId } = useAccount();
  const onSepolia = isConnected && chainId === APP_CHAIN_ID;

  const underlyingBalance = useReadContract({
    address: pair.underlying,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: APP_CHAIN_ID,
    query: { enabled: Boolean(address) },
  });

  const faucet = useFaucet();
  const wrap = useWrap();
  const unwrap = useUnwrap();
  const decrypt = useDecryptBalance();
  const [confidentialBalance, setConfidentialBalance] = useState<bigint | null>(null);

  function refreshUnderlying() {
    void underlyingBalance.refetch();
  }

  async function handleFaucet(amount: string) {
    const result = await faucet.run(pair, amount);
    if (result.ok) refreshUnderlying();
  }
  async function handleWrap(amount: string) {
    const result = await wrap.run(pair, amount);
    if (result.ok) {
      refreshUnderlying();
      setConfidentialBalance(null); // confidential balance changed; require a fresh decrypt
    }
  }
  async function handleUnwrap(amount: string) {
    const result = await unwrap.run(pair, amount);
    if (result.ok) {
      refreshUnderlying();
      setConfidentialBalance(null);
    }
  }
  async function handleDecrypt() {
    const result = await decrypt.run(pair.confidential);
    if (result.ok) setConfidentialBalance(result.value);
  }

  const underlyingDisplay =
    onSepolia && underlyingBalance.data !== undefined
      ? formatTokenAmount(underlyingBalance.data, pair.underlyingDecimals)
      : "-";
  const decrypting = decrypt.status === "loading" || decrypt.status === "decrypting";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-100">{pair.underlyingSymbol}</h3>
            <span className="text-zinc-600">to</span>
            <h3 className="text-base font-semibold text-violet-300">{pair.confidentialSymbol}</h3>
          </div>
          <p className="text-sm text-zinc-500">{pair.name}</p>
        </div>
        <span
          className={
            pair.isValid
              ? "rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400"
              : "rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-400"
          }
        >
          {pair.isValid ? "registered" : "revoked"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <AddressLink label="ERC-20" address={pair.underlying} />
        <AddressLink label="ERC-7984" address={pair.confidential} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-500">{pair.underlyingSymbol} balance</p>
          <p className="mt-1 font-mono text-sm text-zinc-100">{underlyingDisplay}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-500">{pair.confidentialSymbol} balance</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-mono text-sm text-zinc-100">
              {confidentialBalance !== null
                ? formatTokenAmount(confidentialBalance, pair.confidentialDecimals)
                : "encrypted"}
            </span>
            <button
              type="button"
              onClick={handleDecrypt}
              disabled={!onSepolia || decrypting}
              className="rounded-md border border-violet-800 px-2 py-1 text-xs text-violet-300 transition-colors hover:bg-violet-950/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {decrypt.status === "decrypting"
                ? "decrypting..."
                : decrypt.status === "loading"
                  ? "reading..."
                  : "decrypt"}
            </button>
          </div>
          {decrypt.error ? (
            <p className="mt-1 text-xs text-red-400">{decrypt.error.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
        {pair.hasPublicFaucet ? (
          <AmountAction
            title={`Faucet: mint ${pair.underlyingSymbol}`}
            buttonLabel="Mint"
            disabled={!onSepolia}
            busy={faucet.status === "minting" || faucet.status === "confirming"}
            statusLabel={faucet.status === "confirming" ? "confirming..." : "minting..."}
            errorMessage={faucet.error?.message ?? null}
            onSubmit={handleFaucet}
          />
        ) : null}
        <AmountAction
          title={`Wrap ${pair.underlyingSymbol} into ${pair.confidentialSymbol}`}
          buttonLabel="Wrap"
          disabled={!onSepolia || !pair.isValid}
          busy={wrap.step !== "idle" && wrap.step !== "done"}
          statusLabel={wrapStatusLabel(wrap.step)}
          errorMessage={wrap.error?.message ?? null}
          onSubmit={handleWrap}
        />
        <AmountAction
          title={`Unwrap ${pair.confidentialSymbol} back to ${pair.underlyingSymbol}`}
          buttonLabel="Unwrap"
          disabled={!onSepolia || !pair.isValid}
          busy={unwrap.step !== "idle" && unwrap.step !== "done"}
          statusLabel={unwrapStatusLabel(unwrap.step)}
          errorMessage={unwrap.error?.message ?? null}
          onSubmit={handleUnwrap}
        />
      </div>
    </div>
  );
}

function AddressLink({ label, address }: { label: string; address: string }) {
  return (
    <a
      href={`${SEPOLIA_EXPLORER}${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/40 p-2 transition-colors hover:border-zinc-700"
    >
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-zinc-300">{shortenAddress(address)}</span>
    </a>
  );
}

function wrapStatusLabel(step: WrapStep): string {
  switch (step) {
    case "checking":
      return "checking...";
    case "approving":
      return "approving...";
    case "wrapping":
      return "wrapping...";
    case "confirming":
      return "confirming...";
    default:
      return "working...";
  }
}

function unwrapStatusLabel(step: UnwrapStep): string {
  switch (step) {
    case "encrypting":
      return "encrypting...";
    case "requesting":
      return "requesting...";
    case "decrypting":
      return "decrypting...";
    case "finalizing":
      return "finalizing...";
    case "confirming":
      return "confirming...";
    default:
      return "working...";
  }
}
