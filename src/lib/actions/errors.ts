import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from "viem";
import { appError, type AppError } from "@/lib/result";

// Maps a thrown viem/wallet transaction error to a distinct, actionable AppError so the
// UI can tell "you rejected it" apart from "it reverted" apart from an unknown failure.
export function mapTxError(prefix: string, cause: unknown): AppError {
  if (cause instanceof BaseError) {
    const rejected = cause.walk((inner) => inner instanceof UserRejectedRequestError);
    if (rejected) {
      return appError(
        "USER_REJECTED",
        `${prefix} you rejected the transaction in your wallet.`,
        cause,
      );
    }
    const reverted = cause.walk(
      (inner) => inner instanceof ContractFunctionRevertedError,
    );
    if (reverted instanceof ContractFunctionRevertedError) {
      const reason = reverted.reason ?? reverted.shortMessage;
      return appError("CONTRACT_REVERT", `${prefix} the transaction reverted: ${reason}`, cause);
    }
    return appError("UNKNOWN", `${prefix} ${cause.shortMessage}`, cause);
  }
  return appError(
    "UNKNOWN",
    `${prefix} ${cause instanceof Error ? cause.message : String(cause)}`,
    cause,
  );
}
