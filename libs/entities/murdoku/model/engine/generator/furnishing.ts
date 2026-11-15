/**
 * Semantic room furnishing — decides WHICH objects belong in a room and arranges them
 * so a level feels BUILT and FULL, not random and not empty. Each room is classified
 * into an ARCHETYPE (bath, kitchen, dining, shop aisle, garden, animal pen, …) and
 * furnished by a per-archetype recipe: a few defining FEATURES plus repeating FILL
 * blocks (table+chair sets, shelf racks, clusters) that pack the room up to a target
 * fill ratio — matching the density of the hand-built levels (~40–50 % of cells carry a
 * top object, with carpet layered underneath).
 *
 * It works on i18n room nameKeys (room.*), so it is language-independent, and falls back
 * to keyword heuristics + an indoor/outdoor generic recipe for rooms it doesn't know — so
 * future themes furnish sensibly without touching this file.
 *
 * Layering: carpet sits on the GROUND layer; everything else on the TOP layer. A table
 * or chair may stand ON a carpet (the model and renderer both stack the two). Only objects
 * in the caller's allowed set are placed; an object that fits NO room never appears.
 * People cells are sacred: they may gain carpet or a seat to sit on, never a blocker.
 */
import type { Rng } from "./random.ts";
import type { Cell } from "../domain/types.ts";
import { OBJECT_CATALOG } from "../domain/objects.ts";
import { isWaterRoom } from "../domain/rooms.ts";

const CHAR_OF: Record<string, string> = {};
const IS_OCCUPIABLE: Record<string, boolean> = {};
/** Reverse of CHAR_OF for occupiability — used to keep carpet out from under blockers. */
const OCC_OF_CHAR: Record<string, boolean> = {};
for (const o of OBJECT_CATALOG) {
  CHAR_OF[o.type] = o.char;
  IS_OCCUPIABLE[o.type] = o.occupiable;
  OCC_OF_CHAR[o.char] = o.occupiable;
}

/** Objects that look natural HEAPED together (a stack of boxes, a couple of haystacks);
 *  every other fill item is SPREAD out instead, so we never get "3 lamps in a row". */
const PILE_TYPES = new Set(["box", "crate", "rubble", "oil", "mud", "gift", "hay", "barrel"]);
/** Per-room cap on decorative FILL ITEMS that look bad in bulk. Racks, clusters and
 *  features are exempt (a shop wall of fridges or a greenhouse of plants is fine). */
const ITEM_CAP: Record<string, number> = {
  lamp: 1,
  tv: 1,
  plant: 3,
  statue: 4,
  campfire: 1,
  grill: 1,
  candle: 3,
  armor: 2,
  fireplace: 1,
  parasol: 3,
  slide: 2,
  deckchair: 4,
  hottub: 1,
  hammock: 2,
};

/** Room kinds the furnisher knows. Many room nameKeys map to the same archetype. */
type Archetype =
  | "bath"
  | "laundry"
  | "kitchen"
  | "bedroom"
  | "cell"
  | "living"
  | "dining"
  | "office"
  | "library"
  | "auditorium"
  | "storage"
  | "lockerroom"
  | "music"
  | "shopAisle"
  | "shopChilled"
  | "checkout"
  | "workshop"
  | "parking"
  | "gym"
  | "greenhouse"
  | "garden"
  | "deck"
  | "pasture"
  | "forest"
  | "camp"
  | "lake"
  | "barn"
  | "animalCow"
  | "animalPig"
  | "animalHen"
  | "animalStable"
  | "throne"
  | "greathall"
  | "chapel"
  | "dungeon"
  | "armory"
  | "cellar"
  | "chamber"
  | "oldkitchen"
  | "bailey"
  | "wallwalk"
  | "pool"
  | "kidpool"
  | "sunlawn"
  | "sauna"
  | "slidetower"
  | "massage"
  | "relax"
  | "spa"
  | "playground"
  | "gallery"
  | "genericIndoor"
  | "genericOutdoor";

/** A defining object, placed first. */
interface Feature {
  type: string;
  /** rack = a line along a wall; pair = a 2-cell object (bed/car); single = one item
   *  in a corner/wall; cluster = several of a kind grouped. */
  style: "rack" | "pair" | "single" | "cluster";
  count: [number, number];
}

/** A repeating fill block, weighted, used to pack the room up to its target fill. */
type FillBlock =
  // A table/desk ISLAND: `size` adjacent surface cells (tables auto-merge into one big
  // table in the renderer) ringed by up to `chairMax` chairs — the dining/banquet look.
  | { kind: "set"; type: string; size: [number, number]; chairMax: number; w: number }
  | { kind: "rack"; type: string; len: [number, number]; w: number } // a line of N
  | { kind: "cluster"; type: string; n: [number, number]; w: number } // grouped
  | { kind: "item"; type: string; w: number }; // one, piled next to its kind

interface Recipe {
  features: Feature[];
  fill: FillBlock[];
  /** Desired fraction of the room's cells carrying a TOP object (~0.4–0.5 like hand-built). */
  targetFill: number;
  /** Fraction of the room covered by a carpet rug (ground layer, under furniture). */
  carpet: number;
}

const ft = (type: string, style: Feature["style"], min: number, max: number): Feature => ({
  type,
  style,
  count: [min, max],
});
const set = (type: string, smin: number, smax: number, chairMax: number, w = 1): FillBlock => ({
  kind: "set",
  type,
  size: [smin, smax],
  chairMax,
  w,
});
const rk = (type: string, lmin: number, lmax: number, w = 1): FillBlock => ({
  kind: "rack",
  type,
  len: [lmin, lmax],
  w,
});
const cl = (type: string, nmin: number, nmax: number, w = 1): FillBlock => ({
  kind: "cluster",
  type,
  n: [nmin, nmax],
  w,
});
const it = (type: string, w = 1): FillBlock => ({ kind: "item", type, w });

// Target fills & compositions are tuned to the hand-built levels (see dev/furnish-stats):
// ~0.4–0.53 of cells carry a top object; carpet is SPARSE (≈0.05–0.18), so fullness comes
// from FURNITURE, not rug. Dining/cafeteria = many table+chair sets; kitchen = prep tables
// + one fridge; bedroom = beds + a nightstand; storage/shop = shelf racks.
const RECIPES: Record<Archetype, Recipe> = {
  bath: {
    features: [
      ft("toilet", "single", 1, 1),
      ft("shower", "single", 0, 1),
      ft("washingmachine", "single", 0, 1),
    ],
    fill: [
      it("shower", 2),
      rk("shelf", 1, 2, 2),
      it("plant", 2),
      it("washingmachine", 1),
      it("trash", 1),
      set("table", 1, 1, 1, 1),
      it("chair", 1),
    ],
    targetFill: 0.34,
    carpet: 0.18,
  },
  laundry: {
    features: [ft("washingmachine", "rack", 2, 3)],
    fill: [
      rk("shelf", 2, 3, 3),
      set("table", 1, 2, 2, 2),
      rk("washingmachine", 1, 2, 1),
      it("box", 2),
      it("crate", 1),
      it("chair", 1),
    ],
    targetFill: 0.46,
    carpet: 0.12,
  },
  kitchen: {
    features: [ft("fridge", "single", 1, 1)],
    fill: [
      set("table", 1, 3, 2, 4),
      rk("shelf", 1, 2, 2),
      it("crate", 2),
      it("trash", 1),
      it("box", 1),
      it("fridge", 1),
      it("plant", 1),
    ],
    targetFill: 0.42,
    carpet: 0.06,
  },
  bedroom: {
    features: [ft("bed", "pair", 1, 2), ft("lamp", "single", 0, 1), ft("tv", "single", 0, 1)],
    fill: [it("shelf", 2), set("table", 1, 1, 1, 1), it("plant", 1), it("box", 1)],
    targetFill: 0.44,
    carpet: 0.1,
  },
  cell: {
    features: [ft("bed", "pair", 1, 1), ft("toilet", "single", 0, 1)],
    fill: [it("shelf", 1), it("box", 1)],
    targetFill: 0.4,
    carpet: 0.05,
  },
  living: {
    features: [ft("tv", "single", 1, 1), ft("lamp", "single", 0, 1)],
    fill: [
      set("table", 1, 2, 4, 3),
      it("shelf", 2),
      it("plant", 2),
      it("chair", 1),
      it("piano", 1),
      it("fireplace", 1),
    ],
    targetFill: 0.42,
    carpet: 0.16,
  },
  music: {
    features: [ft("piano", "single", 1, 1), ft("lamp", "single", 0, 1)],
    fill: [
      rk("chair", 2, 4, 4),
      set("table", 1, 1, 2, 1),
      it("shelf", 1),
      it("plant", 2),
      it("chair", 1),
    ],
    targetFill: 0.4,
    carpet: 0.16,
  },
  dining: {
    features: [],
    fill: [set("table", 1, 4, 6, 6), it("plant", 1), rk("shelf", 0, 1, 1)],
    targetFill: 0.52,
    carpet: 0.1,
  },
  office: {
    features: [ft("pc", "single", 1, 2)],
    fill: [
      set("pc", 1, 1, 2, 3),
      set("table", 1, 2, 4, 2),
      rk("shelf", 2, 3, 2),
      rk("locker", 1, 2, 1),
      it("plant", 1),
      it("box", 1),
    ],
    targetFill: 0.5,
    carpet: 0.08,
  },
  library: {
    features: [],
    fill: [rk("shelf", 3, 5, 5), set("table", 1, 2, 4, 2), it("plant", 1)],
    targetFill: 0.5,
    carpet: 0.1,
  },
  auditorium: {
    features: [],
    fill: [rk("chair", 4, 7, 5), it("plant", 1)],
    targetFill: 0.45,
    carpet: 0.1,
  },
  storage: {
    features: [],
    fill: [rk("shelf", 3, 5, 4), it("box", 3), it("crate", 3), rk("locker", 1, 2, 1)],
    targetFill: 0.48,
    carpet: 0,
  },
  lockerroom: {
    features: [],
    fill: [rk("locker", 3, 5, 4), rk("chair", 2, 3, 1), it("box", 1)],
    targetFill: 0.46,
    carpet: 0.1,
  },
  shopAisle: {
    features: [],
    fill: [
      rk("shelf", 3, 5, 5),
      it("crate", 2),
      it("box", 2),
      it("trash", 1),
      set("table", 1, 2, 0, 1),
    ],
    targetFill: 0.46,
    carpet: 0.12,
  },
  shopChilled: {
    features: [],
    fill: [rk("fridge", 3, 5, 5), it("crate", 2), it("box", 1)],
    targetFill: 0.48,
    carpet: 0.1,
  },
  checkout: {
    features: [ft("cash", "single", 1, 3)],
    fill: [
      rk("shelf", 1, 2, 2),
      it("cash", 2),
      set("table", 1, 1, 1, 1),
      it("crate", 1),
      it("trash", 1),
    ],
    targetFill: 0.5,
    carpet: 0.08,
  },
  workshop: {
    features: [ft("car", "pair", 0, 1)],
    fill: [
      rk("shelf", 2, 3, 3),
      rk("locker", 1, 2, 2),
      it("box", 2),
      it("crate", 2),
      it("oil", 1),
      it("trash", 1),
      it("fuelpump", 1),
    ],
    targetFill: 0.44,
    carpet: 0,
  },
  parking: {
    features: [ft("car", "pair", 3, 6)],
    fill: [it("trash", 2), it("rubble", 2), it("boulder", 1)],
    targetFill: 0.42,
    carpet: 0,
  },
  gym: {
    features: [ft("punchbag", "cluster", 2, 4)],
    fill: [rk("locker", 1, 2, 2), it("punchbag", 2), set("table", 1, 1, 1, 1), it("box", 1)],
    targetFill: 0.34,
    carpet: 0.18,
  },
  greenhouse: {
    features: [],
    fill: [cl("plant", 3, 5, 5), cl("shrub", 2, 4, 3), rk("shelf", 1, 2, 1), it("box", 1)],
    targetFill: 0.5,
    carpet: 0,
  },
  garden: {
    features: [
      ft("tree", "cluster", 1, 3),
      ft("statue", "single", 0, 1),
      ft("grill", "single", 0, 1),
      ft("tent", "single", 0, 1),
    ],
    fill: [
      cl("shrub", 2, 4, 3),
      cl("plant", 2, 3, 2),
      it("tree", 2),
      it("boulder", 2),
      it("rubble", 1),
      it("shrub", 2),
      it("mud", 2),
      it("grill", 2),
      it("tent", 1),
      it("deckchair", 1),
      it("parasol", 1),
      it("hammock", 1),
    ],
    targetFill: 0.3,
    carpet: 0,
  },
  // A paved outdoor seating area (terrace / balcony / rooftop / porch): an outdoor
  // dining set, potted greenery and — now and then — a barbecue. A TENT or open
  // CAMPFIRE would make no sense up here, so neither is offered.
  deck: {
    features: [ft("grill", "single", 0, 1)],
    fill: [
      set("table", 1, 2, 4, 4),
      cl("plant", 2, 3, 3),
      it("plant", 2),
      it("chair", 1),
      it("deckchair", 1),
      it("parasol", 1),
      it("hottub", 1),
      it("hammock", 1),
      it("shrub", 1),
      it("grill", 1),
      it("lamp", 1),
    ],
    targetFill: 0.34,
    carpet: 0,
  },
  pasture: {
    features: [
      ft("cow", "cluster", 2, 3),
      ft("horse", "cluster", 0, 1),
      ft("hay", "cluster", 0, 2),
    ],
    fill: [
      cl("cow", 2, 3, 2),
      it("hay", 3),
      it("tree", 2),
      it("shrub", 2),
      it("mud", 2),
      it("boulder", 1),
    ],
    targetFill: 0.3,
    carpet: 0,
  },
  // The BARN is the hay loft of the farm: haystacks as its signature, crates/boxes as
  // stores — distinct from the generic indoor 'storage' (shelves), which city themes use.
  barn: {
    features: [ft("hay", "cluster", 2, 3), ft("carriage", "pair", 0, 1)],
    fill: [it("hay", 3), it("crate", 2), it("barrel", 1), it("box", 1), it("mud", 1)],
    targetFill: 0.44,
    carpet: 0,
  },
  // --- camping / wilderness (bear lives ONLY here → "Bär nur draußen") ---
  forest: {
    features: [
      ft("tree", "cluster", 2, 4),
      ft("tent", "single", 0, 1),
      ft("campfire", "single", 0, 1),
    ],
    fill: [
      cl("tree", 2, 4, 4),
      cl("shrub", 2, 4, 3),
      it("boulder", 2),
      it("mud", 1),
      it("rubble", 1),
      it("bear", 1),
      it("tent", 1),
      it("campfire", 1),
      it("hammock", 1),
    ],
    targetFill: 0.34,
    carpet: 0,
  },
  camp: {
    // The odd hay bale doubles as campfire seating — a small feature chance plus a
    // fill weight, so roughly every other campsite has one without it taking over.
    features: [
      ft("tent", "cluster", 1, 2),
      ft("campfire", "single", 0, 1),
      ft("grill", "single", 0, 1),
      ft("tree", "single", 1, 2),
      ft("hay", "cluster", 0, 2),
    ],
    fill: [
      it("tent", 2),
      it("grill", 1),
      set("table", 1, 1, 4, 2),
      it("chair", 1),
      it("hay", 2),
      it("hammock", 1),
      it("crate", 2),
      it("box", 1),
      it("trash", 1),
      cl("shrub", 1, 3, 2),
      it("mud", 1),
      it("bear", 1),
    ],
    targetFill: 0.34,
    carpet: 0,
  },
  // The lake is drawn as open WATER (see boardRender), so it stays mostly clear: only
  // card-free, water-appropriate things float on it — a rowing boat now and then (a 2-cell
  // occupiable object, water only because the lake recipe is only ever used for water rooms),
  // water lilies (its signature) and the odd muddy shallow. Camp/grill/tent props belong on
  // the grassy rooms, not on the water.
  lake: {
    features: [ft("boat", "pair", 0, 1), ft("waterlily", "cluster", 1, 3)],
    fill: [cl("waterlily", 2, 4, 5), it("mud", 1)],
    targetFill: 0.22,
    carpet: 0,
  },
  animalCow: {
    features: [ft("cow", "cluster", 3, 5)],
    fill: [it("cow", 3), it("hay", 2), it("crate", 2), it("mud", 2), it("shrub", 1)],
    targetFill: 0.44,
    carpet: 0,
  },
  animalPig: {
    features: [ft("pig", "cluster", 3, 5)],
    fill: [it("pig", 3), it("hay", 1), it("crate", 2), it("mud", 2)],
    targetFill: 0.42,
    carpet: 0,
  },
  animalHen: {
    features: [ft("chicken", "cluster", 4, 6)],
    fill: [it("chicken", 3), it("hay", 1), it("crate", 2), it("shrub", 1)],
    targetFill: 0.44,
    carpet: 0,
  },
  animalStable: {
    features: [ft("horse", "cluster", 2, 4), ft("carriage", "pair", 0, 1)],
    fill: [it("horse", 2), it("hay", 2), it("crate", 2), it("mud", 1)],
    targetFill: 0.44,
    carpet: 0,
  },
  // --- castle ---
  throne: {
    features: [
      ft("throne", "single", 1, 1),
      ft("armor", "single", 0, 2),
      ft("statue", "single", 0, 1),
    ],
    fill: [it("candle", 3), it("armor", 1), it("statue", 1), it("plant", 1)],
    targetFill: 0.3,
    carpet: 0.22, // long crimson runner up to the throne
  },
  greathall: {
    features: [ft("fireplace", "single", 1, 1), ft("armor", "single", 0, 1)],
    fill: [set("table", 2, 4, 6, 5), it("candle", 2), it("armor", 1)],
    targetFill: 0.5,
    carpet: 0.08,
  },
  chapel: {
    features: [ft("statue", "single", 1, 1), ft("candle", "single", 1, 2)],
    fill: [rk("chair", 3, 5, 5), it("candle", 2), it("plant", 1)],
    targetFill: 0.42,
    carpet: 0.06,
  },
  dungeon: {
    features: [ft("hay", "cluster", 1, 2)],
    fill: [it("barrel", 2), it("rubble", 2), it("crate", 1), it("candle", 1), it("box", 1)],
    targetFill: 0.4,
    carpet: 0,
  },
  // Weapon racks + lockers — shared by castle armouries/gatehouses AND the police lock-up.
  armory: {
    features: [ft("weaponrack", "rack", 2, 3)],
    fill: [rk("weaponrack", 1, 2, 2), rk("locker", 1, 2, 1), it("crate", 2), it("box", 1)],
    targetFill: 0.46,
    carpet: 0,
  },
  // Barrel vaults — the wine cellars of mansions and restaurants get barrels too.
  cellar: {
    features: [ft("barrel", "cluster", 2, 4)],
    fill: [it("barrel", 3), rk("shelf", 1, 2, 2), it("crate", 2), it("box", 1)],
    targetFill: 0.46,
    carpet: 0,
  },
  chamber: {
    features: [ft("bed", "pair", 1, 1), ft("fireplace", "single", 0, 1)],
    fill: [it("candle", 2), it("shelf", 1), set("table", 1, 1, 1, 1), it("box", 1)],
    targetFill: 0.4,
    carpet: 0.14,
  },
  oldkitchen: {
    features: [ft("fireplace", "single", 1, 1)],
    fill: [
      set("table", 1, 3, 2, 3),
      it("barrel", 2),
      it("crate", 2),
      rk("shelf", 1, 2, 1),
      it("box", 1),
    ],
    targetFill: 0.42,
    carpet: 0,
  },
  // Courtyard & battlements: sparse open stone with supply clutter along the walls.
  bailey: {
    features: [
      ft("tree", "single", 0, 1),
      ft("statue", "single", 0, 1),
      ft("carriage", "pair", 0, 1),
    ],
    fill: [
      it("barrel", 2),
      it("crate", 1),
      it("hay", 1),
      it("boulder", 1),
      it("shrub", 1),
      it("rubble", 1),
    ],
    targetFill: 0.26,
    carpet: 0,
  },
  // The wall-walk: a narrow patrol path — just sparse supplies, no coach up here.
  wallwalk: {
    features: [],
    fill: [it("barrel", 1), it("crate", 1), it("rubble", 1), it("boulder", 1)],
    targetFill: 0.18,
    carpet: 0,
  },
  // --- pool & spa ---
  // The pools are WATER rooms but use these sparse recipes instead of the lake's
  // (no lilies/boats in a swimming pool) — open water, plus the springboard in the
  // MAIN pool only (nobody dives into the paddling pool).
  pool: {
    features: [ft("divingboard", "single", 0, 1)],
    fill: [],
    targetFill: 0.05,
    carpet: 0,
  },
  kidpool: {
    features: [],
    fill: [],
    targetFill: 0.02,
    carpet: 0,
  },
  sunlawn: {
    features: [ft("parasol", "single", 1, 2), ft("deckchair", "cluster", 2, 3)],
    fill: [
      cl("deckchair", 2, 3, 4),
      it("deckchair", 2),
      it("parasol", 2),
      it("hammock", 1),
      it("shrub", 1),
      it("tree", 1),
      it("trash", 1),
    ],
    targetFill: 0.34,
    carpet: 0,
  },
  sauna: {
    features: [],
    fill: [rk("chair", 2, 4, 4), it("candle", 1), it("plant", 1)],
    targetFill: 0.36,
    carpet: 0,
  },
  slidetower: {
    features: [ft("slide", "single", 1, 2)],
    fill: [it("slide", 1), rk("chair", 1, 2, 1), it("trash", 1), it("shrub", 1)],
    targetFill: 0.3,
    carpet: 0,
  },
  massage: {
    features: [ft("bed", "pair", 1, 1), ft("candle", "single", 0, 2)],
    fill: [it("plant", 2), it("candle", 1), rk("shelf", 1, 1, 1), set("table", 1, 1, 0, 1)],
    targetFill: 0.36,
    carpet: 0.15,
  },
  relax: {
    features: [
      ft("deckchair", "cluster", 2, 3),
      ft("hottub", "single", 0, 1),
      ft("lamp", "single", 0, 1),
    ],
    fill: [it("deckchair", 2), it("plant", 2), it("candle", 1), set("table", 1, 1, 0, 1)],
    targetFill: 0.36,
    carpet: 0.2,
  },
  // Kids' corner: the (playground-look) slide is the landmark; benches and greenery around.
  playground: {
    features: [ft("slide", "single", 1, 1)],
    fill: [
      it("slide", 1),
      cl("shrub", 1, 3, 2),
      it("tree", 1),
      it("chair", 1),
      it("trash", 1),
      it("mud", 1),
    ],
    targetFill: 0.26,
    carpet: 0,
  },
  // Hotel wellness: the hot tub IS the room, flanked by loungers and candles.
  spa: {
    features: [ft("hottub", "single", 1, 1), ft("shower", "single", 0, 1)],
    fill: [it("deckchair", 2), it("candle", 2), it("plant", 2), it("shelf", 1)],
    targetFill: 0.32,
    carpet: 0,
  },
  gallery: {
    features: [ft("statue", "single", 1, 3)],
    fill: [it("statue", 2), it("plant", 2), it("shelf", 1)],
    targetFill: 0.34,
    carpet: 0.12,
  },
  genericIndoor: {
    features: [ft("lamp", "single", 0, 1)],
    fill: [
      set("table", 1, 2, 4, 2),
      rk("shelf", 1, 2, 2),
      it("plant", 1),
      it("box", 1),
      it("chair", 1),
    ],
    targetFill: 0.4,
    carpet: 0.2,
  },
  genericOutdoor: {
    features: [ft("tree", "cluster", 1, 3)],
    fill: [cl("shrub", 2, 4, 2), it("tree", 2), it("boulder", 2), it("rubble", 1), it("shrub", 2)],
    targetFill: 0.38,
    carpet: 0,
  },
};

/** Explicit nameKey → archetype map (bare key, no `room.` prefix). Covers every room
 *  the built-in themes use; unknown keys fall through to keyword heuristics below. */
const ARCHETYPE_OF: Record<string, Archetype> = {
  bathroom: "bath",
  bath: "bath",
  guestbath: "bath",
  restroom: "bath",
  spa: "spa",
  laundry: "laundry",
  laundrette: "laundry",
  utilityroom: "laundry",
  kitchen: "kitchen",
  kitchenette: "kitchen",
  pantry: "kitchen",
  scullery: "kitchen",
  preproom: "kitchen",
  dairy: "kitchen",
  bedroom: "bedroom",
  guestroom: "bedroom",
  kids1: "bedroom",
  kids2: "bedroom",
  kidsroom: "bedroom",
  boudoir: "bedroom",
  servantsroom: "bedroom",
  dressingroom: "bedroom",
  suite: "bedroom",
  ward: "bedroom",
  icu: "bedroom",
  deliveryroom: "bedroom",
  cell1: "cell",
  cell2: "cell",
  living: "living",
  lounge: "living",
  salon: "living",
  commonroom: "living",
  lobby: "living",
  foyer: "living",
  vestibule: "living",
  firesideroom: "living",
  breakroom: "living",
  staffroom: "living",
  waiting: "living",
  waitingroom: "living",
  reception: "living",
  receptionarea: "living",
  frontdesk: "living",
  conservatory: "living",
  smokingroom: "living",
  musicroom: "music",
  musichall: "music",
  gameroom: "living",
  ballroom: "living",
  farmhouse: "living",
  dining: "dining",
  dininghall: "dining",
  restaurant: "dining",
  canteen: "dining",
  cafeteria: "dining",
  breakfastroom: "dining",
  cafe: "dining",
  bar: "dining",
  office: "office",
  study: "office",
  openoffice: "office",
  bossoffice: "office",
  chiefoffice: "office",
  meeting: "office",
  conference: "office",
  copyroom: "office",
  printroom: "office",
  secretariat: "office",
  dispatch: "office",
  teachersroom: "office",
  computerroom: "office",
  classroom: "office",
  lab: "office",
  chemlab: "office",
  forensics: "office",
  serverroom: "office",
  briefing: "office",
  security: "office",
  operating: "office",
  xray: "office",
  emergency: "office",
  sterilization: "office",
  interrogation: "office",
  library: "library",
  auditorium: "auditorium",
  assemblyhall: "auditorium",
  storage: "storage",
  storeroom: "storage",
  stockroom: "storage",
  vault: "storage",
  luggageroom: "storage",
  partsstore: "storage",
  tirestore: "storage",
  shed: "storage",
  basement: "storage",
  attic: "storage",
  archive: "storage",
  evidenceroom: "storage",
  mailroom: "storage",
  pharmacy: "storage",
  barn: "barn",
  winecellar: "cellar", // barrels — mansions & restaurants included
  lockerroom: "lockerroom",
  cloakroom: "lockerroom",
  armory: "armory", // weapon racks — castle AND police lock-up
  snacks: "shopAisle",
  drinks: "shopAisle",
  deli: "shopAisle",
  fruit: "shopAisle",
  produce: "shopAisle",
  cheese: "shopAisle",
  bakery: "shopAisle",
  toys: "shopAisle",
  drugstore: "shopAisle",
  chilled: "shopChilled",
  frozen: "shopChilled",
  coldroom: "shopChilled",
  checkout: "checkout",
  workshop: "workshop",
  garage: "workshop",
  assembly: "workshop",
  paintshop: "workshop",
  testbay: "workshop",
  washbay: "workshop",
  craftroom: "workshop",
  artroom: "workshop",
  gasstation: "workshop",
  parking: "parking",
  gym: "gym",
  gymnasium: "gym",
  greenhouse: "greenhouse",
  yard: "garden",
  garden: "garden",
  schoolyard: "playground",
  frontyard: "garden",
  field: "garden",
  pond: "garden",
  terrace: "deck",
  balcony: "deck",
  porch: "deck",
  rooftop: "deck",
  pasture: "pasture",
  cowshed: "animalCow",
  pigsty: "animalPig",
  henhouse: "animalHen",
  stable: "animalStable",
  maingallery: "gallery",
  exposition: "gallery",
  gallery: "gallery",
  specialexhibit: "gallery",
  entrancehall: "gallery",
  // camping / wilderness (lake/jetty/sea/… are handled by isWaterRoom in archetypeOf)
  forest: "forest",
  clearing: "forest",
  campsite1: "camp",
  campsite2: "camp",
  campfire: "camp",
  picnicarea: "camp",
  playground: "playground",
  kiosk: "shopAisle",
  cabin: "bedroom",
  showers: "bath",
  // castle (moat is a water room → lake)
  throneroom: "throne",
  knightshall: "greathall",
  chapel: "chapel",
  dungeon: "dungeon",
  towerroom: "chamber",
  chamber: "chamber",
  battlements: "wallwalk",
  courtyard: "bailey",
  castlekitchen: "oldkitchen",
  gatehouse: "armory",
  // pool & spa (mainpool/kidspool are water rooms, but the explicit 'pool' entry wins
  // over the water fallback — a swimming pool gets no lilies/boats)
  mainpool: "pool",
  kidspool: "kidpool",
  lawn: "sunlawn",
  sauna: "sauna",
  steamroom: "sauna",
  slidetower: "slidetower",
  massage: "massage",
  relaxroom: "relax",
};

/** Keyword fallback for room keys not in the explicit map (future themes). */
function keywordArchetype(key: string, outside: boolean): Archetype {
  const has = (...words: string[]): boolean => words.some((w) => key.includes(w));
  if (has("cow")) return "animalCow";
  if (has("pig")) return "animalPig";
  if (has("hen", "chick", "poultry")) return "animalHen";
  if (has("stable", "horse")) return "animalStable";
  if (has("barn", "hay")) return "barn";
  if (outside) {
    if (has("park")) return "parking";
    if (has("pasture", "paddock", "meadow")) return "pasture";
    if (has("terrace", "balcony", "patio", "deck", "porch", "rooftop", "veranda")) return "deck";
    return "garden";
  }
  if (has("throne")) return "throne";
  if (has("chapel", "church")) return "chapel";
  if (has("dungeon")) return "dungeon";
  if (has("sauna", "steam")) return "sauna";
  if (has("armor", "armoury", "armory")) return "armory";
  if (has("spa", "wellness", "whirl")) return "spa";
  if (has("bath", "toilet", "rest", "wc", "shower")) return "bath";
  if (has("laundr", "utility")) return "laundry";
  if (has("kitchen", "pantry", "dairy", "prep", "scullery")) return "kitchen";
  if (has("cell", "jail", "prison")) return "cell";
  if (has("bed", "sleep", "ward", "dorm", "suite", "icu")) return "bedroom";
  if (has("locker", "cloak")) return "lockerroom";
  if (has("library", "archive", "reading")) return "library";
  if (has("audit", "assembly", "theatre", "theater", "lecture")) return "auditorium";
  if (has("gym")) return "gym";
  if (has("green")) return "greenhouse";
  if (has("gallery", "exhibit", "exposition", "museum")) return "gallery";
  if (has("chill", "frozen", "cold", "freezer")) return "shopChilled";
  if (has("checkout", "till", "register")) return "checkout";
  if (
    has(
      "aisle",
      "snack",
      "drink",
      "fruit",
      "produce",
      "cheese",
      "bakery",
      "toy",
      "drug",
      "grocery",
      "deli",
    )
  )
    return "shopAisle";
  if (
    has(
      "storage",
      "store",
      "stock",
      "vault",
      "depot",
      "cellar",
      "shed",
      "attic",
      "basement",
      "pharmac",
    )
  )
    return "storage";
  if (
    has("workshop", "garage", "assembly", "paint", "bay", "repair", "craft", "art", "gas", "fuel")
  )
    return "workshop";
  if (
    has(
      "dining",
      "dinner",
      "restaurant",
      "canteen",
      "cafeteria",
      "cafe",
      "bar",
      "breakfast",
      "mess",
    )
  )
    return "dining";
  if (
    has(
      "office",
      "study",
      "meeting",
      "conference",
      "desk",
      "comput",
      "class",
      "lab",
      "server",
      "forensic",
      "briefing",
      "admin",
    )
  )
    return "office";
  if (
    has(
      "living",
      "lounge",
      "salon",
      "lobby",
      "foyer",
      "common",
      "reception",
      "waiting",
      "parlor",
      "parlour",
      "den",
    )
  )
    return "living";
  return "genericIndoor";
}

/** Classify a room (its i18n nameKey + whether it's an outdoor area) into an archetype. */
export function archetypeOf(nameKey: string, outside: boolean): Archetype {
  // An explicit mapping wins even over the water look (the swimming pools ARE water
  // rooms visually, but furnish from the sparse 'pool' recipe — no lilies or boats).
  const key = nameKey.replace(/^room\./, "").toLowerCase();
  const explicit = ARCHETYPE_OF[key];
  if (explicit) return explicit;
  // Water rooms (lake/jetty/sea/moat/…) furnish from the lake recipe AND get the water
  // look — one shared definition (isWaterRoom) keeps the two in lock-step for any theme.
  if (isWaterRoom(nameKey)) return "lake";
  return keywordArchetype(key, outside);
}

/** Every object type a recipe can place (features + fill, chairs from sets, carpet rug). */
function recipeTypes(recipe: Recipe): string[] {
  const types = new Set<string>();
  for (const feat of recipe.features) types.add(feat.type);
  for (const b of recipe.fill) {
    types.add(b.type);
    if (b.kind === "set") types.add("chair");
  }
  if (recipe.carpet > 0) types.add("carpet");
  return [...types];
}

/**
 * The natural object palette for a set of rooms — every type any of their archetypes
 * would place. Used by the generator UI to pre-select sensible objects when a theme is
 * chosen (farm → animals, supermarket → fridges). De-duplicated, ordered by the catalog.
 */
export function kitFor(roomKeys: readonly string[], outdoorKeys: readonly string[]): string[] {
  const outdoor = new Set(outdoorKeys);
  const types = new Set<string>();
  for (const key of roomKeys)
    for (const t of recipeTypes(RECIPES[archetypeOf(key, outdoor.has(key))])) types.add(t);
  return OBJECT_CATALOG.map((o) => o.type).filter((t) => types.has(t) && t in CHAR_OF);
}

interface FurnishParams {
  width: number;
  height: number;
  peopleCells: Set<Cell>;
  allow: Set<string>;
  rng: Rng;
  roomNameOf: (cell: Cell) => string;
  isOutdoor: (cell: Cell) => boolean;
  roomIdOf: (cell: Cell) => string;
}

/**
 * Furnish the whole board room by room and return the ground (carpet) and top maps,
 * one string per row — the shape the loader expects.
 */
export function furnishRooms(p: FurnishParams): { groundMap: string[]; topMap: string[] } {
  const { width, height, peopleCells, allow, rng, roomNameOf, isOutdoor, roomIdOf } = p;
  const G: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "."),
  );
  const T: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "."),
  );

  const neighbors4 = (cell: Cell): Cell[] => {
    const r = Math.floor(cell / width);
    const c = cell % width;
    const out: Cell[] = [];
    if (r > 0) out.push(cell - width);
    if (r < height - 1) out.push(cell + width);
    if (c > 0) out.push(cell - 1);
    if (c < width - 1) out.push(cell + 1);
    return out;
  };
  const at = (grid: string[][], cell: Cell): string => grid[Math.floor(cell / width)][cell % width];
  const put = (grid: string[][], cell: Cell, ch: string): void => {
    grid[Math.floor(cell / width)][cell % width] = ch;
  };

  const byRoom = new Map<string, Cell[]>();
  for (let cell = 0; cell < width * height; cell++) {
    const id = roomIdOf(cell);
    const list = byRoom.get(id);
    if (list) list.push(cell);
    else byRoom.set(id, [cell]);
  }
  for (const cells of byRoom.values()) furnishOneRoom(cells);

  return { groundMap: G.map((r) => r.join("")), topMap: T.map((r) => r.join("")) };

  function furnishOneRoom(cells: Cell[]): void {
    const outside = isOutdoor(cells[0]);
    const recipe = RECIPES[archetypeOf(roomNameOf(cells[0]), outside)];
    const roomSet = new Set(cells);

    const inRoom = (cell: Cell): boolean => roomSet.has(cell);
    const topEmpty = (cell: Cell): boolean => at(T, cell) === ".";
    // Blocking objects never land on a person's cell; occupiable ones (seats) may.
    const canBlock = (cell: Cell): boolean =>
      inRoom(cell) && topEmpty(cell) && !peopleCells.has(cell);
    const canOcc = (cell: Cell): boolean => inRoom(cell) && topEmpty(cell);
    const predFor = (type: string): ((cell: Cell) => boolean) =>
      IS_OCCUPIABLE[type] ? canOcc : canBlock;
    const placed = new Map<string, number>();
    const place = (type: string, cell: Cell): void => {
      put(T, cell, CHAR_OF[type]);
      placed.set(type, (placed.get(type) ?? 0) + 1);
    };
    // Walls hit: how many orthogonal sides leave the room (board edge or other room).
    const wallScore = (cell: Cell): number => 4 - neighbors4(cell).filter(inRoom).length;
    const adjType = (cell: Cell, type: string): number =>
      neighbors4(cell).filter((nb) => at(T, nb) === CHAR_OF[type]).length;
    // How built-up the area around a cell already is (8-neighbourhood within `rad`). Used to
    // SPREAD furniture across the whole room instead of piling it all in one corner.
    const crowd = (cell: Cell, rad = 1): number => {
      const r0 = Math.floor(cell / width);
      const c0 = cell % width;
      let n = 0;
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = r0 + dr;
          const c = c0 + dc;
          if (r < 0 || r >= height || c < 0 || c >= width) continue;
          const nb = r * width + c;
          if (inRoom(nb) && !topEmpty(nb)) n++;
        }
      }
      return n;
    };

    const pickBest = (cands: Cell[], score: (c: Cell) => number): Cell | null => {
      if (!cands.length) return null;
      let best = -Infinity;
      let bucket: Cell[] = [];
      for (const c of cands) {
        const s = score(c);
        if (s > best) {
          best = s;
          bucket = [c];
        } else if (s === best) bucket.push(c);
      }
      return rng.pick(bucket);
    };
    const count = ([min, max]: [number, number]): number =>
      max <= min ? min : min + rng.int(max - min + 1);

    /** A line of `n` items along a wall (shelves, lockers, fridges, seat rows). */
    const placeRack = (type: string, n: number): number => {
      if (n <= 0 || !allow.has(type)) return 0;
      const pred = predFor(type);
      const runs: Cell[][] = [];
      const collect = (line: Cell[]): void => {
        let run: Cell[] = [];
        for (const cell of line) {
          if (pred(cell)) run.push(cell);
          else {
            if (run.length) runs.push(run);
            run = [];
          }
        }
        if (run.length) runs.push(run);
      };
      const rows = [...new Set(cells.map((c) => Math.floor(c / width)))];
      const cols = [...new Set(cells.map((c) => c % width))];
      for (const r of rows) collect(cols.map((c) => r * width + c).sort((a, b) => a - b));
      for (const c of cols) collect(rows.map((r) => r * width + c).sort((a, b) => a - b));
      if (!runs.length) return 0;
      // Prefer a wall-hugging run in the LEAST built-up area, long enough for n — so
      // successive racks spread onto different (still-empty) walls instead of one pile.
      const runScore = (run: Cell[]): number => {
        const wall = run.some((c) => wallScore(c) > 0) ? 1000 : 0;
        const avgCrowd = run.reduce((s, c) => s + crowd(c, 1), 0) / run.length;
        return wall - avgCrowd * 12 + Math.min(run.length, n) * 8 - run.length;
      };
      let best = runs[0];
      for (const run of runs) if (runScore(run) > runScore(best)) best = run;
      if (wallScore(best[best.length - 1]) > wallScore(best[0])) best = [...best].reverse();
      let placed = 0;
      for (let i = 0; i < Math.min(n, best.length); i++)
        if (pred(best[i])) {
          place(type, best[i]);
          placed++;
        }
      return placed;
    };

    /** `n` two-cell objects (bed/car) sharing one orientation. */
    const placePair = (type: string, n: number): number => {
      if (n <= 0 || !allow.has(type)) return 0;
      const [dr, dc] = rng.chance(0.5) ? [0, 1] : [1, 0];
      const delta = dr * width + dc;
      let placed = 0;
      for (const cell of rng.shuffle([...cells])) {
        if (placed >= n) break;
        const r = Math.floor(cell / width);
        const c = cell % width;
        if (dc === 1 && c === width - 1) continue;
        if (dr === 1 && r === height - 1) continue;
        const mate = cell + delta;
        if (!canOcc(cell) || !canOcc(mate) || !inRoom(mate)) continue;
        if (type === "car" && !(isOutdoor(cell) && isOutdoor(mate))) continue;
        place(type, cell);
        place(type, mate);
        placed += 2;
      }
      return placed;
    };

    /** One item, preferring a corner/wall in a still-empty area (toilet, fridge, lamp, statue). */
    const placeSingle = (type: string): number => {
      if (!allow.has(type)) return 0;
      const cell = pickBest(
        cells.filter(predFor(type)),
        (c) => wallScore(c) * 4 - crowd(c, 1) * 2 + rng.next(),
      );
      if (cell === null) return 0;
      place(type, cell);
      return 1;
    };

    /** `n` of a kind grouped together (animals, plants, statues), seeded in an empty area. */
    const placeCluster = (type: string, n: number): number => {
      if (n <= 0 || !allow.has(type)) return 0;
      const pred = predFor(type);
      const seed = pickBest(cells.filter(pred), (c) => -crowd(c, 2) * 4 + rng.next());
      if (seed === null) return 0;
      const queue: Cell[] = [seed];
      const seen = new Set<Cell>([seed]);
      let placed = 0;
      while (queue.length && placed < n) {
        const cell = queue.shift()!;
        if (pred(cell)) {
          place(type, cell);
          placed++;
        }
        for (const nb of rng.shuffle(neighbors4(cell)))
          if (!seen.has(nb) && inRoom(nb)) {
            seen.add(nb);
            queue.push(nb);
          }
      }
      return placed;
    };

    /** One item. PILE types heap next to their own kind (boxes/crates); everything else is
     *  SPREAD — pushed away from same-type neighbours and toward walls, so decorative items
     *  (lamps, plants, statues) never line up three in a row. */
    const placeItem = (type: string): number => {
      if (!allow.has(type)) return 0;
      const pred = predFor(type);
      const pile = PILE_TYPES.has(type);
      // Pile types form a SMALL heap (sit next to exactly one of their kind) but the heaps
      // still spread out; everything else avoids both same-type neighbours and crowded areas.
      const score = (c: Cell): number =>
        (pile
          ? (adjType(c, type) === 1 ? 6 : 0) - crowd(c, 2) * 2
          : wallScore(c) * 4 - adjType(c, type) * 5 - crowd(c, 1) * 2) + rng.next();
      const cell = pickBest(cells.filter(pred), score);
      if (cell === null) return 0;
      place(type, cell);
      return 1;
    };

    /** A table/desk ISLAND — `size` adjacent surface cells (which auto-merge into one big
     *  table) ringed by up to `chairMax` chairs. The dining/office/banquet workhorse. */
    const placeSet = (type: string, sizeRange: [number, number], chairMax: number): number => {
      if (!allow.has(type)) return 0;
      // Tables sit toward the OPEN interior (away from walls) and away from other tables,
      // so the room reads as "furniture round the walls, tables in the middle".
      const anchor = pickBest(
        cells.filter((c) => canBlock(c) && neighbors4(c).some(canOcc)),
        (c) => -crowd(c, 2) * 3 - wallScore(c) * 2 + rng.next(),
      );
      if (anchor === null) return 0;
      const size = count(sizeRange);
      const island: Cell[] = [anchor];
      place(type, anchor);
      // Grow a connected blob of table cells.
      while (island.length < size) {
        const ext = island
          .flatMap((t) => neighbors4(t))
          .filter((nb) => canBlock(nb) && !island.includes(nb));
        if (!ext.length) break;
        const nx = rng.pick(ext);
        place(type, nx);
        island.push(nx);
      }
      let placed = island.length;
      // Ring the whole island with chairs.
      if (allow.has("chair") && chairMax > 0) {
        const perim = new Set<Cell>();
        for (const t of island)
          for (const nb of neighbors4(t)) if (canOcc(nb) && !island.includes(nb)) perim.add(nb);
        let chairs = 0;
        for (const cell of rng.shuffle([...perim])) {
          if (chairs >= chairMax) break;
          if (canOcc(cell) && rng.chance(0.85)) {
            place("chair", cell);
            chairs++;
            placed++;
          }
        }
      }
      return placed;
    };

    // 1) Defining features.
    for (const feat of recipe.features) {
      const n = count(feat.count);
      switch (feat.style) {
        case "rack":
          placeRack(feat.type, n);
          break;
        case "pair":
          placePair(feat.type, n);
          break;
        case "single":
          for (let i = 0; i < n; i++) placeSingle(feat.type);
          break;
        case "cluster":
          placeCluster(feat.type, n);
          break;
      }
    }

    // 2) Pack the room with fill blocks up to the target fill ratio.
    const pickFill = (): FillBlock | null => {
      const avail = recipe.fill.filter(
        (b) =>
          allow.has(b.type) &&
          !(b.kind === "item" && (placed.get(b.type) ?? 0) >= (ITEM_CAP[b.type] ?? Infinity)),
      );
      if (!avail.length) return null;
      let x = rng.next() * avail.reduce((s, b) => s + b.w, 0);
      for (const b of avail) {
        x -= b.w;
        if (x <= 0) return b;
      }
      return avail[avail.length - 1];
    };
    const placeFill = (b: FillBlock): number => {
      switch (b.kind) {
        case "set":
          return placeSet(b.type, b.size, b.chairMax);
        case "rack":
          return placeRack(b.type, count(b.len));
        case "cluster":
          return placeCluster(b.type, count(b.n));
        case "item":
          return placeItem(b.type);
      }
    };
    let top = cells.filter((c) => !topEmpty(c)).length;
    const target = Math.round(recipe.targetFill * cells.length);
    let fails = 0;
    while (top < target && fails < 25) {
      const block = pickFill();
      if (!block) break;
      const placed = placeFill(block);
      if (placed > 0) {
        top += placed;
        fails = 0;
      } else fails++;
    }

    // 3) Carpet rug underneath (ground layer) — a connected patch, under people and
    //    OCCUPIABLE furniture (seats), but NEVER under a non-occupiable object: its
    //    "blocked" card would hide the rug. (The BFS still spreads past such cells, so
    //    the rug simply has a hole there.)
    if (recipe.carpet > 0 && allow.has("carpet")) {
      const target2 = Math.round(recipe.carpet * cells.length);
      const seed = rng.pick(cells);
      const queue: Cell[] = [seed];
      const seen = new Set<Cell>([seed]);
      let laid = 0;
      while (queue.length && laid < target2) {
        const cell = queue.shift()!;
        const topCh = at(T, cell);
        const carpetOk = topCh === "." || OCC_OF_CHAR[topCh] === true;
        if (at(G, cell) === "." && carpetOk) {
          put(G, cell, CHAR_OF.carpet);
          laid++;
        }
        for (const nb of rng.shuffle(neighbors4(cell)))
          if (!seen.has(nb) && inRoom(nb)) {
            seen.add(nb);
            queue.push(nb);
          }
      }
    }
  }
}
