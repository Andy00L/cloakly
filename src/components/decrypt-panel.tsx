"use client";

import { useState, type FormEvent } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { useDecryptBalance } from "@/lib/actions/use-decrypt-balance";
import { formatTokenAmount } from "@/lib/format";
import { findCatalogEntry } from "@/lib/tokens/catalog";

// ERC-7984 wrappers in this ecosystem use 6 decimals; used to display a decrypted
// balance for an arbitrary token when the catalog does not describe it.
const DEFAULT_CONFIDENTIAL_DECIMALS = 6;

// Decrypts the connected wallet's confidential balance for any ERC-7984 token address,
// not just registry pairs. Demonstrates the standalone user-decryption flow.
export function DecryptPanel() {
  const { isConnected, chainId } = useAccount();
  const onSepolia = isConnected && chainId === APP_CHAIN_ID;
  const decrypt = useDecryptBalance();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ value: bigint; decimals: number } | null>(null);

  const trimmed = input.trim();
  const looksValid = isAddress(trimmed);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    if (!isAddress(trimmed)) return;
    const decimals =
      findCatalogEntry(trimmed)?.confidentialDecimals ?? DEFAULT_CONFIDENTIAL_DECIMALS;
    const outcome = await decrypt.run(trimmed);
    if (outcome.ok) setResult({ value: outcome.value, decimals });
  }

  const busy = decrypt.status === "loading" || decrypt.status === "decrypting";

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Decrypt any confidential token</h2>
        <p className="text-sm text-zinc-500">
          Paste any ERC-7984 token address to reveal your own encrypted balance via EIP-712
          user decryption.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="0x... ERC-7984 token address"
          spellCheck={false}
          disabled={!onSepolia || busy}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!onSepolia || busy || !looksValid}
          className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {decrypt.status === "decrypting"
            ? "decrypting..."
            : decrypt.status === "loading"
              ? "reading..."
              : "Decrypt"}
        </button>
      </form>
      {result ? (
        <p className="font-mono text-sm text-emerald-400">
          Balance: {formatTokenAmount(result.value, result.decimals)}
        </p>
      ) : decrypt.error ? (
        <p className="text-sm text-red-400">{decrypt.error.message}</p>
      ) : null}
    </section>
  );
}
