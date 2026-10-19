-- Child profiles and synced progress for the optional parent account (issue #44).
--
-- `player` holds only a slot, an avatar and an id: no name, e-mail, birth date
-- or photo of a child. `progress` stores one JSON envelope per player + game;
-- the server never interprets `dataJson`. `progress_mutation` makes retries
-- idempotent and is written in the same D1 batch as the progress upsert.
--
-- Safe to run on a new database: every object uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "player" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "slot" INTEGER NOT NULL,
  "avatar" TEXT NOT NULL,
  "createdAt" DATE NOT NULL,
  "deletedAt" DATE
);

-- A slot is unique per parent, but only while the profile is alive. The partial
-- index lets a parent reuse slot 2 after deleting the profile that used it.
CREATE UNIQUE INDEX IF NOT EXISTS "player_owner_slot_idx"
  ON "player" ("ownerUserId", "slot")
  WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "player_ownerUserId_idx" ON "player" ("ownerUserId");

CREATE TABLE IF NOT EXISTS "progress" (
  "playerId" TEXT NOT NULL REFERENCES "player" ("id") ON DELETE CASCADE,
  "gameId" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL,
  "revision" INTEGER NOT NULL,
  "dataJson" TEXT NOT NULL,
  "clientUpdatedAt" DATE NOT NULL,
  "serverUpdatedAt" DATE NOT NULL,
  "deletedAt" DATE,
  PRIMARY KEY ("playerId", "gameId")
);
CREATE INDEX IF NOT EXISTS "progress_playerId_idx" ON "progress" ("playerId");

CREATE TABLE IF NOT EXISTS "progress_mutation" (
  "idempotencyKey" TEXT NOT NULL PRIMARY KEY,
  "playerId" TEXT NOT NULL REFERENCES "player" ("id") ON DELETE CASCADE,
  "gameId" TEXT NOT NULL,
  "appliedRevision" INTEGER NOT NULL,
  "createdAt" DATE NOT NULL
);
CREATE INDEX IF NOT EXISTS "progress_mutation_player_game_idx"
  ON "progress_mutation" ("playerId", "gameId");
