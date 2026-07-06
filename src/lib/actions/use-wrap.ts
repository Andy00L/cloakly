"use client";

import { useCallback, useState } from "react";
import { erc20Abi, type Hex } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { CONFIDENTIAL_WRAPPER_ABI } from "@/lib/contracts/wrapper-abi";
import { ok, err, appError, type AppError, type Result } from "@/lib/result";
import { mapTxError } from "@/lib/actions/errors";
import { parseAmount, requireSepoliaWallet } from "@/lib/actions/guards";
import type { TokenPair } from "@/lib/tokens/types";

export type WrapStep =
  | "idle"
  | "checking"
  | "approving"
  | "wrapping"
  | "confirming"
  | "done";

// Wraps an underlying ERC-20 into its confidential ERC-7984 token: verifies balance,
// approves the wrapper if needed, then calls wrap() and waits for confirmation.
export function useWrap() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: APP_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<WrapStep>("idle");
  const [error, setError] = useState<AppError | null>(null);

  const run = useCallback(
    async (pair: TokenPair, amountInput: string): Promise<Result<{ hash: Hex }>> => {
      setError(null);
      setStep("checking");

      const walletResult = requireSepoliaWallet({ address, chainId, publicClient }, "[useWrap]");
      if (!walletResult.ok) {
        setError(walletResult.error);
        setStep("idle");
        return err(walletResult.error);
      }
      const { address: user, publicClient: client } = walletResult.value;

      const amountResult = parseAmount(amountInput, pair.underlyingDecimals, "[useWrap]");
      if (!amountResult.ok) {
        setError(amountResult.error);
        setStep("idle");
        return err(amountResult.error);
      }
      const amount = amountResult.value;

      try {
        const balance = await client.readContract({
          address: pair.underlying,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [user],
        });
        if (balance < amount) {
          const failure = appError(
            "INSUFFICIENT_BALANCE",
            `[useWrap] your ${pair.underlyingSymbol} balance is too low. Use the faucet first.`,
          );
          setError(failure);
          setStep("idle");
          return err(failure);
        }

        const allowance = await client.readContract({
          address: pair.underlying,
          abi: erc20Abi,
          functionName: "allowance",
          args: [user, pair.confidential],
        });
        if (allowance < amount) {
          setStep("approving");
          const approveHash = await writeContractAsync({
            address: pair.underlying,
            abi: erc20Abi,
            functionName: "approve",
            args: [pair.confidential, amount],
            chainId: APP_CHAIN_ID,
          });
          await client.waitForTransactionReceipt({ hash: approveHash });
        }

        setStep("wrapping");
        const wrapHash = await writeContractAsync({
          address: pair.confidential,
          abi: CONFIDENTIAL_WRAPPER_ABI,
          functionName: "wrap",
          args: [user, amount],
          chainId: APP_CHAIN_ID,
        });
        setStep("confirming");
        await client.waitForTransactionReceipt({ hash: wrapHash });
        setStep("done");
        return ok({ hash: wrapHash });
      } catch (cause) {
        const failure = mapTxError("[useWrap]", cause);
        setError(failure);
        setStep("idle");
        return err(failure);
      }
    },
    [address, chainId, publicClient, writeContractAsync],
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
