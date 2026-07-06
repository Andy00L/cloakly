"use client";

import { useState, type FormEvent } from "react";

interface AmountActionProps {
  title: string;
  buttonLabel: string;
  placeholder?: string;
  disabled?: boolean;
  busy?: boolean;
  // Short label shown on the button and below while the action runs, e.g. "approving...".
  statusLabel?: string | null;
  errorMessage?: string | null;
  onSubmit: (amount: string) => void | Promise<void>;
}

// Reusable amount-input + submit row used by the faucet, wrap, and unwrap actions.
// Owns only the input text; all busy/status/error state is driven by the parent hook.
export function AmountAction({
  title,
  buttonLabel,
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </label>
      <div className="flex gap-2">
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder={placeholder}
          disabled={isDisabled}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isDisabled || amount.trim() === ""}
          className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? statusLabel ?? "Working..." : buttonLabel}
        </button>
      </div>
      {errorMessage ? (
        <p className="text-xs text-red-400">{errorMessage}</p>
      ) : busy && statusLabel ? (
        <p className="text-xs text-violet-300">{statusLabel}</p>
      ) : null}
    </form>
  );
}
