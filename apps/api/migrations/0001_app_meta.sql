-- Minimal foundation schema for the API Worker.
-- Auth and progress tables are added in later issues (#43/#44).
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO app_meta (key, value) VALUES ('schema_version', '1');
