"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { formatUnits } from "viem";
import { formatTokenAmount } from "@/lib/format";
import {
  EASE_ENTER,
  EASE_POP,
  EASE_STANDARD,
  REVEAL_COUNT_UP_MS,
  REVEAL_POP_MS,
  easeOutCubic,
  prefersReducedMotion,
} from "@/lib/motion";
import { LockClosedIcon, LockOpenIcon } from "@/components/icons";

export type SealPhase = "sealed" | "decrypting" | "revealed";

interface SealedRevealProps {
  phase: SealPhase;
  // The decrypted balance in base units, present once phase is "revealed".
  value: bigint | null;
  decimals: number;
  size?: "sm" | "md";
  // The number's color once revealed: ink on cards, green in the standalone panel.
  revealTone?: "ink" | "green";
  // Describes what is sealed, for the accessible label (e.g. "cUSDC balance").
  label?: string;
}

const SIZES = {
  sm: { number: 17, block: 15, blockH: 17, minWidth: 82, lock: 14, gap: 9, padY: 7, padX: 12, height: 20 },
  md: { number: 19, block: 16, blockH: 18, minWidth: 94, lock: 15, gap: 10, padY: 8, padX: 14, height: 22 },
} as const;

// Small balances roll with more precision; larger ones stay calm at two places.
function rollDecimalsFor(target: number, decimals: number): number {
  return target !== 0 && Math.abs(target) < 1 ? Math.min(decimals, 4) : 2;
}

// The sealed-ciphertext chip and the "break the seal" reveal: cloakly's hero moment.
// While sealed it shows a bronze lock and shaded blocks; on decrypt it shimmers; on
// reveal the lock opens, the blocks dissolve, a bronze specular band sweeps once (CSS),
// the chip pops (CSS), and the real number rolls up from zero on a decelerating count-up
// written straight to the DOM (no per-frame React state).
export function SealedReveal({
  phase,
  value,
  decimals,
  size = "sm",
  revealTone = "ink",
  label,
}: SealedRevealProps) {
  const dims = SIZES[size];
  const isDecrypting = phase === "decrypting";
  const isRevealed = phase === "revealed";
  const [display, setDisplay] = useState("");

  // Roll the decrypted value in on the animation-frame clock (a system React does not
  // own). setState is called only inside the frame callbacks, never synchronously in the
  // effect body, so it avoids cascading renders while React still owns the text node.
  useEffect(() => {
    if (phase !== "revealed" || value === null) return;
    const target = Number(formatUnits(value, decimals));
    const exact = formatTokenAmount(value, decimals);
    const decimalPlaces = rollDecimalsFor(target, decimals);
    const roll = (amount: number) =>
      amount.toLocaleString("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    if (prefersReducedMotion()) {
      const settle = requestAnimationFrame(() => setDisplay(exact));
      return () => cancelAnimationFrame(settle);
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = (now - start) / REVEAL_COUNT_UP_MS;
      if (progress >= 1) {
        // Settle on the exact, trimmed value from the bigint.
        setDisplay(exact);
        return;
      }
      setDisplay(roll(target * easeOutCubic(progress)));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, value, decimals]);

  const accessibleValue = isRevealed && value !== null ? formatTokenAmount(value, decimals) : "encrypted";
  const numberColor = revealTone === "green" ? "var(--color-registered)" : "var(--color-ink)";

  const chipStyle: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    gap: dims.gap,
    padding: `${dims.padY}px ${dims.padX}px`,
    borderRadius: 8,
    // The one budgeted overshoot, played once each time the seal breaks.
    animation: isRevealed ? `ck-seal-pop ${REVEAL_POP_MS}ms ${EASE_POP}` : undefined,
  };

  return (
    <div
      className="ck-well"
      style={chipStyle}
      role="status"
      aria-live="polite"
      aria-label={label ? `${label}: ${accessibleValue}` : accessibleValue}
    >
      {/* Lock: closed and open glyphs crossfade on reveal. */}
      <span
        aria-hidden="true"
        style={{ position: "relative", width: dims.lock, height: dims.lock + 2, flex: "none" }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            color: "var(--color-bronze)",
            opacity: isRevealed ? 0 : 1,
            transition: `opacity 220ms ${EASE_STANDARD}`,
          }}
        >
          <LockClosedIcon size={dims.lock} />
        </span>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            color: "var(--color-bronze)",
            opacity: isRevealed ? 1 : 0,
            transition: `opacity 220ms ${EASE_STANDARD}`,
          }}
        >
          <LockOpenIcon size={dims.lock} />
        </span>
      </span>

      {/* The value slot: shaded blocks dissolve out while the real number rises in. */}
      <span style={{ position: "relative", display: "inline-block", minWidth: dims.minWidth, height: dims.height }}>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4,
            opacity: isRevealed ? 0 : 1,
            transform: isRevealed ? "translateY(-3px) scale(0.96)" : "none",
            transition: `opacity 260ms ${EASE_ENTER}, transform 260ms ${EASE_ENTER}`,
          }}
        >
          {[0, 1, 2].map((blockIndex) => (
            <span
              key={blockIndex}
              style={{
                width: dims.block,
                height: dims.blockH,
                borderRadius: 2,
                background:
                  "repeating-linear-gradient(135deg, rgba(28,25,23,0.26) 0 2px, rgba(28,25,23,0.09) 2px 4px)",
              }}
            />
          ))}
        </span>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            fontFamily: "var(--font-mono)",
            fontSize: dims.number,
            fontWeight: 500,
            color: numberColor,
            fontVariantNumeric: "tabular-nums",
            fontFeatureSettings: "'tnum' 1",
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? "none" : "translateY(4px)",
            transition: `opacity 300ms ${EASE_ENTER}, transform 300ms ${EASE_ENTER}`,
          }}
        >
          {display}
        </span>
      </span>

      {/* Decrypting: a bronze band shimmers across the sealed blocks. */}
      {isDecrypting ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "46%",
            background:
              "linear-gradient(90deg, rgba(154,91,19,0), rgba(154,91,19,0.30), rgba(154,91,19,0))",
            animation: `ck-seal-shimmer 1150ms ${EASE_STANDARD} infinite`,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* Reveal: one bronze specular sweep crosses the chip (mounts fresh each reveal). */}
      {isRevealed ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-25%",
            bottom: "-25%",
            left: 0,
            width: "55%",
            background:
              "linear-gradient(100deg, rgba(247,245,239,0), rgba(247,245,239,0.85), rgba(154,91,19,0.12), rgba(247,245,239,0))",
            animation: `ck-reveal-sweep 520ms ${EASE_ENTER} forwards`,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
}
