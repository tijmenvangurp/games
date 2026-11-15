import {
  MULTI_CELL_TYPES,
  VICTIM_ID,
  VOID_ROOM,
  isWaterRoom,
  type Cell,
  type PersonId,
  type Puzzle,
  type Side,
} from "@entities/murdoku";
import {
  BOARD,
  CANDIDATE_BLUE,
  HIGHLIGHT_DIM,
  REF_RED,
  ROOM_HL,
  suspectColor,
} from "../palette.ts";
import { drawFloorTile, floorPatternOf } from "./floorArt.ts";
import { OBJECT_GLYPHS } from "./glyphs.ts";
import type { HelpMarks } from "./helpMarks.ts";
import { drawBigObject, drawSingleObject } from "./bigObjects.ts";
import {
  drawArmchair,
  drawArmor,
  drawBarrel,
  drawBear,
  drawBookshelf,
  drawCampfire,
  drawCandelabrum,
  drawCarpetBase,
  drawCarpetTile,
  drawCashRegister,
  drawCrate,
  drawDeckchair,
  drawDivingBoard,
  drawFireplace,
  drawFloorLamp,
  drawFridge,
  drawGrill,
  drawHammock,
  drawHaystack,
  drawHottub,
  drawLocker,
  drawMud,
  drawOil,
  drawParasol,
  drawPathTile,
  drawPiano,
  drawPunchbag,
  drawShower,
  drawSlide,
  drawStreetTile,
  drawTableTile,
  drawTent,
  drawThrone,
  drawWashingMachine,
  drawWaterlily,
  drawWaterTile,
  drawWeaponRack,
  onArtReady,
  type Conn,
} from "./objectArt.ts";

export interface RevealInfo {
  victimCell: Cell;
  murdererId: PersonId | null;
}

export interface BoardView {
  puzzle: Puzzle;
  /** Cell size in CSS pixels. */
  cell: number;
  /** Top-left of the grid in CSS pixels (within the already dpr-scaled ctx). */
  origin: { x: number; y: number };
  /** Resolve a room nameKey to a localized label. */
  roomName: (nameKey: string) => string;
  /** suspect id → index (for stable colours and the badge letter). */
  suspectIndex: Map<PersonId, number>;
  placements: Map<PersonId, Cell>;
  marks: Map<Cell, Set<PersonId>>;
  crosses: Set<Cell>;
  highlight: Set<Cell> | null;
  reveal: RevealInfo | null;
  /** Committed-suspect head avatars, keyed by id (drawn when loaded). */
  avatars?: Map<PersonId, HTMLImageElement>;
  /** Cell under the cursor/finger → outlined yellow (occupiable) or red (blocked). */
  hover?: Cell | null;
  /** Suspect whose pencil notes are SKIPPED here — the overlay canvas draws them
   *  pulsing (see drawBoardOverlay), so the base never repaints during the pulse. */
  emphasizeMarks?: PersonId | null;
  /** Override the candidate-highlight colours (default brass; tutorial uses blue). */
  highlightColor?: { wash: string; ring: string };
  /** A SECOND highlight layer, drawn under the primary one — used to show the selected
   *  suspect's candidate cells (blue) at the same time as an active hint (black). */
  highlight2?: Set<Cell> | null;
  highlightColor2?: { wash: string; ring: string };
  /** Opacity (0..1) of each candidate-highlight layer. Defaults to 1; a selected suspect
   *  who is ALREADY placed dims to HIGHLIGHT_DIM so their now-moot candidates recede. */
  highlightAlpha?: number;
  highlightAlpha2?: number;
  /** Reduced-help reference marks (object rings, room outlines, window/door glow). */
  helpMarks?: HelpMarks | null;
  /** Draw the corner badges revealing what a placed figure stands/sits on (a setting). */
  objectBadges?: boolean;
  /** Draw the subtle per-room floor patterns (a taste setting; default on). */
  floorTextures?: boolean;
  /** Thumbnail mode: rooms + walls + object dots only. */
  preview?: boolean;
}

/**
 * For each room, the widest contiguous column run on its BOTTOM-most row — the
 * name plate sits there and is sized to that run's width.
 */
function roomBottomRuns(puzzle: Puzzle): Map<string, { row: number; c0: number; c1: number }> {
  const board = puzzle.board;
  const W = board.width;
  const bottomRow = new Map<string, number>();
  for (let cell = 0; cell < W * board.height; cell++) {
    const id = board.roomIdOf(cell);
    if (id === VOID_ROOM) continue; // void has no name plate
    const { row } = board.rc(cell);
    bottomRow.set(id, Math.max(bottomRow.get(id) ?? 0, row));
  }
  const runs = new Map<string, { row: number; c0: number; c1: number }>();
  for (const [id, br] of bottomRow) {
    let best = { c0: 0, c1: -1 };
    let start = -1;
    const close = (end: number): void => {
      if (start >= 0 && end - start > best.c1 - best.c0) best = { c0: start, c1: end };
    };
    for (let col = 0; col < W; col++) {
      if (board.roomIdOf(board.idx(br, col)) === id) {
        if (start < 0) start = col;
      } else {
        close(col - 1);
        start = -1;
      }
    }
    close(W - 1);
    runs.set(id, { row: br, c0: best.c0, c1: best.c1 });
  }
  return runs;
}

/** The soft white "blocked" card drawn behind non-occupiable objects. */
function drawBlockedCard(ctx: CanvasRenderingContext2D, x: number, y: number, S: number): void {
  const pad = S * 0.08;
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.strokeStyle = "rgba(40, 32, 48, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + pad, y + pad, S - 2 * pad, S - 2 * pad, S * 0.16);
  ctx.fill();
  ctx.stroke();
}

type BoardModel = Puzzle["board"];

/** Same-room neighbours (incl. diagonals) carrying the same object type, for
 *  auto-tiling — the diagonals let a tile round its inner (concave) L-corners. */
function objectConn(board: BoardModel, c: Cell, layer: "top" | "ground", type: string): Conn {
  const { row, col } = board.rc(c);
  const room = board.roomIdOf(c);
  const same = (r: number, cc: number): boolean => {
    if (!board.inBounds(r, cc)) return false;
    const i = board.idx(r, cc);
    if (board.roomIdOf(i) !== room) return false;
    const obj = layer === "top" ? board.tileAt(i).top : board.tileAt(i).ground;
    return obj?.type === type;
  };
  return {
    n: same(row - 1, col),
    s: same(row + 1, col),
    w: same(row, col - 1),
    e: same(row, col + 1),
    ne: same(row - 1, col + 1),
    nw: same(row - 1, col - 1),
    se: same(row + 1, col + 1),
    sw: same(row + 1, col - 1),
  };
}

/** Same-ROOM neighbours (incl. diagonals) — auto-tiles a whole room into one merged
 *  surface (used for the lake water, so the room reads as one body of water). */
function roomConn(board: BoardModel, c: Cell): Conn {
  const { row, col } = board.rc(c);
  const room = board.roomIdOf(c);
  const same = (r: number, cc: number): boolean =>
    board.inBounds(r, cc) && board.roomIdOf(board.idx(r, cc)) === room;
  return {
    n: same(row - 1, col),
    s: same(row + 1, col),
    w: same(row, col - 1),
    e: same(row, col + 1),
    ne: same(row - 1, col + 1),
    nw: same(row - 1, col - 1),
    se: same(row + 1, col + 1),
    sw: same(row + 1, col - 1),
  };
}

// ─── Static floor layer (cached) ─────────────────────────────────────────────
// Mortar, void punch-outs, room fills, water and the floor patterns are a pure
// function of the board + tile size. Re-drawing hundreds of pattern paths on
// EVERY frame (drags, hovers, highlights, the press animation) is what made the
// board feel sluggish — so the whole base is rendered ONCE into an offscreen
// image and every redraw just blits it (one drawImage call).

/** Everything the floor layer's pixels depend on — the cache key. */
function floorSig(view: BoardView, dpr: number): string {
  const board = view.puzzle.board;
  const parts: string[] = [
    `${board.width}x${board.height}`,
    String(view.cell),
    String(dpr),
    view.floorTextures === false ? "plain" : "tex",
    view.preview ? "prev" : "full",
  ];
  for (const [id, room] of board.rooms) parts.push(`${id}:${room.color}:${room.nameKey}`);
  let cells = "";
  for (let c = 0; c < board.width * board.height; c++) {
    cells += board.roomIdOf(c);
    // Carpet blanks the pattern under the rug, so it shapes the layer's pixels.
    if (board.tileAt(c).ground?.type === "carpet") cells += "*";
  }
  parts.push(cells);
  return parts.join("|");
}

/** Render the floor layer at device resolution; (1,1) inside maps to the grid's
 *  top-left, leaving 1px of mortar border on every side (as drawBoard draws it). */
function renderFloorLayer(view: BoardView, dpr: number): HTMLCanvasElement {
  const { puzzle, cell: S } = view;
  const board = puzzle.board;
  const W = board.width;
  const H = board.height;
  const w = W * S + 2;
  const h = H * S + 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = BOARD.mortar;
  ctx.fillRect(0, 0, w, h);
  for (let c = 0; c < W * H; c++) {
    const { row, col } = board.rc(c);
    const x = 1 + col * S;
    const y = 1 + row * S;
    if (board.isVoid(c)) {
      // Empty exterior: punch a transparent hole so the page/board background
      // shows through. Expand 1px only at the board edge to clear the border there.
      const x0 = col === 0 ? x - 1 : x;
      const y0 = row === 0 ? y - 1 : y;
      const x1 = col === W - 1 ? x + S + 1 : x + S;
      const y1 = row === H - 1 ? y + S + 1 : y + S;
      ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
      continue;
    }
    const room = board.rooms.get(board.roomIdOf(c));
    // Water rooms: a grass-green bank as the base, with the lake surface inset on
    // top (rounded, merged across the room).
    const water = room ? isWaterRoom(room.nameKey) : false;
    ctx.fillStyle = water ? BOARD.grass : (room?.color ?? "#cfcfcf");
    ctx.fillRect(x, y, S, S);
    if (water) drawWaterTile(ctx, x, y, S, roomConn(board, c));
    else if (!view.preview && view.floorTextures !== false && room) {
      // Subtle per-room-type floor texture (kitchen checker, floorboards, grass, …).
      const pattern = floorPatternOf(room.nameKey);
      if (pattern) {
        drawFloorTile(ctx, x, y, S, row, col, pattern);
        // A rug is translucent so the room colour tints it — but the floor pattern
        // must not shine through fabric: blank it in the rug's exact shape.
        if (board.tileAt(c).ground?.type === "carpet")
          drawCarpetBase(ctx, x, y, S, objectConn(board, c, "ground", "carpet"), room.color);
      }
    }
  }
  return canvas;
}

/** Content-keyed LRU of pre-rendered canvases: return the cached entry (refreshing
 *  its position) or render it via `make` and evict the oldest beyond `max`. */
function lruGet(
  cache: Map<string, HTMLCanvasElement>,
  key: string,
  max: number,
  make: () => HTMLCanvasElement,
): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key); // re-insert → most recently used
    cache.set(key, hit);
    return hit;
  }
  const canvas = make();
  cache.set(key, canvas);
  if (cache.size > max) cache.delete(cache.keys().next().value!);
  return canvas;
}

/** Small LRUs keyed by content: the game holds 1 entry per level; editor drags that
 *  don't touch the respective layer hit the cache too. Previews bypass them. */
const floorCache = new Map<string, HTMLCanvasElement>();
const furnitureCache = new Map<string, HTMLCanvasElement>();

function cachedFloorLayer(view: BoardView, dpr: number): HTMLCanvasElement {
  return lruGet(floorCache, floorSig(view, dpr), 4, () => renderFloorLayer(view, dpr));
}

/** Tiny reusable sprites (victim disk, object badges, pencil-mark letters): these use
 *  shadowBlur / double text strokes — expensive to redo every frame, cheap to blit. */
const spriteCache = new Map<string, HTMLCanvasElement>();

function sprite(
  key: string,
  w: number,
  h: number,
  dpr: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  return lruGet(spriteCache, key, 128, () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(w * dpr));
    canvas.height = Math.max(1, Math.ceil(h * dpr));
    const c = canvas.getContext("2d")!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(c);
    return canvas;
  });
}

// Cached pixels can bake in a not-yet-loaded state: object art (armchair image) and
// the webfont (mark letters) arrive async — drop the caches once, so the next draw
// re-renders them complete. Callers already redraw on those very events.
onArtReady(() => {
  floorCache.clear();
  furnitureCache.clear();
  spriteCache.clear();
});
if (typeof document !== "undefined" && "fonts" in document) {
  document.fonts.ready.then(() => spriteCache.clear()).catch(() => {});
}

// ─── Static furniture layer (cached) ─────────────────────────────────────────
// Street, rugs, grid lines, walls, windows, doors and every object are just as
// static as the floor beneath them — only the highlight WASH must stay between
// the two (it tints the floor but never the furniture), hence two layers.

/** Everything the furniture layer's pixels depend on — the cache key. */
function furnitureSig(view: BoardView, dpr: number): string {
  const board = view.puzzle.board;
  const parts: string[] = [
    `${board.width}x${board.height}`,
    String(view.cell),
    String(dpr),
    view.preview ? "prev" : "full",
  ];
  // Room nameKeys matter too: the slide's water/playground look reads them.
  for (const [id, room] of board.rooms) parts.push(`${id}:${room.nameKey}`);
  let cells = "";
  for (let c = 0; c < board.width * board.height; c++) {
    const tile = board.tileAt(c);
    cells += `${board.roomIdOf(c)},${tile.ground?.type ?? ""},${tile.top?.type ?? ""},${board.windowSides(c).join("")}${board.doorSides(c).join("")};`;
  }
  parts.push(cells);
  return parts.join("|");
}

/** Margin around the grid the furniture layer must include: the outer wall stroke
 *  (round caps) and object shadows overshoot the board edge by a few pixels. */
function furniturePad(S: number): number {
  return Math.ceil(S * 0.08) + 2;
}

/** Paint street/rugs, grid, walls, windows/doors and all objects at (ox, oy) —
 *  the exact passes drawBoard used to run inline, in the exact same order. */
function paintFurniture(
  ctx: CanvasRenderingContext2D,
  view: BoardView,
  ox: number,
  oy: number,
): void {
  const { puzzle, cell: S, preview } = view;
  const board = puzzle.board;
  const W = board.width;
  const H = board.height;
  const xy = (c: Cell) => {
    const { row, col } = board.rc(c);
    return { x: ox + col * S, y: oy + row * S };
  };
  const connOf = (c: Cell, layer: "top" | "ground", type: string): Conn =>
    objectConn(board, c, layer, type);

  // --- street (occupiable ground layer) — auto-tiled into one continuous road --
  for (let c = 0; c < W * H; c++) {
    if (board.tileAt(c).ground?.type !== "street") continue;
    const { x, y } = xy(c);
    drawStreetTile(ctx, x, y, S, connOf(c, "ground", "street"));
  }

  // --- path (occupiable ground layer) — auto-tiled into one continuous trail --
  for (let c = 0; c < W * H; c++) {
    if (board.tileAt(c).ground?.type !== "path") continue;
    const { x, y } = xy(c);
    drawPathTile(ctx, x, y, S, connOf(c, "ground", "path"));
  }

  // --- carpet rug (occupiable ground layer) — auto-tiled into one surface --
  for (let c = 0; c < W * H; c++) {
    if (board.tileAt(c).ground?.type !== "carpet") continue;
    const { x, y } = xy(c);
    drawCarpetTile(ctx, x, y, S, connOf(c, "ground", "carpet"));
  }

  // --- thin in-room grid lines, then thick walls -------------------------
  const thin = Math.max(1, S * 0.02);
  const thick = Math.max(2.5, S * 0.07);

  ctx.strokeStyle = BOARD.grid;
  ctx.lineWidth = thin;
  ctx.beginPath();
  for (let r = 0; r < H; r++) {
    for (let col = 0; col < W; col++) {
      const id = board.roomIdOf(board.idx(r, col));
      if (id === VOID_ROOM) continue; // no interior grid in the empty exterior
      if (col + 1 < W && board.roomIdOf(board.idx(r, col + 1)) === id) {
        const x = Math.round(ox + (col + 1) * S) + 0.5;
        ctx.moveTo(x, oy + r * S);
        ctx.lineTo(x, oy + (r + 1) * S);
      }
      if (r + 1 < H && board.roomIdOf(board.idx(r + 1, col)) === id) {
        const y = Math.round(oy + (r + 1) * S) + 0.5;
        ctx.moveTo(ox + col * S, y);
        ctx.lineTo(ox + (col + 1) * S, y);
      }
    }
  }
  ctx.stroke();

  ctx.strokeStyle = BOARD.wall;
  ctx.lineWidth = thick;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let r = 0; r < H; r++) {
    for (let col = 0; col < W; col++) {
      const id = board.roomIdOf(board.idx(r, col));
      if (col + 1 < W && board.roomIdOf(board.idx(r, col + 1)) !== id) {
        const x = ox + (col + 1) * S;
        ctx.moveTo(x, oy + r * S);
        ctx.lineTo(x, oy + (r + 1) * S);
      }
      if (r + 1 < H && board.roomIdOf(board.idx(r + 1, col)) !== id) {
        const y = oy + (r + 1) * S;
        ctx.moveTo(ox + col * S, y);
        ctx.lineTo(ox + (col + 1) * S, y);
      }
    }
  }
  ctx.stroke();
  // Outer wall: only along the board edge where the boundary cell IS a room, so
  // empty exterior cells don't get enclosed (the building floats on the board).
  ctx.strokeStyle = BOARD.outer;
  ctx.lineWidth = thick * 1.1;
  ctx.beginPath();
  for (let col = 0; col < W; col++) {
    if (!board.isVoid(board.idx(0, col))) {
      ctx.moveTo(ox + col * S, oy);
      ctx.lineTo(ox + (col + 1) * S, oy);
    }
    if (!board.isVoid(board.idx(H - 1, col))) {
      ctx.moveTo(ox + col * S, oy + H * S);
      ctx.lineTo(ox + (col + 1) * S, oy + H * S);
    }
  }
  for (let r = 0; r < H; r++) {
    if (!board.isVoid(board.idx(r, 0))) {
      ctx.moveTo(ox, oy + r * S);
      ctx.lineTo(ox, oy + (r + 1) * S);
    }
    if (!board.isVoid(board.idx(r, W - 1))) {
      ctx.moveTo(ox + W * S, oy + r * S);
      ctx.lineTo(ox + W * S, oy + (r + 1) * S);
    }
  }
  ctx.stroke();

  // --- windows (drawn on the wall they sit on) ---------------------------
  for (let c = 0; c < W * H; c++) {
    const sides = board.windowSides(c);
    if (sides.length === 0) continue;
    const { x, y } = xy(c);
    for (const side of sides) drawWindow(ctx, x, y, S, side);
  }

  // --- doors (brown, two-sided; each shared edge is drawn from both cells) --
  for (let c = 0; c < W * H; c++) {
    const sides = board.doorSides(c);
    if (sides.length === 0) continue;
    const { x, y } = xy(c);
    for (const side of sides) drawDoor(ctx, x, y, S, side);
  }

  // Big objects (bed/car) span 2 tiles. The footprint pairing lives on the board
  // (one source of truth shared with the "beside an object" clue logic): draw the
  // pair once at its primary (top-left) cell, skip the secondary half, and render
  // unpaired cells as a single 1-tile object.
  const bigPartners = board.bigObjectPartners();
  const drawBig = (type: string, c: Cell): void => {
    const { x, y } = xy(c);
    const mate = bigPartners.get(c) ?? null;
    if (mate === null) {
      drawSingleObject(ctx, type, x, y, S); // isolated / cross-room → single 1-tile
    } else if (mate > c) {
      drawBigObject(ctx, type, x, y, S, mate === c + W); // partner below ⇒ vertical, else right
    }
    // mate < c ⇒ secondary half; the primary cell already drew the whole pair.
  };

  // --- merged table surface (auto-tiles with adjacent same-room tables) ---
  for (let c = 0; c < W * H; c++) {
    if (board.tileAt(c).top?.type !== "table") continue;
    const { x, y } = xy(c);
    drawTableTile(ctx, x, y, S, connOf(c, "top", "table"));
  }

  // The side of a cell that carries a wall (board edge or another room) — the diving
  // board mounts its base there and springs the opposite way (east wall → jump west).
  // No wall on any orthogonal side → default 'S' (the free-standing look).
  const wallBaseSide = (c: Cell): "N" | "S" | "W" | "E" => {
    const { row, col } = board.rc(c);
    const room = board.roomIdOf(c);
    const wall = (r: number, cc: number): boolean =>
      !board.inBounds(r, cc) || board.roomIdOf(board.idx(r, cc)) !== room;
    if (wall(row + 1, col)) return "S";
    if (wall(row, col + 1)) return "E";
    if (wall(row, col - 1)) return "W";
    if (wall(row - 1, col)) return "N";
    return "S";
  };

  // ONE slide type, two looks (side view, straight chute): reaching REACHABLE water
  // it becomes the WATER slide — mirrored so the run-out faces a pool to the west —
  // otherwise the red-and-yellow playground slide. "Reachable" means no wall between
  // slide and water: the same room, or a DOOR on exactly that edge (nobody slides
  // into a wall).
  const slideLook = (c: Cell): { water: boolean; exitLeft: boolean } => {
    const { row, col } = board.rc(c);
    const ownRoomId = board.roomIdOf(c);
    const doorSides = board.doorSides(c);
    const waterThrough = (r: number, cc: number, side: Side): boolean => {
      if (!board.inBounds(r, cc)) return false;
      const nb = board.idx(r, cc);
      const room = board.rooms.get(board.roomIdOf(nb));
      if (!room || !isWaterRoom(room.nameKey)) return false;
      return board.roomIdOf(nb) === ownRoomId || doorSides.includes(side);
    };
    if (waterThrough(row, col + 1, "E")) return { water: true, exitLeft: false }; // pool to the east
    if (waterThrough(row, col - 1, "W")) return { water: true, exitLeft: true }; // pool to the west
    const own = board.rooms.get(ownRoomId);
    const nearWater =
      waterThrough(row + 1, col, "S") ||
      waterThrough(row - 1, col, "N") ||
      (own ? isWaterRoom(own.nameKey) : false);
    return { water: nearWater, exitLeft: false };
  };

  // --- per-cell objects: bed/car span two tiles; every other object is one
  //     isolated tile drawn by the shared drawObjectIcon (the legend uses the
  //     very same function, so its icons match the board exactly).
  for (let c = 0; c < W * H; c++) {
    const top = board.tileAt(c).top;
    if (!top || top.type === "table") continue; // table drawn in the merged pass
    const { x, y } = xy(c);
    if (MULTI_CELL_TYPES.has(top.type)) {
      drawBig(top.type, c);
      continue;
    }
    if (top.type === "divingboard") {
      drawDivingBoard(ctx, x, y, S, wallBaseSide(c));
      continue;
    }
    if (top.type === "slide") {
      const look = slideLook(c);
      drawSlide(ctx, x, y, S, look.water, look.exitLeft);
      continue;
    }
    drawObjectIcon(ctx, top.type, x, y, S, top.occupiable, preview);
  }
}

/** Render the furniture layer at device resolution, `furniturePad` around the grid. */
function renderFurnitureLayer(view: BoardView, dpr: number): HTMLCanvasElement {
  const board = view.puzzle.board;
  const S = view.cell;
  const pad = furniturePad(S);
  const w = board.width * S + 2 * pad;
  const h = board.height * S + 2 * pad;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paintFurniture(ctx, view, pad, pad);
  return canvas;
}

function cachedFurnitureLayer(view: BoardView, dpr: number): HTMLCanvasElement {
  return lruGet(furnitureCache, furnitureSig(view, dpr), 4, () => renderFurnitureLayer(view, dpr));
}

export function drawBoard(ctx: CanvasRenderingContext2D, view: BoardView): void {
  const { puzzle, cell: S, origin, preview } = view;
  const board = puzzle.board;
  const W = board.width;
  const H = board.height;
  const ox = origin.x;
  const oy = origin.y;

  const xy = (c: Cell) => {
    const { row, col } = board.rc(c);
    return { x: ox + col * S, y: oy + row * S };
  };

  // --- static floor layer (cached image) + highlight washes ---------------
  // Mortar, void punch-outs, room fills, water and floor patterns come from ONE
  // pre-rendered image (see renderFloorLayer) — a single drawImage per frame.
  const dpr = ctx.getTransform().a || 1;
  const layer = preview ? renderFloorLayer(view, dpr) : cachedFloorLayer(view, dpr);
  ctx.drawImage(layer, ox - 1, oy - 1, W * S + 2, H * S + 2);

  // Cells already taken by a placed figure — a candidate there is no longer possible, so
  // (like a crossed-off cell) its highlight is faded below. Built once, reused throughout.
  const occupied = new Set(view.placements.values());

  for (let c = 0; c < W * H; c++) {
    if (board.isVoid(c)) continue;
    const { x, y } = xy(c);
    // Secondary layer (selection) under the primary (hint), so the hint wins on overlap.
    // A ruled-out candidate — crossed off OR already taken by another figure — fades its
    // wash by HIGHLIGHT_DIM (same as its ring). Capped, never stacked: a placed suspect's
    // whole layer is already dimmed, so take the STRONGER dim of the two, not dim².
    const cellDim = view.crosses.has(c) || occupied.has(c) ? HIGHLIGHT_DIM : 1;
    if (view.highlight2?.has(c)) {
      ctx.globalAlpha = Math.min(view.highlightAlpha2 ?? 1, cellDim);
      ctx.fillStyle = view.highlightColor2?.wash ?? BOARD.highlight;
      ctx.fillRect(x, y, S, S);
      ctx.globalAlpha = 1;
    }
    if (view.highlight?.has(c)) {
      ctx.globalAlpha = Math.min(view.highlightAlpha ?? 1, cellDim);
      ctx.fillStyle = view.highlightColor?.wash ?? BOARD.highlight;
      ctx.fillRect(x, y, S, S);
      ctx.globalAlpha = 1;
    }
    // Reduced-help area marks are drawn as quiet outlines later — no wash here.
  }

  // --- static furniture layer (cached image): street, rugs, grid, walls,
  //     windows/doors and every object in one blit — drawn AFTER the washes so
  //     the furniture never gets tinted (exactly the old inline order). --------
  const fPad = furniturePad(S);
  const furniture = preview ? renderFurnitureLayer(view, dpr) : cachedFurnitureLayer(view, dpr);
  ctx.drawImage(furniture, ox - fPad, oy - fPad, W * S + 2 * fPad, H * S + 2 * fPad);

  if (preview) return;

  // --- highlight rings on candidate cells (secondary under primary) ------
  // `outline` adds a THIN white line hugging the INSIDE of the coloured ring so the
  // candidate rectangles stay legible on dark surfaces (e.g. the lake water). On a
  // candidate cell that's ruled out — crossed off OR already taken by another figure — the
  // WHOLE marking (blue ring + white) dims by HIGHLIGHT_DIM so the live candidates pop.
  const ringW = Math.max(2, S * 0.05);
  const drawRings = (cells: Set<Cell>, color: string, pad: number, outline = false, alpha = 1) => {
    for (const c of cells) {
      const { x, y } = xy(c);
      // outline = candidate highlight → ruled-out cells fade by HIGHLIGHT_DIM (ring + white).
      // Capped, not stacked: take the stronger of the layer dim and the per-cell dim.
      const ruledOut = outline && (view.crosses.has(c) || occupied.has(c));
      ctx.globalAlpha = Math.min(alpha, ruledOut ? HIGHLIGHT_DIM : 1);
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, S - 2 * pad, S - 2 * pad, S * 0.12);
      ctx.strokeStyle = color;
      ctx.lineWidth = ringW;
      ctx.stroke();
      if (outline) {
        const wW = Math.max(1, S * 0.018);
        const ip = pad + ringW / 2 + wW / 2; // sit just inside the coloured ring
        ctx.beginPath();
        ctx.roundRect(x + ip, y + ip, S - 2 * ip, S - 2 * ip, S * 0.1);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = wW;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };
  // NOTE: the candidate-hint rings are drawn LATER (after the room hover outline) so the
  // blue rounded rectangles always sit ON TOP of the room enclosure outline — see below.

  // Trace the boundary of a cell region just inside its edges: for each cell in
  // `domain`, stroke the sides whose orthogonal neighbour is NOT `inside`. Shared
  // by room outlines (hover + in-room marks) and reduced-help area marks.
  const traceBoundary = (
    domain: Iterable<Cell>,
    inside: (r: number, c: number) => boolean,
    color: string,
    inset: number,
    width: number,
    dash: boolean,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.setLineDash(dash ? [S * 0.14, S * 0.1] : []);
    ctx.beginPath();
    for (const c of domain) {
      const { row, col } = board.rc(c);
      const { x, y } = xy(c);
      if (!inside(row - 1, col)) {
        ctx.moveTo(x + inset, y + inset);
        ctx.lineTo(x + S - inset, y + inset);
      }
      if (!inside(row + 1, col)) {
        ctx.moveTo(x + inset, y + S - inset);
        ctx.lineTo(x + S - inset, y + S - inset);
      }
      if (!inside(row, col - 1)) {
        ctx.moveTo(x + inset, y + inset);
        ctx.lineTo(x + inset, y + S - inset);
      }
      if (!inside(row, col + 1)) {
        ctx.moveTo(x + S - inset, y + inset);
        ctx.lineTo(x + S - inset, y + S - inset);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Trace a room's outline just inside its walls (hover + reduced-help marks).
  const traceRoom = (room: string, color: string, inset: number, width: number) => {
    const cells: Cell[] = [];
    for (let c = 0; c < W * H; c++) if (board.roomIdOf(c) === room) cells.push(c);
    traceBoundary(
      cells,
      (r, c) => board.inBounds(r, c) && board.roomIdOf(board.idx(r, c)) === room,
      color,
      inset,
      width,
      false,
    );
  };

  // Trace an arbitrary cell set (a clue's referenced row/col/wall/outside region)
  // as a dashed outline — the reduced-help "quiet" language.
  const traceCellSet = (cells: Set<Cell>, color: string, inset: number, width: number) =>
    traceBoundary(
      cells,
      (r, c) => board.inBounds(r, c) && cells.has(board.idx(r, c)),
      color,
      inset,
      width,
      true,
    );

  // --- reduced-help marks: per-clue references instead of candidate sets ---
  if (view.helpMarks) {
    const m = view.helpMarks;
    // Referenced objects get a dashed "chalk circle" — evidence, not a candidate.
    ctx.setLineDash([S * 0.14, S * 0.1]);
    drawRings(m.ring, CANDIDATE_BLUE.ring, S * 0.1);
    drawRings(m.redRing, REF_RED.ring, S * 0.1);
    ctx.setLineDash([]);
    // Area/line references (row/col, corner, wall, outside, same line): each
    // region traced as its OWN dashed outline — quiet, no wash. Negated → red.
    const areaWidth = Math.max(2, S * 0.05);
    for (const a of m.areas)
      traceCellSet(a.cells, a.neg ? REF_RED.ring : CANDIDATE_BLUE.ring, S * 0.08, areaWidth);
    const roomWidth = Math.max(2, S * 0.055);
    for (const room of m.rooms) traceRoom(room, CANDIDATE_BLUE.ring, S * 0.06, roomWidth);
    for (const room of m.redRooms) traceRoom(room, REF_RED.ring, S * 0.06, roomWidth);
    // Window/door symbols light up via a glow ring around their wall rectangle.
    const glowWalls = (sidesOf: (c: Cell) => Side[], t: number, inset: number, color: string) => {
      const g = S * 0.055;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, S * 0.045);
      for (let c = 0; c < W * H; c++) {
        for (const side of sidesOf(c)) {
          const { x, y } = xy(c);
          const r = sideRect(x, y, S, side, t, inset);
          ctx.beginPath();
          ctx.roundRect(r.x - g, r.y - g, r.w + 2 * g, r.h + 2 * g, (t + 2 * g) * 0.35);
          ctx.stroke();
        }
      }
    };
    const windowSides = (c: Cell) => board.windowSides(c);
    const doorSides = (c: Cell) => board.doorSides(c);
    if (m.windows) glowWalls(windowSides, S * 0.16, S * 0.16, CANDIDATE_BLUE.ring);
    if (m.redWindows) glowWalls(windowSides, S * 0.16, S * 0.16, REF_RED.ring);
    if (m.doors) glowWalls(doorSides, S * 0.2, S * 0.13, CANDIDATE_BLUE.ring);
    if (m.redDoors) glowWalls(doorSides, S * 0.2, S * 0.13, REF_RED.ring);
  }

  // --- hover: outline the whole room (blue, inside the walls). Drawn HERE — BEFORE the
  //     crosses, pencil marks and placed figures — so those all sit ON TOP of it and the
  //     soft enclosure never cuts across an X or a figure near the room edge. -----------
  if (view.hover != null && !board.isVoid(view.hover)) {
    traceRoom(board.roomIdOf(view.hover), ROOM_HL, S * 0.11, Math.max(1.5, S * 0.04));
  }

  // --- room name plates: a small white rounded pill sitting ON the room's bottom wall,
  //     placed in the widest window-free gap so it covers nothing. Drawn AFTER the hover
  //     outline so the blue room enclosure never runs across a name pill (still before the
  //     crosses/figures, which may sit on top of a pill as before). ----------------------
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [id, run] of roomBottomRuns(puzzle)) {
    const room = board.rooms.get(id);
    if (!room || run.c1 < run.c0) continue;
    // A column is blocked if its bottom wall carries a window (either side).
    const windowed = (col: number): boolean =>
      board.windowSides(board.idx(run.row, col)).includes("S") ||
      (run.row + 1 < H && board.windowSides(board.idx(run.row + 1, col)).includes("N"));
    // widest window-free sub-run within [c0, c1]
    let bc0 = run.c0;
    let bc1 = run.c0 - 1;
    let start = -1;
    const close = (end: number): void => {
      if (start >= 0 && end - start > bc1 - bc0) {
        bc0 = start;
        bc1 = end;
      }
    };
    for (let col = run.c0; col <= run.c1; col++) {
      if (!windowed(col)) {
        if (start < 0) start = col;
      } else {
        close(col - 1);
        start = -1;
      }
    }
    close(run.c1);
    if (bc1 < bc0) continue; // no window-free spot → skip rather than cover a window

    const label = view.roomName(room.nameKey).toUpperCase();
    const maxW = (bc1 - bc0 + 1) * S - S * 0.12;
    // Fit the font to the gap (text width scales ~linearly, so one rescale lands it).
    let font = S * 0.155;
    const required = (f: number): number => {
      ctx.font = `700 ${f}px 'Spline Sans Variable', system-ui, sans-serif`;
      return ctx.measureText(label).width + 2 * f * 0.5;
    };
    if (required(font) > maxW) font = Math.max(6, (font * maxW) / required(font));
    ctx.font = `700 ${font}px 'Spline Sans Variable', system-ui, sans-serif`;
    const pillW = Math.min(maxW, ctx.measureText(label).width + 2 * font * 0.5);
    const pillH = font * 1.55;
    const cx = ox + ((bc0 + bc1 + 1) / 2) * S;
    const pillY = oy + (run.row + 1) * S - pillH; // bottom edge sits on the wall
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#1c1822";
    ctx.lineWidth = Math.max(1.4, S * 0.022);
    ctx.beginPath();
    ctx.roundRect(cx - pillW / 2, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1c1822";
    ctx.fillText(label, cx, pillY + pillH / 2);
  }

  // --- crosses (dark X drawn over a wider white halo so it stays legible on
  //     dark rooms — stroke the white rim first, then the dark X on top) -----
  ctx.lineCap = "round";
  const crossW = Math.max(2, S * 0.09);
  for (const c of view.crosses) {
    const { x, y } = xy(c);
    const m = S * 0.26;
    ctx.beginPath();
    ctx.moveTo(x + m, y + m);
    ctx.lineTo(x + S - m, y + S - m);
    ctx.moveTo(x + S - m, y + m);
    ctx.lineTo(x + m, y + S - m);
    ctx.strokeStyle = BOARD.crossOutline;
    ctx.lineWidth = crossW + Math.max(1.5, S * 0.035);
    ctx.stroke();
    ctx.strokeStyle = BOARD.cross;
    ctx.lineWidth = crossW;
    ctx.stroke();
  }

  // --- pencil marks (each id in ITS OWN suspect colour) laid out in a grid (max 3 per
  //     row, wrapping down) so a busy cell never spills into its neighbour. The hovered
  //     suspect's letter only PULSES GENTLY in size around its normal size — it stays in
  //     its slot and the other letters in the cell remain fully visible. A black outline
  //     (stroke under the fill) keeps light marks legible on similar-coloured rooms, and
  //     a hairline white halo OUTSIDE the black one keeps them visible on dark rooms
  //     (same trick as the crosses, just much thinner). ---
  ctx.lineJoin = "round";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  // The victim's id is the literal 'victim'; on the board show its initial
  // (first letter of the name, uppercased) just like a suspect's letter.
  const victimLetter = view.puzzle.victim.name.charAt(0).toUpperCase();
  const markLabel = (id: PersonId) => (id === VICTIM_ID ? victimLetter : id);
  for (const [c, set] of view.marks) {
    if (occupied.has(c) || set.size === 0) continue;
    const { x, y } = xy(c);
    // Nudged down & right so they sit clear of the top-left corner.
    let i = 0;
    for (const id of set) {
      const slot = i++;
      // The hovered suspect's letters live on the OVERLAY canvas while they pulse —
      // skipped here, but their slot stays reserved so the others don't shift.
      if (id === view.emphasizeMarks) continue;
      const col = slot % 3;
      const row = Math.floor(slot / 3);
      const tx = x + S * 0.13 + col * S * 0.25;
      const ty = y + S * 0.12 + row * S * 0.3;
      const label = markLabel(id);
      const color = suspectColor(view.suspectIndex.get(id) ?? 0);
      // Letters blit from a per-(letter, colour, size) sprite — the double outline
      // strokes are costly, and notes can cover half the board.
      const mp = S * 0.12; // sprite margin for the halo/outline bleed
      const box = S * 0.27 * 1.6 + 2 * mp;
      const img = sprite(`mark|${label}|${color}|${S}|${dpr}`, box, box, dpr, (c2) => {
        c2.lineJoin = "round";
        c2.textAlign = "left";
        c2.textBaseline = "top";
        c2.font = `700 ${S * 0.27}px 'Spline Sans Variable', sans-serif`;
        const ow = Math.max(1.2, S * 0.04);
        c2.strokeStyle = BOARD.markHalo;
        c2.lineWidth = ow + Math.max(1.2, S * 0.028);
        c2.strokeText(label, mp, mp);
        c2.strokeStyle = BOARD.markOutline;
        c2.lineWidth = ow;
        c2.strokeText(label, mp, mp);
        c2.fillStyle = color;
        c2.fillText(label, mp, mp);
      });
      ctx.drawImage(img, tx - mp, ty - mp, box, box);
    }
  }

  // --- committed tokens (suspect avatar head, or victim skull) ----------
  for (const [id, c] of view.placements) {
    const { x, y } = xy(c);
    if (id === VICTIM_ID) {
      // Sprite-cached: the disk's shadowBlur is expensive to redo per frame.
      const vp = S * 0.15; // margin for the drop shadow
      const img = sprite(`victim|${S}|${dpr}`, S + 2 * vp, S + 2 * vp, dpr, (c2) =>
        drawVictim(c2, { x: vp, y: vp }, S),
      );
      ctx.drawImage(img, x - vp, y - vp, S + 2 * vp, S + 2 * vp);
      continue;
    }
    if (view.reveal?.murdererId === id) {
      ctx.beginPath();
      ctx.arc(x + S / 2, y + S / 2, S * 0.47, 0, Math.PI * 2);
      ctx.strokeStyle = BOARD.victim;
      ctx.lineWidth = S * 0.06;
      ctx.stroke();
    }
    const img = view.avatars?.get(id);
    if (img && img.complete && img.naturalWidth > 0) {
      const size = S * 0.9;
      ctx.drawImage(img, x + (S - size) / 2, y + (S - size) / 2, size, size);
    } else {
      drawToken(ctx, { x, y }, S, id, suspectColor(view.suspectIndex.get(id) ?? 0));
    }
  }

  // --- object badges on each placed token: small icons in the TOP corners so you can
  //     still tell what they stand/sit on (chair/bed/car, carpet/street). The hover tooltip
  //     said this; the badges make it permanent — crucial on touch. Drawn AFTER every token
  //     so they sit on top of the avatar that covers the object. Bottom-right stays free for
  //     the avatar's own a/b/c letter. A tile carries at most two layers, so at most two
  //     badges: the occupiable piece they're ON (top → top-right), the floor (ground →
  //     top-left). Bare floor has neither → no badge. Can be turned off in the settings.
  if (view.objectBadges) {
    const b = S * 0.24;
    const pad = S * 0.05;
    const bp = b * 0.35; // sprite margin for the badge's drop shadow
    // Sprite-cached per object type: the badge card uses shadowBlur (expensive) and
    // repeats for every placed figure on every frame.
    const blitBadge = (type: string, bx: number, by: number): void => {
      const img = sprite(`badge|${type}|${b}|${dpr}`, b + 2 * bp, b + 2 * bp, dpr, (c2) =>
        drawObjectBadge(c2, type, bp, bp, b),
      );
      ctx.drawImage(img, bx - bp, by - bp, b + 2 * bp, b + 2 * bp);
    };
    for (const [, c] of view.placements) {
      const tile = board.tileAt(c);
      if (!tile.top && !tile.ground) continue;
      const { x, y } = xy(c);
      if (tile.top) blitBadge(tile.top.type, x + S - pad - b, y + pad);
      if (tile.ground) blitBadge(tile.ground.type, x + pad, y + pad);
    }
  }

  // --- candidate-hint rings (blue rounded rectangles) — drawn last (above the figures and
  //     the room hover outline) so they always stay visible. The selection ring sits a touch
  //     further in, so where a hint cell IS also a candidate both rings stay visible. ----
  if (view.highlight2)
    drawRings(
      view.highlight2,
      view.highlightColor2?.ring ?? BOARD.highlightRing,
      S * 0.13,
      true,
      view.highlightAlpha2 ?? 1,
    );
  if (view.highlight)
    drawRings(
      view.highlight,
      view.highlightColor?.ring ?? BOARD.highlightRing,
      S * 0.07,
      true,
      view.highlightAlpha ?? 1,
    );

  // --- hover/press outline: yellow on occupiable, red on blocked --------
  if (view.hover != null) {
    const { x, y } = xy(view.hover);
    const occ = board.isOccupiable(view.hover);
    const pad = S * 0.06;
    ctx.fillStyle = occ ? "rgba(255, 216, 77, 0.16)" : "rgba(207, 70, 60, 0.16)";
    ctx.strokeStyle = occ ? "#ffd84d" : BOARD.victim;
    ctx.lineWidth = Math.max(2, S * 0.06);
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, S - 2 * pad, S - 2 * pad, S * 0.12);
    ctx.fill();
    ctx.stroke();
  }
}

// ─── Animation overlay ───────────────────────────────────────────────────────
// A transparent canvas stacked exactly over the board holds ONLY the per-frame
// animations (pulsing note letters, long-press progress ring). Their rAF loops
// clear and repaint just this near-empty layer — the board canvas underneath is
// not touched at all while they run.

export interface OverlayView {
  puzzle: Puzzle;
  /** Cell size in CSS pixels (same layout as the board canvas underneath). */
  cell: number;
  origin: { x: number; y: number };
  suspectIndex: Map<PersonId, number>;
  marks: Map<Cell, Set<PersonId>>;
  /** Placements — marks on occupied cells aren't drawn (mirrors the base canvas). */
  placements: Map<PersonId, Cell>;
  /** Suspect whose note letters pulse here (the base canvas skips them). */
  emphasize: PersonId | null;
  /** 0..1 pulse phase for the emphasized letters. */
  pulse: number;
  /** Long-press progress ring. */
  press: { cell: Cell; progress: number } | null;
}

export function drawBoardOverlay(ctx: CanvasRenderingContext2D, o: OverlayView): void {
  const S = o.cell;
  const board = o.puzzle.board;
  const xy = (c: Cell) => {
    const { row, col } = board.rc(c);
    return { x: o.origin.x + col * S, y: o.origin.y + row * S };
  };

  // --- pulsing note letters of the hovered suspect ------------------------
  if (o.emphasize) {
    const occupied = new Set(o.placements.values());
    const label =
      o.emphasize === VICTIM_ID ? o.puzzle.victim.name.charAt(0).toUpperCase() : o.emphasize;
    const color = suspectColor(o.suspectIndex.get(o.emphasize) ?? 0);
    const scale = 1 + 0.35 * o.pulse;
    ctx.lineJoin = "round";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `800 ${S * 0.27 * scale}px 'Spline Sans Variable', sans-serif`;
    const outlineW = Math.max(1.2, S * 0.04 * scale);
    for (const [c, set] of o.marks) {
      if (occupied.has(c) || !set.has(o.emphasize)) continue;
      // The letter's slot within this cell — must match the base canvas layout.
      let slot = 0;
      for (const id of set) {
        if (id === o.emphasize) break;
        slot++;
      }
      const { x, y } = xy(c);
      const tx = x + S * 0.13 + (slot % 3) * S * 0.25;
      const ty = y + S * 0.12 + Math.floor(slot / 3) * S * 0.3;
      ctx.fillStyle = color;
      ctx.strokeStyle = BOARD.markHalo;
      ctx.lineWidth = outlineW + Math.max(1.2, S * 0.028);
      ctx.strokeText(label, tx, ty);
      ctx.strokeStyle = BOARD.markOutline;
      ctx.lineWidth = outlineW;
      ctx.strokeText(label, tx, ty);
      ctx.fillText(label, tx, ty);
    }
  }

  // --- long-press progress ring -----------------------------------------
  if (o.press) {
    const { x, y } = xy(o.press.cell);
    const cx = x + S / 2;
    const cy = y + S / 2;
    ctx.fillStyle = BOARD.pressScrim;
    ctx.fillRect(x, y, S, S);
    const radius = S * 0.34;
    ctx.lineCap = "round";
    ctx.lineWidth = S * 0.09;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = BOARD.press;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * o.press.progress);
    ctx.stroke();
  }
}

const NO_CONN: Conn = { n: false, e: false, s: false, w: false };

/**
 * Draw ONE isolated object into a single cell box (x,y,S) exactly as the board
 * renders it — table/carpet as a standalone tile, bed/car as the 1-tile version,
 * vector furniture, then emoji on a white "blocked" card when not occupiable.
 * Shared by the board's per-cell pass and the Legend so the two never diverge.
 */
export function drawObjectIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  S: number,
  occupiable: boolean,
  preview = false,
): void {
  if (type === "carpet") return drawCarpetTile(ctx, x, y, S, NO_CONN);
  if (type === "street") return drawStreetTile(ctx, x, y, S, NO_CONN);
  if (type === "path") return drawPathTile(ctx, x, y, S, NO_CONN);
  if (type === "table") return drawTableTile(ctx, x, y, S, NO_CONN);
  if (MULTI_CELL_TYPES.has(type)) return drawSingleObject(ctx, type, x, y, S);
  if (type === "chair") return drawArmchair(ctx, x, y, S);
  if (type === "tent") return drawTent(ctx, x, y, S); // occupiable → no card
  if (type === "waterlily") return drawWaterlily(ctx, x, y, S); // occupiable → no card
  if (type === "mud") return drawMud(ctx, x, y, S);
  if (type === "oil") return drawOil(ctx, x, y, S);
  if (type === "throne") return drawThrone(ctx, x, y, S); // occupiable → no card
  if (type === "deckchair") return drawDeckchair(ctx, x, y, S); // occupiable → no card
  if (type === "parasol") return drawParasol(ctx, x, y, S); // occupiable → no card
  if (type === "divingboard") return drawDivingBoard(ctx, x, y, S); // occupiable → no card
  if (type === "hottub") return drawHottub(ctx, x, y, S); // occupiable → no card
  if (type === "hammock") return drawHammock(ctx, x, y, S); // occupiable → no card
  // blocked custom-art objects sit on the same white card as blocked emoji
  if (type === "shelf") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawBookshelf(ctx, x, y, S);
  }
  if (type === "locker") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawLocker(ctx, x, y, S);
  }
  if (type === "punchbag") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawPunchbag(ctx, x, y, S);
  }
  if (type === "cash") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawCashRegister(ctx, x, y, S);
  }
  if (type === "crate") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawCrate(ctx, x, y, S);
  }
  if (type === "washingmachine") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawWashingMachine(ctx, x, y, S);
  }
  if (type === "fridge") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawFridge(ctx, x, y, S);
  }
  if (type === "lamp") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawFloorLamp(ctx, x, y, S);
  }
  if (type === "piano") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawPiano(ctx, x, y, S);
  }
  if (type === "bear") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawBear(ctx, x, y, S);
  }
  if (type === "campfire") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawCampfire(ctx, x, y, S);
  }
  if (type === "grill") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawGrill(ctx, x, y, S);
  }
  if (type === "hay") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawHaystack(ctx, x, y, S);
  }
  if (type === "candle") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawCandelabrum(ctx, x, y, S);
  }
  if (type === "fireplace") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawFireplace(ctx, x, y, S);
  }
  if (type === "barrel") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawBarrel(ctx, x, y, S);
  }
  if (type === "armor") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawArmor(ctx, x, y, S);
  }
  if (type === "weaponrack") {
    if (!preview) drawBlockedCard(ctx, x, y, S);
    return drawWeaponRack(ctx, x, y, S);
  }
  // occupiable → no card; the chip/legend shows the neutral playground look
  if (type === "slide") return drawSlide(ctx, x, y, S);
  if (type === "shower") return drawShower(ctx, x, y, S); // occupiable → no blocked card
  const glyph = OBJECT_GLYPHS[type];
  if (!glyph) return;
  if (!preview && !occupiable) drawBlockedCard(ctx, x, y, S);
  ctx.fillStyle = "#1c1822"; // opaque, so any monochrome glyph stays bold (not faint)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${S * (preview ? 0.72 : 0.66)}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
  ctx.fillText(glyph, x + S / 2, y + S * 0.56);
}

/**
 * A small white "evidence chip" showing one object's icon, drawn over a placed token's
 * corner so the surface under the figure stays readable on touch. Reuses drawObjectIcon
 * (preview mode → clean icon, no big blocked card) clipped into a rounded card, so the
 * chip matches the board/legend art exactly. `S` here is the chip's box size.
 */
function drawObjectBadge(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  S: number,
): void {
  const r = S * 0.22;
  // white card with a soft shadow so it separates from the avatar underneath
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, S, S, r);
  ctx.shadowColor = "rgba(0,0,0,0.38)";
  ctx.shadowBlur = S * 0.2;
  ctx.shadowOffsetY = S * 0.05;
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
  // icon clipped to the rounded card (carpet/street fill edge-to-edge, glyphs sit inside)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, S, S, r);
  ctx.clip();
  drawObjectIcon(ctx, type, x, y, S, true, true);
  ctx.restore();
  // crisp dark rim
  ctx.beginPath();
  ctx.roundRect(x, y, S, S, r);
  ctx.strokeStyle = "rgba(28,24,34,0.85)";
  ctx.lineWidth = Math.max(1, S * 0.05);
  ctx.stroke();
}

/** The rectangle a wall fixture (window/door) of thickness `t`, inset `inset`
 *  from the cell corners, occupies on the given side — shared by the fixture
 *  art and the reduced-help glow so the two never disagree. */
function sideRect(
  x: number,
  y: number,
  S: number,
  side: Side,
  t: number,
  inset: number,
): { x: number; y: number; w: number; h: number; vertical: boolean } {
  switch (side) {
    case "N":
      return { x: x + inset, y: y - t / 2, w: S - 2 * inset, h: t, vertical: false };
    case "S":
      return { x: x + inset, y: y + S - t / 2, w: S - 2 * inset, h: t, vertical: false };
    case "W":
      return { x: x - t / 2, y: y + inset, w: t, h: S - 2 * inset, vertical: true };
    case "E":
      return { x: x + S - t / 2, y: y + inset, w: t, h: S - 2 * inset, vertical: true };
  }
}

/** A light-blue window straddling one wall of a cell. */
export function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  S: number,
  side: Side,
): void {
  const t = S * 0.16;
  const { x: rx, y: ry, w: rw, h: rh, vertical } = sideRect(x, y, S, side, t, S * 0.16);
  ctx.fillStyle = BOARD.window;
  ctx.strokeStyle = "#3f6378";
  ctx.lineWidth = Math.max(1.2, S * 0.025);
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, t * 0.28);
  ctx.fill();
  ctx.stroke();
  // mullion across the middle
  ctx.beginPath();
  if (vertical) {
    ctx.moveTo(rx, ry + rh / 2);
    ctx.lineTo(rx + rw, ry + rh / 2);
  } else {
    ctx.moveTo(rx + rw / 2, ry);
    ctx.lineTo(rx + rw / 2, ry + rh);
  }
  ctx.stroke();
}

/** A brown door straddling one wall of a cell (two-sided; drawn from both cells). */
export function drawDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  S: number,
  side: Side,
): void {
  const t = S * 0.2;
  const { x: rx, y: ry, w: rw, h: rh, vertical } = sideRect(x, y, S, side, t, S * 0.13);
  ctx.fillStyle = "#8a5a2b";
  ctx.strokeStyle = "#4a2f15";
  ctx.lineWidth = Math.max(1.2, S * 0.028);
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, t * 0.2);
  ctx.fill();
  ctx.stroke();
  // centre panel groove
  ctx.strokeStyle = "rgba(74, 47, 21, 0.55)";
  ctx.lineWidth = Math.max(1, S * 0.015);
  ctx.beginPath();
  if (vertical) {
    ctx.moveTo(rx + rw / 2, ry + rh * 0.12);
    ctx.lineTo(rx + rw / 2, ry + rh * 0.88);
  } else {
    ctx.moveTo(rx + rw * 0.12, ry + rh / 2);
    ctx.lineTo(rx + rw * 0.88, ry + rh / 2);
  }
  ctx.stroke();
  // brass handle near one end
  ctx.fillStyle = "#e8c46a";
  const hx = vertical ? rx + rw / 2 : rx + rw * 0.8;
  const hy = vertical ? ry + rh * 0.8 : ry + rh / 2;
  ctx.beginPath();
  ctx.arc(hx, hy, Math.max(1.2, S * 0.03), 0, Math.PI * 2);
  ctx.fill();
}

/** The victim token: a crimson disc with a skull. */
function drawVictim(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }, S: number): void {
  const cx = pos.x + S / 2;
  const cy = pos.y + S / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.37, 0, Math.PI * 2);
  ctx.fillStyle = BOARD.victim;
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = S * 0.16;
  ctx.shadowOffsetY = S * 0.03;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${S * 0.44}px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;
  ctx.fillText("💀", cx, cy + S * 0.02);
}

function drawToken(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  S: number,
  letter: string,
  color: string,
): void {
  const cx = pos.x + S / 2;
  const cy = pos.y + S / 2;
  const r = S * 0.36;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = S * 0.14;
  ctx.shadowOffsetY = S * 0.03;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = Math.max(1.5, S * 0.03);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${S * 0.42}px 'Fraunces Variable', Georgia, serif`;
  ctx.fillText(letter, cx, cy + S * 0.02);
}
