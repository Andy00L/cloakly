// Motion tokens for cloakly's stateful (JS-driven) animations, kept in sync with the
// easing/keyframe values in globals.css so the whole product reads from one motion
// sheet. sourceRef: .uidesign/cloakly-design-sheet.md (Motion tokens).

// Easing curves.
export const EASE_ENTER = "cubic-bezier(0.16, 1, 0.3, 1)"; // decelerate / reveal
export const EASE_STANDARD = "cubic-bezier(0.4, 0, 0.2, 1)"; // on-screen moves
export const EASE_POP = "cubic-bezier(0.2, 0.8, 0.3, 1)"; // the single budgeted overshoot

// Durations, in milliseconds.
export const REVEAL_COUNT_UP_MS = 460; // the odometer count-up on decrypt
export const REVEAL_POP_MS = 490; // the seal "break" pop-and-settle (one budgeted overshoot)
export const CARD_STAGGER_MS = 50; // list stagger between sibling cards

// Cubic ease-out, used to shape the decrypt count-up so the value decelerates home.
export function easeOutCubic(progress: number): number {
  const clamped = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  return 1 - Math.pow(1 - clamped, 3);
}

// True when the viewer asked the OS to reduce motion; callers snap to the final frame.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
