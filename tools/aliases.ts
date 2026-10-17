import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Shared module aliases for Vite and Vitest. Keep this list in sync with the
 * `paths` mapping in `tsconfig.base.json`.
 */
export const aliases = {
  "@app": `${workspaceRoot}/apps/games/src/app`,
  "@pages": `${workspaceRoot}/libs/pages`,
  "@widgets": `${workspaceRoot}/libs/widgets`,
  "@features": `${workspaceRoot}/libs/features`,
  "@entities": `${workspaceRoot}/libs/entities`,
  "@shared/lib": `${workspaceRoot}/libs/shared/lib`,
  "@shared/ui": `${workspaceRoot}/libs/shared/ui`,
  "@": `${workspaceRoot}/apps/games/src`,
};
