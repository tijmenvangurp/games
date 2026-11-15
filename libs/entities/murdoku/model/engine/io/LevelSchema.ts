import type { ClueJson } from "../clues/ClueFactory.ts";
import type { AttributeValue, Side } from "../domain/types.ts";

/** JSON definition of one suspect. */
export interface SuspectJson {
  id: string;
  name: string;
  attributes?: Record<string, AttributeValue>;
  clues?: ClueJson[];
}

/**
 * A board-wide clue not tied to one suspect (shown separately in the UI):
 *  - countOnObject: exactly `count` people stand on cells with this object;
 *  - emptyRooms: exactly `count` rooms hold nobody (0 = "no room is empty");
 *  - everyRoomCount: every room holds exactly `count` people.
 */
export type BoardClueJson =
  | { type: "countOnObject"; object: string; count: number }
  | { type: "emptyRooms"; count: number }
  | { type: "everyRoomCount"; count: number };

/** JSON definition of a complete level (see levels/demo-4x4.json). */
export interface LevelJson {
  schema: 1;
  id: string;
  /** Optional display name (e.g. a player-given name for a saved level). */
  title?: string;
  /** Optional per-language title overrides ({ de, en, … }); the active language is
   *  looked up here first, falling back to `title`. Lets one level read in any UI
   *  language without separate files. */
  titles?: Record<string, string>;
  /** Optional credit shown while playing ("A case by …"); omitted when unset. */
  author?: string;
  size: { width: number; height: number };
  /** char -> room metadata; chars are used in `roomMap`. `outside` marks outdoor areas. */
  rooms: Record<string, { nameKey: string; color: string; outside?: boolean }>;
  /** char -> object metadata; chars are used in `groundMap` / `topMap`. */
  objects?: Record<string, { type: string; occupiable: boolean }>;
  /** height strings of width chars; each char is a room id. */
  roomMap: string[];
  /** Occupiable ground layer (e.g. carpet). "." = empty. */
  groundMap?: string[];
  /** Objects on top (chair/bed/table/…). "." = empty. */
  topMap?: string[];
  windows?: { r: number; c: number; side: Side }[];
  /** Doors sit on a wall like windows but are two-sided ("beside" on both cells). */
  doors?: { r: number; c: number; side: Side }[];
  suspects: SuspectJson[];
  victim: { name: string; attributes?: Record<string, AttributeValue> };
  globalClues?: ClueJson[];
  /** Board-wide clues (counts / empty rooms), shown separately from suspects. */
  boardClues?: BoardClueJson[];
  difficulty?: string;
}
