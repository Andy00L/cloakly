"use client";

import { useCallback, useState } from "react";
import { parseEventLogs, type Hex } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { CONFIDENTIAL_WRAPPER_ABI } from "@/lib/contracts/wrapper-abi";
import { useFhe } from "@/lib/fhe/instance";
import { encryptAmount64, publicDecryptAmount } from "@/lib/fhe/operations";
import { ok, err, appError, type AppError, type Result } from "@/lib/result";
import { mapTxError } from "@/lib/actions/errors";
import { parseAmount, requireSepoliaWallet } from "@/lib/actions/guards";
import type { TokenPair } from "@/lib/tokens/types";

export type UnwrapStep =
  | "idle"
  | "encrypting"
  | "requesting"
  | "decrypting"
  | "finalizing"
  | "confirming"
  | "done";

// Unwraps a confidential ERC-7984 token back to its underlying ERC-20. This is a
// two-transaction flow: (1) encrypt the amount and call unwrap() to burn it and emit
// UnwrapRequested, (2) publicly decrypt the burned amount, then call finalizeUnwrap()
// to release the ERC-20. finalizeUnwrap is permissionless; here the same user drives it.
export function useUnwrap() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: APP_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const { ensureInstance } = useFhe();
  const [step, setStep] = useState<UnwrapStep>("idle");
  const [error, setError] = useState<AppError | null>(null);

  const run = useCallback(
    async (
      pair: TokenPair,
      amountInput: string,
    ): Promise<Result<{ requestId: Hex; finalizeHash: Hex }>> => {
      setError(null);
      setStep("idle");

      const walletResult = requireSepoliaWallet({ address, chainId, publicClient }, "[useUnwrap]");
      if (!walletResult.ok) {
        setError(walletResult.error);
        return err(walletResult.error);
      }
      const { address: user, publicClient: client } = walletResult.value;

      // The unwrap amount is expressed in confidential base units (wrapper decimals).
      const amountResult = parseAmount(amountInput, pair.confidentialDecimals, "[useUnwrap]");
      if (!amountResult.ok) {
        setError(amountResult.error);
        return err(amountResult.error);
      }

      const instanceResult = await ensureInstance();
      if (!instanceResult.ok) {
        setError(instanceResult.error);
        return err(instanceResult.error);
      }
      const instance = instanceResult.value;

      try {
        setStep("encrypting");
        const encrypted = await encryptAmount64(instance, {
          contractAddress: pair.confidential,
          userAddress: user,
          amount: amountResult.value,
        });
        if (!encrypted.ok) {
          setError(encrypted.error);
          setStep("idle");
          return err(encrypted.error);
        }

        setStep("requesting");
        const unwrapHash = await writeContractAsync({
          address: pair.confidential,
          abi: CONFIDENTIAL_WRAPPER_ABI,
          functionName: "unwrap",
          args: [user, user, encrypted.value.handle, encrypted.value.inputProof],
          chainId: APP_CHAIN_ID,
        });
        const receipt = await client.waitForTransactionReceipt({ hash: unwrapHash });

        // Pull the request id and the burned-amount handle from UnwrapRequested.
        const events = parseEventLogs({
          abi: CONFIDENTIAL_WRAPPER_ABI,
          eventName: "UnwrapRequested",
          logs: receipt.logs,
        });
        const requested = events[0];
        if (!requested) {
          const failure = appError(
            "CONTRACT_REVERT",
            "[useUnwrap] the unwrap transaction did not emit UnwrapRequested.",
          );
          setError(failure);
          setStep("idle");
          return err(failure);
        }
        const requestId = requested.args.unwrapRequestId;
        const amountHandle = requested.args.amount;

        setStep("decrypting");
        const publicly = await publicDecryptAmount(instance, amountHandle);
        if (!publicly.ok) {
          setError(publicly.error);
          setStep("idle");
          return err(publicly.error);
        }

        setStep("finalizing");
        const finalizeHash = await writeContractAsync({
          address: pair.confidential,
          abi: CONFIDENTIAL_WRAPPER_ABI,
          functionName: "finalizeUnwrap",
          args: [requestId, publicly.value.cleartext, publicly.value.decryptionProof],
          chainId: APP_CHAIN_ID,
        });
        setStep("confirming");
        await client.waitForTransactionReceipt({ hash: finalizeHash });
        setStep("done");
        return ok({ requestId, finalizeHash });
      } catch (cause) {
        const failure = mapTxError("[useUnwrap]", cause);
        setError(failure);
        setStep("idle");
        return err(failure);
      }
    },
    [address, chainId, publicClient, writeContractAsync, ensureInstance],
  );

  return {
    run,
    step,
    error,
    reset: () => {
      setStep("idle");
      setError(null);
    },
  };
}
