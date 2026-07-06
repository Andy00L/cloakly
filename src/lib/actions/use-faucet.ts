"use client";

import { useCallback, useState } from "react";
import type { Hex } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import {
  ERC20_MOCK_MINT_ABI,
  ERC20_MOCK_MAX_MINT_TOKENS,
} from "@/lib/contracts/erc20-mock-abi";
import { ok, err, appError, type AppError, type Result } from "@/lib/result";
import { mapTxError } from "@/lib/actions/errors";
import { parseAmount, requireSepoliaWallet } from "@/lib/actions/guards";
import type { TokenPair } from "@/lib/tokens/types";

export type FaucetStatus = "idle" | "minting" | "confirming" | "done";

// Mints underlying test ERC-20 to the connected wallet via the public ERC20Mock faucet,
// so the user can then wrap it into the confidential token.
export function useFaucet() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: APP_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const [error, setError] = useState<AppError | null>(null);

  const run = useCallback(
    async (pair: TokenPair, amountInput: string): Promise<Result<{ hash: Hex }>> => {
      setError(null);
      setStatus("idle");

      if (!pair.hasPublicFaucet) {
        const failure = appError(
          "UNSUPPORTED_TOKEN",
          `[useFaucet] ${pair.underlyingSymbol} has no public faucet.`,
        );
        setError(failure);
        return err(failure);
      }

      const walletResult = requireSepoliaWallet({ address, chainId, publicClient }, "[useFaucet]");
      if (!walletResult.ok) {
        setError(walletResult.error);
        return err(walletResult.error);
      }

      const amountResult = parseAmount(amountInput, pair.underlyingDecimals, "[useFaucet]");
      if (!amountResult.ok) {
        setError(amountResult.error);
        return err(amountResult.error);
      }

      const perCallCap = ERC20_MOCK_MAX_MINT_TOKENS * 10n ** BigInt(pair.underlyingDecimals);
      if (amountResult.value > perCallCap) {
        const failure = appError(
          "INVALID_AMOUNT",
          `[useFaucet] the faucet mints at most ${ERC20_MOCK_MAX_MINT_TOKENS} ${pair.underlyingSymbol} per call.`,
        );
        setError(failure);
        return err(failure);
      }

      try {
        setStatus("minting");
        const hash = await writeContractAsync({
          address: pair.underlying,
          abi: ERC20_MOCK_MINT_ABI,
          functionName: "mint",
          args: [walletResult.value.address, amountResult.value],
          chainId: APP_CHAIN_ID,
        });
        setStatus("confirming");
        await walletResult.value.publicClient.waitForTransactionReceipt({ hash });
        setStatus("done");
        return ok({ hash });
      } catch (cause) {
        const failure = mapTxError("[useFaucet]", cause);
        setError(failure);
        setStatus("idle");
        return err(failure);
      }
    },
    [address, chainId, publicClient, writeContractAsync],
  );

  return {
    run,
    status,
    error,
    reset: () => {
      setStatus("idle");
      setError(null);
    },
  };
}
