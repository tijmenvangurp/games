/**
 * Minimal ambient declarations for the Node built-ins used by the SQLite-backed
 * fake D1. The Worker typecheck only loads `@cloudflare/workers-types`, so the
 * test helper declares the two small APIs it needs instead of pulling all of
 * `@types/node` into the worker program.
 */
interface ImportMeta {
  readonly url: string;
}

declare module "node:sqlite" {
  export interface SqliteStatement {
    run(...params: unknown[]): { changes: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): SqliteStatement;
    close(): void;
  }
}

declare module "node:fs" {
  export function readFileSync(path: string | URL, encoding: "utf8"): string;
}
