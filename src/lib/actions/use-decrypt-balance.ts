"use client";

import { useCallback, useState } from "react";
import { isAddress, type Address, type Hex } from "viem";
import { useAccount, usePublicClient, useSignTypedData } from "wagmi";
import { APP_CHAIN_ID } from "@/lib/chain";
import { CONFIDENTIAL_WRAPPER_ABI } from "@/lib/contracts/wrapper-abi";
import { useFhe } from "@/lib/fhe/instance";
import { userDecryptHandle } from "@/lib/fhe/operations";
import { ok, err, appError, type AppError, type Result } from "@/lib/result";
import { requireSepoliaWallet } from "@/lib/actions/guards";

// An all-zero handle means the wallet has never held a confidential balance for this
// token, so the cleartext is zero and no decryption round-trip is needed.
const ZERO_HANDLE: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export type DecryptStatus = "idle" | "loading" | "decrypting" | "done";

// User-decrypts the connected wallet's confidential balance for any ERC-7984 token
// (registry pair or an arbitrary pasted address). Reads the encrypted balance handle,
// then runs the EIP-712 user-decryption flow so only the holder sees the cleartext.
export function useDecryptBalance() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: APP_CHAIN_ID });
  const { signTypedDataAsync } = useSignTypedData();
  const { ensureInstance } = useFhe();
  const [status, setStatus] = useState<DecryptStatus>("idle");
  const [error, setError] = useState<AppError | null>(null);

  const run = useCallback(
    async (confidentialToken: Address): Promise<Result<bigint>> => {
      setError(null);
      setStatus("loading");

      if (!isAddress(confidentialToken)) {
        const failure = appError(
          "INVALID_ADDRESS",
          "[useDecryptBalance] that is not a valid token address.",
        );
        setError(failure);
        setStatus("idle");
        return err(failure);
      }

      const walletResult = requireSepoliaWallet({ address, chainId, publicClient }, "[useDecryptBalance]");
      if (!walletResult.ok) {
        setError(walletResult.error);
        setStatus("idle");
        return err(walletResult.error);
      }
      const { address: user, publicClient: client } = walletResult.value;

      const instanceResult = await ensureInstance();
      if (!instanceResult.ok) {
        setError(instanceResult.error);
        setStatus("idle");
        return err(instanceResult.error);
      }

      try {
        const handle = await client.readContract({
          address: confidentialToken,
          abi: CONFIDENTIAL_WRAPPER_ABI,
          functionName: "confidentialBalanceOf",
          args: [user],
        });
        if (handle === ZERO_HANDLE) {
          setStatus("done");
          return ok(0n);
        }

        setStatus("decrypting");
        const decryptResult = await userDecryptHandle(
          instanceResult.value,
          { handle, contractAddress: confidentialToken, userAddress: user },
          (eip712) =>
            signTypedDataAsync({
              domain: eip712.domain,
              types: {
                UserDecryptRequestVerification:
                  eip712.types.UserDecryptRequestVerification,
              },
              primaryType: "UserDecryptRequestVerification",
              // The SDK returns the uint256 fields as strings; viem needs bigint. The
              // EIP-712 digest is over the numeric value, so this yields the same hash.
              message: {
                ...eip712.message,
                startTimestamp: BigInt(eip712.message.startTimestamp),
                durationDays: BigInt(eip712.message.durationDays),
              },
            }),
        );
        if (!decryptResult.ok) {
          setError(decryptResult.error);
          setStatus("idle");
          return err(decryptResult.error);
        }
        setStatus("done");
        return ok(decryptResult.value);
      } catch (cause) {
        const failure = appError(
          "DECRYPTION_FAILED",
          `[useDecryptBalance] ${cause instanceof Error ? cause.message : String(cause)}`,
          cause,
        );
        setError(failure);
        setStatus("idle");
        return err(failure);
      }
    },
    [address, chainId, publicClient, signTypedDataAsync, ensureInstance],
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
