// Server-side JSON-RPC proxy. The browser (wagmi/viem) posts JSON-RPC here instead of
// calling a provider directly, so SEPOLIA_RPC_URL (which carries the provider key) never
// reaches the client bundle. A ?chain= query selects the upstream network.
//
// Trust model: the upstream URL is chosen from server env / a fixed constant, never from
// caller input, so there is no SSRF surface. The endpoint relays arbitrary Sepolia/mainnet
// JSON-RPC for same-origin browser clients; on public testnets/read-only mainnet with a
// rate-limited key this is acceptable. Tighten with a method allowlist / rate limit before
// any write-enabled mainnet use.
// sourceRef: Next.js route handlers (POST export, Web Request/Response APIs).

// Read-only mainnet is served from a public, keyless endpoint unless MAINNET_RPC_URL is
// set. Mainnet is browse-only in this app, so no signing or key is required.
const DEFAULT_MAINNET_RPC = "https://ethereum-rpc.publicnode.com";

// Upstream is aborted past this window so a hung RPC returns a distinct 504, not a
// hanging request.
const UPSTREAM_TIMEOUT_MS = 20_000;

function resolveUpstream(chain: string | null): { url?: string; missingEnv?: string } {
  if (chain === "mainnet") {
    return { url: process.env.MAINNET_RPC_URL ?? DEFAULT_MAINNET_RPC };
  }
  // Default and "sepolia" both use the keyed Sepolia endpoint.
  const url = process.env.SEPOLIA_RPC_URL;
  return url ? { url } : { missingEnv: "SEPOLIA_RPC_URL" };
}

export async function POST(request: Request): Promise<Response> {
  const chain = new URL(request.url).searchParams.get("chain");
  const upstream = resolveUpstream(chain);
  if (!upstream.url) {
    // Server misconfiguration, not a client error: fail loud and distinct.
    return Response.json(
      { error: `[rpcProxy] ${upstream.missingEnv} is not configured on the server` },
      { status: 500 },
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch (cause) {
    return Response.json(
      { error: "[rpcProxy] could not read request body", detail: describe(cause) },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(upstream.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: controller.signal,
    });
    // Read the body exactly once and forward status + payload verbatim so viem sees
    // genuine JSON-RPC error objects rather than a proxy-flavored wrapper.
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  } catch (cause) {
    const isTimeout = cause instanceof Error && cause.name === "AbortError";
    return Response.json(
      {
        error: isTimeout
          ? "[rpcProxy] upstream RPC timed out"
          : "[rpcProxy] upstream RPC unreachable",
      },
      { status: isTimeout ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
