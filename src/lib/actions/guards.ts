import { parseUnits, type Address, type PublicClient } from "viem";
import { APP_CHAIN_ID } from "@/lib/chain";
import { ok, err, appError, type Result } from "@/lib/result";

// Validates that a wallet is connected on Sepolia with an available RPC client, and
// returns the narrowed address + client so callers do not repeat these guards.
export function requireSepoliaWallet(
  params: { address?: Address; chainId?: number; publicClient?: PublicClient },
  prefix: string,
): Result<{ address: Address; publicClient: PublicClient }> {
  if (!params.address) {
    return err(appError("WALLET_NOT_CONNECTED", `${prefix} connect a wallet first.`));
  }
  if (params.chainId !== APP_CHAIN_ID) {
    return err(appError("WRONG_NETWORK", `${prefix} switch your wallet to Sepolia.`));
  }
  if (!params.publicClient) {
    return err(appError("RPC_UNAVAILABLE", `${prefix} no RPC client is available.`));
  }
  return ok({ address: params.address, publicClient: params.publicClient });
}

// Parses a human amount string into base units without throwing.
export function parseAmount(
  input: string,
  decimals: number,
  prefix: string,
): Result<bigint> {
  const trimmed = input.trim();
  if (!trimmed) {
    return err(appError("INVALID_AMOUNT", `${prefix} enter an amount.`));
  }
  let amount: bigint;
  try {
    amount = parseUnits(trimmed, decimals);
  } catch {
    return err(appError("INVALID_AMOUNT", `${prefix} "${input}" is not a valid amount.`));
  }
  if (amount <= 0n) {
    return err(appError("INVALID_AMOUNT", `${prefix} amount must be greater than zero.`));
  }
  return ok(amount);
}
