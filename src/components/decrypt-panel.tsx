"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { useDecryptBalance } from "@/lib/actions/use-decrypt-balance";
import { findCatalogEntry } from "@/lib/tokens/catalog";
import { SealedReveal } from "@/components/sealed-reveal";
import { AlertTriangleIcon, Spinner } from "@/components/icons";
import { EASE_ENTER } from "@/lib/motion";

// ERC-7984 wrappers in this ecosystem use 6 decimals; used to render a decrypted balance
// for an arbitrary token when the catalog does not describe it.
const DEFAULT_CONFIDENTIAL_DECIMALS = 6;

// Decrypts the connected wallet's confidential balance for any ERC-7984 token address,
// not just registry pairs, via the standalone EIP-712 user-decryption flow.
export function DecryptPanel() {
  const { isConnected, chainId } = useAccount();
  const onSepolia = isConnected && chainId === APP_CHAIN_ID;
  const decrypt = useDecryptBalance();

  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"idle" | "decrypting" | "revealed">("idle");
  const [result, setResult] = useState<{ value: bigint; decimals: number } | null>(null);
  const [invalid, setInvalid] = useState(false);

  const trimmed = input.trim();
  const busy = phase === "decrypting";

  function handleInputChange(next: string) {
    setInput(next);
    setInvalid(false);
    if (phase !== "idle") {
      setPhase("idle");
      setResult(null);
      decrypt.reset();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setInvalid(false);
    if (!onSepolia) return;
    if (!isAddress(trimmed)) {
      setInvalid(true);
      return;
    }
    const decimals = findCatalogEntry(trimmed)?.confidentialDecimals ?? DEFAULT_CONFIDENTIAL_DECIMALS;
    setPhase("decrypting");
    const outcome = await decrypt.run(trimmed);
    if (outcome.ok) {
      setResult({ value: outcome.value, decimals });
      setPhase("revealed");
    } else {
      setPhase("idle");
    }
  }

  const cardStyle: CSSProperties = { padding: 24, animation: `ck-rise 300ms ${EASE_ENTER} backwards` };
  const showResult = phase === "decrypting" || phase === "revealed";
  const decryptError = phase === "idle" && !invalid ? decrypt.error : null;

  return (
    <section className="ck-card" style={cardStyle}>
      <h2 className="font-serif text-[26px] font-medium leading-[1.06] tracking-[-0.02em] text-ink">
        Decrypt any confidential token
      </h2>
      <p className="mt-2 max-w-[64ch] text-[15px] leading-[1.55] text-muted">
        Paste any ERC-7984 token address to reveal your own encrypted balance via EIP-712 user
        decryption.
      </p>

      <div className="mt-[22px]" style={{ opacity: onSepolia ? 1 : 0.5 }}>
        <label htmlFor="decrypt-address" className="ck-eyebrow mb-[9px] block">
          ERC-7984 token address
        </label>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <input
            id="decrypt-address"
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder="0x…  ERC-7984 token address"
            spellCheck={false}
            autoComplete="off"
            disabled={!onSepolia}
            className="ck-field-input"
            style={{
              flex: "1 1 340px",
              fontSize: 14,
              paddingLeft: 15,
              paddingRight: 15,
              borderColor: invalid ? "var(--color-revoked)" : undefined,
            }}
          />
          <button
            type="submit"
            className="ck-btn"
            style={{ minWidth: 132 }}
            disabled={!onSepolia || trimmed === "" || busy}
          >
            {busy ? <Spinner /> : null}
            <span>{busy ? "decrypting…" : "Decrypt"}</span>
          </button>
        </form>

        {invalid ? (
          <Hint tone="error">that is not a valid token address</Hint>
        ) : decryptError ? (
          <Hint tone="error">{decryptError.message}</Hint>
        ) : !isConnected ? (
          <Hint tone="muted">connect a wallet to decrypt</Hint>
        ) : !onSepolia ? (
          <Hint tone="muted">switch to Sepolia to decrypt</Hint>
        ) : null}
      </div>

      {showResult ? (
        <div
          className="mt-6 flex items-center gap-[13px] border-t border-line pt-[22px]"
          style={{ animation: `ck-rise 260ms ${EASE_ENTER} backwards` }}
        >
          <span className="text-sm text-muted">Balance:</span>
          <SealedReveal
            phase={phase}
            value={result?.value ?? null}
            decimals={result?.decimals ?? DEFAULT_CONFIDENTIAL_DECIMALS}
            size="md"
            revealTone="green"
            label="Balance"
          />
        </div>
      ) : null}
    </section>
  );
}

function Hint({ children, tone }: { children: string; tone: "error" | "muted" }) {
  if (tone === "error") {
    return (
      <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-revoked">
        <AlertTriangleIcon size={13} className="flex-none" />
        <span>{children}</span>
      </div>
    );
  }
  return (
    <div className="mt-2.5 flex items-center gap-[7px] text-[12.5px] text-faint">
      <span aria-hidden="true" className="h-[5px] w-[5px] flex-none rounded-full bg-bronze" />
      <span>{children}</span>
    </div>
  );
}
