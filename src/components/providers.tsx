"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWagmiConfig } from "@/lib/wagmi";
import { FheProvider } from "@/lib/fhe/instance";

// Client boundary that mounts wagmi + react-query for the whole app. The config
// and query client are created once via useState initializers so they stay stable
// across re-renders and are never rebuilt on the server.
// sourceRef: Next.js "Context providers" pattern (wrap children in a 'use client'
// provider imported by the server layout).
export function Providers({ children }: { children: ReactNode }) {
  const [config] = useState(() => createWagmiConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FheProvider>{children}</FheProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
