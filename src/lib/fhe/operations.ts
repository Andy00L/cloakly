import { bytesToHex, type Hex } from "viem";
// Type-only imports: erased at compile time, so the WASM-backed SDK is never pulled
// into the server bundle. The live instance is created client-side (see instance.tsx)
// and passed into these helpers.
import type {
  FhevmInstance,
  KmsUserDecryptEIP712Type,
} from "@zama-fhe/relayer-sdk/web";
import { ok, err, appError, type Result } from "@/lib/result";
import { mapRelayerError } from "@/lib/fhe/errors";

// Validity window for a user-decryption permit (EIP-712 authorization), in days.
// The user signs once and the permit is reusable for this many days.
const DECRYPT_PERMIT_DURATION_DAYS = 10;

// Signs the EIP-712 user-decryption request with the connected wallet. Implemented by
// the caller via wagmi's signTypedDataAsync; returns the 0x-prefixed signature.
export type Eip712Signer = (eip712: KmsUserDecryptEIP712Type) => Promise<Hex>;

// Encrypts a uint64 amount as an external ciphertext bound to a contract + user, for a
// wrapper call (e.g. unwrap). Returns the ciphertext handle and input proof as 0x-hex.
export async function encryptAmount64(
  instance: FhevmInstance,
  params: { contractAddress: Hex; userAddress: Hex; amount: bigint },
): Promise<Result<{ handle: Hex; inputProof: Hex }>> {
  try {
    const input = instance.createEncryptedInput(
      params.contractAddress,
      params.userAddress,
    );
    input.add64(params.amount);
    const encrypted = await input.encrypt();
    const handle = encrypted.handles[0];
    if (!handle) {
      return err(
        appError("ENCRYPTION_FAILED", "[encryptAmount64] encryption returned no handle"),
      );
    }
    return ok({
      handle: bytesToHex(handle),
      inputProof: bytesToHex(encrypted.inputProof),
    });
  } catch (cause) {
    return err(
      appError("ENCRYPTION_FAILED", "[encryptAmount64] failed to encrypt the amount", cause),
    );
  }
}

// Publicly decrypts a single ciphertext handle. Used to finalize an unwrap: the burned
// amount is made publicly decryptable, then the cleartext + KMS proof are submitted to
// finalizeUnwrap(...). Returns the cleartext value (fits uint64) and the decryption proof.
export async function publicDecryptAmount(
  instance: FhevmInstance,
  handle: Hex,
): Promise<Result<{ cleartext: bigint; decryptionProof: Hex }>> {
  try {
    const results = await instance.publicDecrypt([handle]);
    const value = results.clearValues[handle];
    if (typeof value !== "bigint") {
      return err(
        appError(
          "DECRYPTION_FAILED",
          `[publicDecryptAmount] expected a numeric cleartext, received ${typeof value}`,
        ),
      );
    }
    return ok({ cleartext: value, decryptionProof: results.decryptionProof });
  } catch (cause) {
    return err(mapRelayerError("[publicDecryptAmount]", cause));
  }
}

// User-decrypts a private ciphertext handle (e.g. a confidential balance) so only the
// holder sees the cleartext. Generates an ephemeral keypair, builds and signs the
// EIP-712 permit, then asks the relayer to re-encrypt the value to that keypair.
export async function userDecryptHandle(
  instance: FhevmInstance,
  params: { handle: Hex; contractAddress: Hex; userAddress: Hex },
  signEip712: Eip712Signer,
): Promise<Result<bigint>> {
  try {
    const keypair = instance.generateKeypair();
    const startTimestamp = Math.floor(Date.now() / 1000); // unix seconds
    const durationDays = DECRYPT_PERMIT_DURATION_DAYS;
    const contractAddresses = [params.contractAddress];

    const eip712 = instance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimestamp,
      durationDays,
    );

    const signature = await signEip712(eip712);

    const results = await instance.userDecrypt(
      [{ handle: params.handle, contractAddress: params.contractAddress }],
      keypair.privateKey,
      keypair.publicKey,
      // The relayer expects the signature without its 0x prefix.
      signature.replace(/^0x/, ""),
      contractAddresses,
      params.userAddress,
      startTimestamp,
      durationDays,
    );

    const value = results[params.handle];
    if (typeof value !== "bigint") {
      return err(
        appError(
          "DECRYPTION_FAILED",
          `[userDecryptHandle] expected a numeric cleartext, received ${typeof value}`,
        ),
      );
    }
    return ok(value);
  } catch (cause) {
    return err(mapRelayerError("[userDecryptHandle]", cause));
  }
}
