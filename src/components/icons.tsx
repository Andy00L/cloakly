// Shared line icons (Lucide-style geometry) used across cloakly. Each inherits the
// current text color via stroke="currentColor", so color is set with a text-* class at
// the call site and stays on the token sheet. sourceRef: the generated Claude Design
// screens in .uidesign/.designui (icon paths transcribed verbatim).

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export function LockClosedIcon({ size = 16, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function LockOpenIcon({ size = 16, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.6-1.7" />
    </svg>
  );
}

export function ArrowUpRightIcon({ size = 10, className, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = 13, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function RefreshIcon({ size = 15, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function LayersIcon({ size = 34, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)} strokeWidth={strokeWidth}>
      <path d="M12 3 2 8l10 5 10-5-10-5z" />
      <path d="M2 16l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

// A ring spinner for busy controls. "light" reads on the ink pill, "bronze" on the
// paper-colored decrypt control. Spins via the ck-spin keyframe (collapsed under
// reduced motion by the global rule in globals.css).
export function Spinner({ size = 14, tone = "light" }: { size?: number; tone?: "light" | "bronze" }) {
  const ring = tone === "bronze" ? "rgba(154,91,19,0.30)" : "rgba(247,245,239,0.35)";
  const head = tone === "bronze" ? "var(--color-bronze)" : "var(--color-paper-bright)";
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "50%",
        border: `2px solid ${ring}`,
        borderTopColor: head,
        animation: "ck-spin 0.7s linear infinite",
      }}
    />
  );
}
