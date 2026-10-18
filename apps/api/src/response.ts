const API_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex",
} as const;

/**
 * Every `/api/*` response goes through this helper so that caching, indexing
 * and MIME-sniffing stay disabled for the whole API surface.
 */
export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...API_HEADERS,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}
