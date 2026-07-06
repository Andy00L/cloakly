import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build with webpack (see package.json scripts). Turbopack is Next 16's default, but
  // the Zama FHE SDK is only validated on webpack, and webpack bundles its large WASM
  // dependency far faster here.
  webpack: (config: { externals?: unknown }) => {
    // Optional deps that pino / wallet libraries reference but never call in the browser.
    // Externalizing them stops webpack from trying to resolve-and-bundle them.
    // sourceRef: zama-ai/fhevm-react-template next.config.ts.
    if (Array.isArray(config.externals)) {
      config.externals.push("pino-pretty", "lokijs", "encoding");
    }
    return config;
  },
};

export default nextConfig;
