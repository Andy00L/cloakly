"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
// Type-only import: erased at build time, so the WASM-backed SDK is never pulled into
// the server bundle. The runtime module is loaded via dynamic import inside ensureInstance.
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { ok, err, appError, type Result } from "@/lib/result";

export type FheStatus = "idle" | "initializing" | "ready" | "error";

interface FheContextValue {
  status: FheStatus;
  error: string | null;
  // Lazily loads the WASM SDK and creates the FHEVM instance on first call, then
  // memoizes it. Concurrent callers share a single in-flight initialization.
  ensureInstance: () => Promise<Result<FhevmInstance>>;
}

const FheContext = createContext<FheContextValue | null>(null);

export function FheProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<FheStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<FhevmInstance | null>(null);
  const initRef = useRef<Promise<Result<FhevmInstance>> | null>(null);

  const ensureInstance = useCallback(async (): Promise<Result<FhevmInstance>> => {
    if (instanceRef.current) return ok(instanceRef.current);
    if (initRef.current) return initRef.current;

    const init = (async (): Promise<Result<FhevmInstance>> => {
      if (typeof window === "undefined" || !window.ethereum) {
        setStatus("error");
        return err(
          appError(
            "WALLET_NOT_CONNECTED",
            "[FheProvider] a browser wallet is required to initialize confidential decryption",
          ),
        );
      }
      setStatus("initializing");
      setError(null);
      try {
        // Dynamic import keeps the WASM/worker SDK out of the server bundle entirely,
        // and defers the (heavy) WASM load until the first confidential operation.
        const sdk = await import("@zama-fhe/relayer-sdk/web");
        await sdk.initSDK();
        const instance = await sdk.createInstance({
          ...sdk.SepoliaConfig,
          network: window.ethereum,
        });
        instanceRef.current = instance;
        setStatus("ready");
        return ok(instance);
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "failed to initialize the FHE SDK";
        setStatus("error");
        setError(message);
        return err(appError("FHE_UNAVAILABLE", `[FheProvider] ${message}`, cause));
      } finally {
        // Clear the in-flight marker so a later call can retry after a failure.
        initRef.current = null;
      }
    })();

    initRef.current = init;
    return init;
  }, []);

  const value = useMemo<FheContextValue>(
    () => ({ status, error, ensureInstance }),
    [status, error, ensureInstance],
  );

  return <FheContext.Provider value={value}>{children}</FheContext.Provider>;
}

// Access the FHE context. Throws only on a wiring mistake (used outside the provider),
// which is a development invariant, not a runtime business-logic error path.
export function useFhe(): FheContextValue {
  const context = useContext(FheContext);
  if (!context) {
    throw new Error("[useFhe] must be used within <FheProvider>");
  }
  return context;
}
