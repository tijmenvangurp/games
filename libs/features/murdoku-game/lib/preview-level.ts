import type { Cell, LevelJson, PersonId } from "@entities/murdoku";
import { roomTint } from "./palette";

/**
 * Eigen 4×4-fixture voor de tijdelijke bordpreview van ticket #119. Geen boekzaak:
 * plattegrond, meubels en namen zijn eigen werk. De fixture laat vier kamers,
 * drie tapijten, een stoel, een bed, twee tafels, twee boekenkasten, een raam en
 * drie portretten zien.
 *
 * Plattegrond (rijen × kolommen):
 *
 *   1 1 2 2
 *   1 1 2 2
 *   3 3 4 4
 *   3 3 4 4
 *
 * Bezetbaar: (0,1) tapijt, (1,0) stoel, (2,0)+(2,1) bed, (2,3) tapijt,
 * (3,2) tapijt. De oplossing hieronder gebruikt rij en kolom één keer en zet
 * Cato als enige bij Vera in kamer 4.
 */
export const MURDOKU_PREVIEW_LEVEL: LevelJson = {
  schema: 1,
  id: "voorbeeld-4x4-verjaardag",
  title: "De verdwenen taart",
  size: { width: 4, height: 4 },
  rooms: {
    "1": { nameKey: "room.keuken", color: roomTint(0) },
    "2": { nameKey: "room.gang", color: roomTint(1) },
    "3": { nameKey: "room.slaapkamer", color: roomTint(2) },
    "4": { nameKey: "room.badkamer", color: roomTint(3) },
  },
  objects: {
    b: { type: "bed", occupiable: true },
    r: { type: "carpet", occupiable: true },
    s: { type: "chair", occupiable: true },
    t: { type: "table", occupiable: false },
    g: { type: "shelf", occupiable: false },
  },
  roomMap: ["1122", "1122", "3344", "3344"],
  groundMap: [".r..", "....", "...r", "..r."],
  topMap: ["..tt", "s...", "bb..", ".g.g"],
  windows: [{ r: 0, c: 2, side: "N" }],
  suspects: [
    {
      id: "A",
      name: "Anna",
      attributes: { gender: "f", hair: "blond", hairstyle: "bob" },
      clues: [{ type: "inRoom", room: "1" }],
    },
    {
      id: "B",
      name: "Bram",
      attributes: { gender: "m", hair: "brown", glasses: true },
      clues: [{ type: "onObject", object: "chair" }],
    },
    {
      id: "C",
      name: "Cato",
      attributes: { gender: "f", hair: "black", hairstyle: "braids" },
      clues: [{ type: "inRoom", room: "4" }],
    },
  ],
  victim: {
    name: "Vera",
    attributes: { gender: "f", hair: "red", hairstyle: "ponytailLeft" },
  },
};

/** De oplossing van {@link MURDOKU_PREVIEW_LEVEL}, voor de preview en het testbeeld. */
export const MURDOKU_PREVIEW_SOLUTION: ReadonlyMap<PersonId, Cell> = new Map([
  ["A", 1],
  ["B", 4],
  ["C", 11],
  ["victim", 14],
]);

/**
 * De preview toont de drie verdachten. Het slachtofferteken is in de MIT-bron een
 * emoji-schedel; dat zowel off-theme als emoji-afhankelijk is, dus de echte
 * onthulling en het slachtofferportret horen bij #120/#123.
 */
export const MURDOKU_PREVIEW_PLACEMENTS: ReadonlyMap<PersonId, Cell> = new Map([
  ["A", 1],
  ["B", 4],
  ["C", 11],
]);
