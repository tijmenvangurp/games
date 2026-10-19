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

/** A body-less API response (used by `DELETE`), with the same security headers. */
export function emptyResponse(status = 204): Response {
  return new Response(null, { status, headers: API_HEADERS });
}

/** A `405` response that tells the client which methods the route accepts. */
export function methodNotAllowed(allow: string): Response {
  return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: allow });
}

/** A `400` response that names the field that failed validation. */
export function invalidField(field: string): Response {
  return jsonResponse({ error: "invalid_request", field }, 400);
}

/**
 * Adds the API security headers to a response produced by Better Auth while
 * preserving its status, body and `Set-Cookie` headers.
 */
export function withApiHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(API_HEADERS)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
