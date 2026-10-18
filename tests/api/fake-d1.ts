import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const MIGRATIONS = ["0001_app_meta.sql", "0002_auth.sql", "0003_progress.sql"];
const MIGRATIONS_DIR = new URL("../../apps/api/migrations/", import.meta.url);

type Param = string | number | bigint | null;

interface BoundStatement {
  readonly __query: string;
  readonly __params: readonly Param[];
}

interface RunResult {
  readonly changes: number;
}

function execute(sqlite: DatabaseSync, statement: BoundStatement): RunResult {
  const prepared = sqlite.prepare(statement.__query);
  if (statement.__query.trimStart().toUpperCase().startsWith("SELECT")) {
    prepared.all(...statement.__params);
    return { changes: 0 };
  }
  const info = prepared.run(...statement.__params);
  return { changes: Number(info.changes) };
}

function meta(changes: number) {
  return {
    changes,
    last_row_id: 0,
    changed_db: changes > 0,
    duration: 0,
    rows_read: 0,
    rows_written: changes,
    size_after: 0,
  };
}

export interface FakeD1 {
  readonly db: D1Database;
  readonly sqlite: DatabaseSync;
  /** Inserts a Better Auth parent row so foreign keys stay satisfied. */
  seedUser(id: string): void;
  rows<T>(sql: string, ...params: Param[]): T[];
  count(sql: string, ...params: Param[]): number;
  close(): void;
}

/**
 * A real in-memory SQLite database behind a D1-shaped interface. Applying the
 * actual migrations means the tests exercise the same SQL and constraints as
 * production D1, without the Workers runtime.
 */
export function createFakeD1(): FakeD1 {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");

  for (const file of MIGRATIONS) {
    sqlite.exec(readFileSync(new URL(file, MIGRATIONS_DIR), "utf8"));
  }

  function prepare(query: string): D1PreparedStatement {
    const bound = (params: readonly Param[]): D1PreparedStatement =>
      ({
        __query: query,
        __params: params,
        bind: (...next: Param[]) => bound(next),
        first: async <T>(column?: string): Promise<T | null> => {
          const row = sqlite.prepare(query).get(...params) as Record<string, unknown> | undefined;
          if (!row) {
            return null;
          }
          return (column ? row[column] : row) as T;
        },
        all: async <T>() => ({
          success: true,
          results: sqlite.prepare(query).all(...params) as T[],
          meta: meta(0),
        }),
        run: async <T>() => {
          const info = sqlite.prepare(query).run(...params);
          return {
            success: true,
            results: [] as T[],
            meta: meta(Number(info.changes)),
          };
        },
      }) as unknown as D1PreparedStatement;

    return bound([]);
  }

  const db = {
    prepare,
    batch: async (statements: D1PreparedStatement[]) => {
      const list = statements as unknown as BoundStatement[];
      const results: unknown[] = [];

      sqlite.exec("BEGIN");
      try {
        for (const statement of list) {
          const { changes } = execute(sqlite, statement);
          results.push({ success: true, results: [], meta: meta(changes) });
        }
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    exec: async (query: string) => {
      sqlite.exec(query);
      return { count: 0, duration: 0 };
    },
  } as unknown as D1Database;

  return {
    db,
    sqlite,
    seedUser(id: string) {
      sqlite
        .prepare(
          `INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          "Ouder",
          `${id}@example.invalid`,
          1,
          "2026-10-18T10:00:00.000Z",
          "2026-10-18T10:00:00.000Z",
        );
    },
    rows<T>(sql: string, ...params: Param[]) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    count(sql: string, ...params: Param[]) {
      const row = sqlite.prepare(sql).get(...params) as { count: number } | undefined;
      return Number(row?.count ?? 0);
    },
    close() {
      sqlite.close();
    },
  };
}
