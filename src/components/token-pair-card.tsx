"use client";

import { useState, type CSSProperties } from "react";
import { erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { useFaucet } from "@/lib/actions/use-faucet";
import { useWrap, type WrapStep } from "@/lib/actions/use-wrap";
import { useUnwrap, type UnwrapStep } from "@/lib/actions/use-unwrap";
import { useDecryptBalance } from "@/lib/actions/use-decrypt-balance";
import { formatTokenAmount, shortenAddress } from "@/lib/format";
import { AmountAction } from "@/components/amount-action";
import { SealedReveal, type SealPhase } from "@/components/sealed-reveal";
import { AlertTriangleIcon, ArrowUpRightIcon, Spinner } from "@/components/icons";
import { CARD_STAGGER_MS, EASE_ENTER } from "@/lib/motion";
import type { TokenPair } from "@/lib/tokens/types";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/address/";

// One registry pair: identity, both addresses, the public and confidential balances (the
// latter as the sealed chip and its break-the-seal reveal), and the mint/wrap/unwrap
// actions. The repeated hero unit of the dashboard.
export function TokenPairCard({ pair, index = 0 }: { pair: TokenPair; index?: number }) {
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
  const [sealPhase, setSealPhase] = useState<SealPhase>("sealed");

  function refreshUnderlying() {
    void underlyingBalance.refetch();
  }

  // A wrap or unwrap moves the confidential balance, so any decrypted value is stale:
  // clear it and re-seal the chip until the user decrypts again.
  function reseal() {
    setConfidentialBalance(null);
    setSealPhase("sealed");
    decrypt.reset();
  }

  async function handleFaucet(amount: string) {
    const result = await faucet.run(pair, amount);
    if (result.ok) refreshUnderlying();
  }
  async function handleWrap(amount: string) {
    const result = await wrap.run(pair, amount);
    if (result.ok) {
      refreshUnderlying();
      reseal();
    }
  }
  async function handleUnwrap(amount: string) {
    const result = await unwrap.run(pair, amount);
    if (result.ok) {
      refreshUnderlying();
      reseal();
    }
  }
  async function handleDecrypt() {
    if (!onSepolia || sealPhase === "decrypting") return;
    setSealPhase("decrypting");
    const result = await decrypt.run(pair.confidential);
    if (result.ok) {
      setConfidentialBalance(result.value);
      setSealPhase("revealed");
    } else {
      setSealPhase("sealed");
    }
  }

  const underlyingDisplay =
    onSepolia && underlyingBalance.data !== undefined
      ? formatTokenAmount(underlyingBalance.data, pair.underlyingDecimals)
      : "-";

  const registered = pair.isValid;
  const pillColor = registered ? "var(--color-registered)" : "var(--color-revoked)";
  const pillWash = registered ? "rgba(37,112,79,0.10)" : "rgba(166,61,50,0.10)";
  const pillDotHalo = registered ? "rgba(37,112,79,0.14)" : "rgba(166,61,50,0.14)";

  const cardStyle: CSSProperties = {
    padding: 24,
    animation: `ck-card-enter 300ms ${EASE_ENTER} backwards`,
    animationDelay: `${index * CARD_STAGGER_MS}ms`,
  };

  return (
    <article className="ck-card ck-card--interactive" style={cardStyle}>
      {/* Identity + registry status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-[5px]">
          <div className="flex items-baseline gap-[9px] font-serif text-[26px] font-medium leading-[1.02] tracking-[-0.02em] text-ink">
            <span>{pair.underlyingSymbol}</span>
            <span aria-hidden="true" className="font-medium text-faint-2">
              &#8594;
            </span>
            <span>{pair.confidentialSymbol}</span>
          </div>
          <div className="text-sm text-muted">{pair.name}</div>
        </div>
        <span
          className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full py-[5px] pl-[9px] pr-[11px] text-xs font-medium leading-none"
          style={{ background: pillWash, color: pillColor }}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: pillColor, boxShadow: `0 0 0 3px ${pillDotHalo}` }}
          />
          {registered ? "registered" : "revoked"}
        </span>
      </div>

      {/* Both token addresses, linking Sepolia Etherscan */}
      <div className="mt-[18px] grid grid-cols-2 gap-2.5">
        <AddressChip label="ERC-20" address={pair.underlying} />
        <AddressChip label="ERC-7984" address={pair.confidential} />
      </div>

      {/* Public balance (paper number) and confidential balance (sealed chip + reveal) */}
      <div className="mt-[18px] grid grid-cols-2 items-start gap-4">
        <div className="flex flex-col gap-2">
          <span className="ck-eyebrow">{pair.underlyingSymbol} balance</span>
          <div className="font-mono text-[22px] font-medium tracking-[-0.01em] tabular-nums text-ink">
            {underlyingDisplay === "-" ? <span className="text-faint-2">-</span> : underlyingDisplay}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="ck-eyebrow">{pair.confidentialSymbol} balance</span>
          <div className="flex min-h-[34px] items-center">
            <SealedReveal
              phase={sealPhase}
              value={confidentialBalance}
              decimals={pair.confidentialDecimals}
              size="sm"
              label={`${pair.confidentialSymbol} balance`}
            />
          </div>
          <SealControl
            phase={sealPhase}
            disabled={!onSepolia}
            onDecrypt={handleDecrypt}
            onReseal={reseal}
          />
          {sealPhase === "sealed" && decrypt.error ? (
            <div className="flex items-center gap-1.5 text-xs text-revoked">
              <AlertTriangleIcon size={13} className="flex-none" />
              <span>{decrypt.error.message}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-[22px] h-px bg-line" />

      {/* Actions: faucet (when available), wrap, unwrap */}
      <div
        className="mt-5 flex flex-col gap-4"
        style={{ opacity: onSepolia ? 1 : 0.5, pointerEvents: onSepolia ? "auto" : "none" }}
      >
        {pair.hasPublicFaucet ? (
          <AmountAction
            title={`Faucet: mint ${pair.underlyingSymbol}`}
            buttonLabel="Mint"
            unit={pair.underlyingSymbol}
            disabled={!onSepolia}
            busy={faucet.status === "minting" || faucet.status === "confirming"}
            statusLabel={faucet.status === "confirming" ? "confirming…" : "minting…"}
            errorMessage={faucet.error?.message ?? null}
            onSubmit={handleFaucet}
          />
        ) : null}
        <AmountAction
          title={`Wrap ${pair.underlyingSymbol} → ${pair.confidentialSymbol}`}
          buttonLabel="Wrap"
          unit={pair.underlyingSymbol}
          disabled={!onSepolia || !pair.isValid}
          busy={wrap.step !== "idle" && wrap.step !== "done"}
          statusLabel={wrapStatusLabel(wrap.step)}
          errorMessage={wrap.error?.message ?? null}
          onSubmit={handleWrap}
        />
        <AmountAction
          title={`Unwrap ${pair.confidentialSymbol} → ${pair.underlyingSymbol}`}
          buttonLabel="Unwrap"
          unit={pair.confidentialSymbol}
          disabled={!onSepolia || !pair.isValid}
          busy={unwrap.step !== "idle" && unwrap.step !== "done"}
          statusLabel={unwrapStatusLabel(unwrap.step)}
          errorMessage={unwrap.error?.message ?? null}
          onSubmit={handleUnwrap}
        />
      </div>
    </article>
  );
}

// The decrypt / decrypting / re-seal control beneath the confidential balance chip.
function SealControl({
  phase,
  disabled,
  onDecrypt,
  onReseal,
}: {
  phase: SealPhase;
  disabled: boolean;
  onDecrypt: () => void;
  onReseal: () => void;
}) {
  if (phase === "decrypting") {
    return (
      <button type="button" className="ck-seal-control" style={{ color: "var(--color-faint)" }} disabled>
        <Spinner size={12} tone="bronze" />
        <span>decrypting…</span>
      </button>
    );
  }
  if (phase === "revealed") {
    return (
      <button type="button" className="ck-seal-control" style={{ color: "var(--color-faint)" }} onClick={onReseal}>
        <span>re-seal</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="ck-seal-control"
      style={{ color: "var(--color-bronze)", opacity: disabled ? 0.5 : 1 }}
      disabled={disabled}
      onClick={onDecrypt}
    >
      <span>decrypt</span>
    </button>
  );
}

function AddressChip({ label, address }: { label: string; address: string }) {
  return (
    <a
      href={`${SEPOLIA_EXPLORER}${address}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`View ${label} on Sepolia Etherscan`}
      className="ck-well flex flex-col gap-1 rounded-lg px-[11px] py-[9px] no-underline transition-transform duration-150 hover:-translate-y-px"
    >
      <span className="ck-eyebrow">{label}</span>
      <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[13px] text-ink">
        <span>{shortenAddress(address)}</span>
        <ArrowUpRightIcon size={10} className="flex-none text-bronze" />
      </span>
    </a>
  );
}

function wrapStatusLabel(step: WrapStep): string {
  switch (step) {
    case "checking":
      return "checking…";
    case "approving":
      return "approving…";
    case "wrapping":
      return "wrapping…";
    case "confirming":
      return "confirming…";
    default:
      return "working…";
  }
}

function unwrapStatusLabel(step: UnwrapStep): string {
  switch (step) {
    case "encrypting":
      return "encrypting…";
    case "requesting":
      return "requesting…";
    case "decrypting":
      return "decrypting…";
    case "finalizing":
      return "finalizing…";
    case "confirming":
      return "confirming…";
    default:
      return "working…";
  }
}
