// Errors-as-values result type used across cloakly's service layer.
// Business logic returns a Result instead of throwing; callers branch on `ok`.
// sourceRef: project coding standards (SKILL_GENERAL.md, section 5 "Errors and types").

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function err<E>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}

// Discriminated, actionable error code. Each failure mode gets its own code so the
// UI can branch and render a distinct, specific message (never one catch-all string).
export type AppErrorCode =
  | "WRONG_NETWORK"
  | "WALLET_NOT_CONNECTED"
  | "RPC_UNAVAILABLE"
  | "CONTRACT_REVERT"
  | "INSUFFICIENT_BALANCE"
  | "MISSING_APPROVAL"
  | "USER_REJECTED"
  | "INVALID_AMOUNT"
  | "ENCRYPTION_FAILED"
  | "DECRYPTION_FAILED"
  | "NOT_READY"
  | "RATE_LIMITED"
  | "FHE_UNAVAILABLE"
  | "INVALID_ADDRESS"
  | "UNSUPPORTED_TOKEN"
  | "TIMEOUT"
  | "UNKNOWN";

export interface AppError {
  code: AppErrorCode;
  // Human-readable, specific to this failure mode. Safe to show to the user.
  message: string;
  // Original error kept for logging/debugging only. Never rendered raw to the UI.
  cause?: unknown;
}

export function appError(
  code: AppErrorCode,
  message: string,
  cause?: unknown,
): AppError {
  return { code, message, cause };
}
