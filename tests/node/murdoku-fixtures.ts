import type { Cell, LevelJson, PersonId } from "@entities/murdoku";

/**
 * Eigen 4×4-fixture voor de Wie was het?-engine. Geen boekzaak: het bord, de
 * aanwijzingen en de namen zijn eigen werk en dekken precies de lastige
 * semantiek (naast door een muur, alleen met het slachtoffer, de enige op een
 * stoel en een raam tussen twee vakjes).
 *
 * Plattegrond (rijen × kolommen):
 *
 *   1 1 1 2
 *   1 1 1 2
 *   3 3 4 4
 *   3 3 4 4
 *
 * De enige bezetbare vakjes zijn (0,3), (1,2), (1,3), (2,0), (3,1) en (3,3).
 * De rij/kolom-regel dwingt de oplossing daarmee in één richting; de
 * aanwijzingen wijzen de personen aan.
 */
export const MURDOKU_FIXTURE: LevelJson = {
  schema: 1,
  id: "test-4x4-verjaardag",
  title: "De verdwenen taart",
  size: { width: 4, height: 4 },
  rooms: {
    "1": { nameKey: "room.keuken", color: "#e8d8b0" },
    "2": { nameKey: "room.gang", color: "#b9d0e6" },
    "3": { nameKey: "room.slaapkamer", color: "#cfe0cf" },
    "4": { nameKey: "room.badkamer", color: "#d8c0c0" },
  },
  objects: {
    b: { type: "bed", occupiable: true },
    r: { type: "carpet", occupiable: true },
    s: { type: "chair", occupiable: true },
    t: { type: "table", occupiable: false },
    x: { type: "box", occupiable: false },
  },
  roomMap: ["1112", "1112", "3344", "3344"],
  topMap: ["xttr", "xxsr", "bxxx", "xrxs"],
  windows: [{ r: 1, c: 3, side: "N" }],
  suspects: [
    {
      id: "A",
      name: "Anna",
      clues: [{ type: "alone" }, { type: "nearWindow" }],
    },
    {
      id: "B",
      name: "Bram",
      clues: [
        { type: "nearObject", object: "table" },
        { type: "uniqueOnObject", object: "chair" },
      ],
    },
    {
      id: "C",
      name: "Cato",
      clues: [{ type: "inCol", col: 0 }],
    },
  ],
  victim: { name: "Vera" },
};

/** De unieke oplossing van {@link MURDOKU_FIXTURE}. */
export const MURDOKU_SOLUTION: Readonly<Record<PersonId, Cell>> = {
  A: 3,
  B: 6,
  C: 8,
  victim: 13,
};

/** Een volledige plaatsing met per persoon een cel; ontbrekende personen blijven weg. */
export function placement(overrides: Readonly<Record<PersonId, Cell>> = {}): Map<PersonId, Cell> {
  return new Map(Object.entries({ ...MURDOKU_SOLUTION, ...overrides }));
}

/**
 * Door de MIT-generator gemaakt level (`gen-apartment-864520663`) uit
 * `LifeValuable/murdoku`, gebruikt als onafhankelijke fixture. Niet bewerkt.
 */
export const MURDOKU_GENERATED_FIXTURE: LevelJson = {
  schema: 1,
  id: "gen-apartment-864520663",
  difficulty: "medium",
  size: { width: 6, height: 6 },
  rooms: {
    "1": { nameKey: "room.bedroom", color: "#e8d8b0" },
    "2": { nameKey: "room.study", color: "#b9d0e6" },
    "3": { nameKey: "room.garage", color: "#cfe0cf" },
  },
  objects: {
    s: { type: "chair", occupiable: true },
    r: { type: "carpet", occupiable: true },
    b: { type: "bed", occupiable: true },
    c: { type: "car", occupiable: true },
    t: { type: "table", occupiable: false },
    p: { type: "plant", occupiable: false },
    g: { type: "shelf", occupiable: false },
    x: { type: "box", occupiable: false },
    f: { type: "tv", occupiable: false },
    u: { type: "shrub", occupiable: false },
  },
  roomMap: ["112222", "112222", "133333", "111333", "113333", "113333"],
  groundMap: [".r....", "......", "r.....", "......", "..r...", "......"],
  topMap: ["....b.", ".fspb.", "..s.x.", "xx..f.", ".u.t..", ".s...."],
  windows: [
    { r: 3, c: 5, side: "E" },
    { r: 4, c: 0, side: "W" },
    { r: 5, c: 0, side: "S" },
    { r: 2, c: 5, side: "E" },
  ],
  suspects: [
    {
      id: "A",
      name: "Anna",
      attributes: { gender: "f", glasses: true, hair: "blond", beard: false, bald: false },
      clues: [{ type: "nearObject", object: "shrub" }],
    },
    {
      id: "B",
      name: "Bella",
      attributes: { gender: "f", glasses: true, hair: "blond", beard: false, bald: false },
      clues: [{ type: "onObject", object: "chair" }],
    },
    {
      id: "C",
      name: "Carol",
      attributes: { gender: "f", glasses: false, hair: "brown", beard: false, bald: false },
      clues: [{ type: "nearObject", object: "table" }],
    },
    {
      id: "D",
      name: "Dalia",
      attributes: { gender: "f", glasses: false, hair: "brown", beard: false, bald: false },
      clues: [
        { type: "and", clues: [{ type: "nearObject", object: "table" }, { type: "atWall" }] },
      ],
    },
    {
      id: "E",
      name: "Elsa",
      attributes: { gender: "f", glasses: false, hair: "black", beard: false, bald: false },
      clues: [{ type: "sameRoom", as: "D" }],
    },
  ],
  victim: {
    name: "Viola",
    attributes: { gender: "f", glasses: true, hair: "white", beard: false, bald: false },
  },
  title: "Violas letzte Nacht",
  titles: { de: "Violas letzte Nacht", en: "Viola's Last Night" },
};
