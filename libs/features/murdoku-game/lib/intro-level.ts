import type { Cell, LevelJson, PersonId } from "@entities/murdoku";
import type { MurdokuLoot } from "@entities/murdoku";
import { roomTint } from "./palette";

/**
 * De buit van de instapzaak. De engine noemt hem intern `victim`, maar op het
 * bord en in de tekst is het de gestolen taart: een voorwerp, geen persoon.
 */
export const MURDOKU_INTRO_LOOT: MurdokuLoot = { name: "de taart", icon: "cake" };

/** De intro die bij de instapzaak op de pagina staat. */
export const MURDOKU_INTRO_INTRO =
  "Op de verjaardag is de taart ineens weg. Lees de aanwijzingen en vind de dief die als enige bij de buit was.";

/**
 * De eigen 4×4-instapzaak van Wie was het?. Geen boekzaak: plattegrond, meubels
 * en namen zijn eigen werk. De zaak laat vier kamers, drie tapijten, een stoel,
 * een bed, twee tafels, twee boekenkasten, een raam en drie verdachten zien.
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
 * Cato als enige bij de taart in kamer 4.
 *
 * Deze zaak is het instaplevel van Wie was het?. Het bord start leeg; het kind
 * plaatst de drie verdachten zelf. De buit volgt bij de afloop.
 */
export const MURDOKU_INTRO_LEVEL: LevelJson = {
  schema: 1,
  id: "intro-4x4-verjaardag",
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
      clues: [
        { type: "inRoom", room: "4" },
        { type: "inCol", col: 3 },
      ],
    },
  ],
  victim: {
    name: MURDOKU_INTRO_LOOT.name,
    attributes: { gender: "f", hair: "red", hairstyle: "ponytailLeft" },
  },
};

/**
 * De oplossing van {@link MURDOKU_INTRO_LEVEL}. Het bord start leeg; deze kaart
 * is de fixture voor de regels, de latere controle en de tests. `victim` is de
 * interne id van de buit.
 */
export const MURDOKU_INTRO_SOLUTION: ReadonlyMap<PersonId, Cell> = new Map([
  ["A", 1],
  ["B", 4],
  ["C", 11],
  ["victim", 14],
]);
