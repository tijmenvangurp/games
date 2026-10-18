import { jsonResponse } from "./response";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a JSON object body. A malformed body or a body that is not an object
 * returns a ready-made 400 response instead of throwing.
 */
export async function readJsonRecord(
  request: Request,
): Promise<Record<string, unknown> | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (!isRecord(body)) {
    return jsonResponse({ error: "invalid_request", field: "body" }, 400);
  }

  return body;
}
