// Server-side JSON-RPC proxy for Ethereum Sepolia. The browser (wagmi/viem) posts
// JSON-RPC here instead of calling Infura directly, so SEPOLIA_RPC_URL (which
// carries the Infura key) never reaches the client bundle.
//
// Trust model: the upstream URL is fixed (server env), not caller-controlled, so
// there is no SSRF surface. The endpoint does relay arbitrary Sepolia JSON-RPC for
// same-origin browser clients; on a public testnet with a rate-limited key this is
// acceptable. Tighten with a method allowlist / rate limit before any mainnet use.
// sourceRef: Next.js route handlers (POST export, Web Request/Response APIs).

// Upstream is aborted past this window so a hung RPC returns a distinct 504, not a
// hanging request. Matches the ~20s window used to verify the endpoint.
const UPSTREAM_TIMEOUT_MS = 20_000;

export async function POST(request: Request): Promise<Response> {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    // Server misconfiguration, not a client error: fail loud and distinct.
    return Response.json(
      { error: "[rpcProxy] SEPOLIA_RPC_URL is not configured on the server" },
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
    const upstream = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: controller.signal,
    });
    // Read the body exactly once and forward status + payload verbatim so viem
    // sees genuine JSON-RPC error objects rather than a proxy-flavored wrapper.
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
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
