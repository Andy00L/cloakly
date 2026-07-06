import { appError, type AppError } from "@/lib/result";

// Maps a thrown relayer / SDK error to a distinct, actionable AppError. The relayer
// surfaces a `label` on its API errors (rate_limited, not_ready_for_decryption, ...),
// so we branch on those and give the user a message that tells "try again shortly"
// apart from "decryption failed".
// sourceRef: @zama-fhe/relayer-sdk RelayerApiError*Type labels (web.d.ts).
export function mapRelayerError(prefix: string, cause: unknown): AppError {
  const label = extractLabel(cause);
  switch (label) {
    case "not_ready_for_decryption":
    case "readiness_check_timed_out":
    case "response_timed_out":
      return appError(
        "NOT_READY",
        `${prefix} the network is not ready to decrypt this value yet. Try again in a few seconds.`,
        cause,
      );
    case "rate_limited":
    case "protocol_overload":
      return appError(
        "RATE_LIMITED",
        `${prefix} the relayer is rate limiting requests. Try again shortly.`,
        cause,
      );
    case "unauthorized":
    case "not_allowed_on_host_acl":
      return appError(
        "DECRYPTION_FAILED",
        `${prefix} this wallet is not authorized to decrypt that value.`,
        cause,
      );
    case "insufficient_balance":
    case "insufficient_allowance":
    case "gateway_not_reachable":
    case "protocol_paused":
      return appError(
        "RPC_UNAVAILABLE",
        `${prefix} the decryption service is temporarily unavailable (${label}). Try again later.`,
        cause,
      );
    default:
      return appError("DECRYPTION_FAILED", `${prefix} ${messageOf(cause)}`, cause);
  }
}

// The relayer error objects carry a string `label`; pull it out without asserting types.
function extractLabel(cause: unknown): string | null {
  if (typeof cause === "object" && cause !== null && "label" in cause) {
    const { label } = cause;
    return typeof label === "string" ? label : null;
  }
  return null;
}

function messageOf(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return typeof cause === "string" ? cause : "decryption failed";
}
