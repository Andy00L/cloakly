"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangleIcon, Spinner } from "@/components/icons";

interface AmountActionProps {
  title: string;
  buttonLabel: string;
  // Token symbol shown as a suffix inside the input (e.g. USDC).
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  busy?: boolean;
  // Short label shown on the button while the action runs, e.g. "approving...".
  statusLabel?: string | null;
  errorMessage?: string | null;
  onSubmit: (amount: string) => void | Promise<void>;
}

// Amount-input + submit row used by the faucet, wrap, and unwrap actions. Owns only the
// input text; all busy/status/error state is driven by the parent action hook.
export function AmountAction({
  title,
  buttonLabel,
  unit,
  placeholder = "0.0",
  disabled = false,
  busy = false,
  statusLabel,
  errorMessage,
  onSubmit,
}: AmountActionProps) {
  const [amount, setAmount] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(amount);
  }

  const isDisabled = disabled || busy;
  const hasError = Boolean(errorMessage);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="ck-eyebrow">{title}</label>
      <div className="flex items-center gap-2.5">
        <div className="relative min-w-0 flex-1">
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder={placeholder}
            disabled={isDisabled}
            aria-label={title}
            className="ck-field-input"
            style={{
              paddingRight: unit ? 56 : 13,
              borderColor: hasError ? "var(--color-revoked)" : undefined,
            }}
          />
          {unit ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-faint"
            >
              {unit}
            </span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={isDisabled || amount.trim() === ""}
          className="ck-btn"
          style={{ minWidth: 120 }}
        >
          {busy ? <Spinner /> : null}
          <span>{busy ? statusLabel ?? "Working..." : buttonLabel}</span>
        </button>
      </div>
      {hasError ? (
        <div className="flex items-center gap-1.5 pl-0.5 text-xs text-revoked">
          <AlertTriangleIcon size={13} className="flex-none" />
          <span>{errorMessage}</span>
        </div>
      ) : null}
    </form>
  );
}
