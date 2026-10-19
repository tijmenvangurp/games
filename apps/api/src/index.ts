import type { Env } from "./env";
import { handleRequest } from "./router";

/**
 * Worker entry for same-origin `/api/*` routes. Static assets stay on the
 * asset-first path; `assets.run_worker_first` only sends `/api/*` here.
 */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
