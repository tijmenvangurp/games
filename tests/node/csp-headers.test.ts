import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** The global `/*` block (every line of the first block applies to all URLs). */
const HEADERS_FILE = readFileSync(
  new URL("../../apps/games/public/_headers", import.meta.url),
  "utf8",
);

function globalHeaders(source: string): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const line of source.split(/\r?\n/)) {
    const match = /^ {2}([A-Za-z-]+): (.+)$/.exec(line);
    if (match) {
      const [, name, value] = match;
      headers[name] = value;
    }
  }

  return headers;
}

describe("Cloudflare _headers CSP", () => {
  const headers = globalHeaders(HEADERS_FILE);

  it("keeps connect-src on the same origin", () => {
    const csp = headers["Content-Security-Policy"];
    expect(csp).toBeDefined();

    const connectSrc = csp
      ?.split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("connect-src"));

    // The API is same-origin, so the app may only talk to its own origin.
    expect(connectSrc).toBe("connect-src 'self'");
  });

  it("does not allow any remote endpoint — Google OAuth is a top-level navigation", () => {
    const csp = headers["Content-Security-Policy"];
    expect(csp?.toLowerCase()).not.toContain("http");
    expect(csp?.toLowerCase()).not.toContain("google");
  });

  it("keeps the hardening directives intact", () => {
    const csp = headers["Content-Security-Policy"];

    for (const directive of [
      "script-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ]) {
      expect(csp).toContain(directive);
    }
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});
