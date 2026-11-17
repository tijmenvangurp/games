/**
 * Hand-drawn, top-down furniture for the board canvas (same spirit as the
 * bed/car vectors in bigObjects.ts). Tables and carpets AUTO-TILE: adjacent
 * same-room cells merge into one continuous surface (rows, L, 2×2, …), so a
 * block of tables reads as one big table.
 */

import armchairUrl from "../../ui/assets/armchair.png";

type Ctx = CanvasRenderingContext2D;

/** Which neighbours belong to the same merged group. The diagonals are optional;
 *  when set, they let a tile round its INNER (concave) L-corners — a corner whose two
 *  orthogonal sides are connected but whose diagonal cell is empty. */
export interface Conn {
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
  ne?: boolean;
  nw?: boolean;
  se?: boolean;
  sw?: boolean;
}

// Bitmap assets used by the board. Loaded once; canvases call onArtReady() to
// redraw when they finish (guarded so engine tests without a DOM don't break).
const armchairImg = typeof Image !== "undefined" ? new Image() : null;
let artReady = false;
const artCallbacks = new Set<() => void>();
if (armchairImg) {
  armchairImg.onload = () => {
    artReady = true;
    for (const cb of artCallbacks) cb();
  };
  armchairImg.src = armchairUrl;
}

/** Register a callback fired when board art finishes loading (for a redraw). Returns an unsubscribe. */
export function onArtReady(cb: () => void): () => void {
  if (artReady) {
    cb();
    return () => {};
  }
  artCallbacks.add(cb);
  return () => artCallbacks.delete(cb);
}

/**
 * Path for one cell of a merged surface: flush with connected neighbours (so
 * pieces butt together seamlessly) and inset + rounded on outer edges. `ov`
 * overlaps connected edges slightly to hide anti-alias hairlines (use 0 for
 * translucent fills, which must not double up). Each corner is one of:
 *  - CONVEX  (both sides open) — the outer rounded corner;
 *  - CONCAVE (both sides connected but the diagonal cell empty) — the inner corner
 *    of an L, rounded INWARD so it closes off smoothly instead of a square nub;
 *  - SQUARE  (a straight run or a fully-filled block corner).
 */
function piecePath(
  ctx: Ctx,
  x: number,
  y: number,
  S: number,
  conn: Conn,
  inset: number,
  r: number,
  ov: number,
): void {
  const L = x + (conn.w ? -ov : inset);
  const R = x + S - (conn.e ? -ov : inset);
  const T = y + (conn.n ? -ov : inset);
  const B = y + S - (conn.s ? -ov : inset);
  const Q = Math.PI / 2;
  // Concave (inner-L) radius = inset + ov: the arc lands exactly on the NEIGHBOURS' inset
  // edges, so the L closes flush (no offset). Because each layer uses its OWN inset, a
  // lower (outline) layer — drawn with a smaller inset — keeps a smaller notch and so
  // peeks out INSIDE the curve as an inline rim, the width of the inset difference.
  const ci = inset + ov;
  // 'conv' = outer rounded (radius r), 'conc' = inner (concave) rounded (radius ci), 'sq' = sharp.
  const kind = (a: boolean, b: boolean, diag?: boolean) =>
    !a && !b ? "conv" : a && b && diag === false ? "conc" : "sq";
  const tl = kind(conn.n, conn.w, conn.nw);
  const tr = kind(conn.n, conn.e, conn.ne);
  const br = kind(conn.s, conn.e, conn.se);
  const bl = kind(conn.s, conn.w, conn.sw);
  const rad = (k: string) => (k === "conv" ? r : k === "conc" ? ci : 0);
  ctx.beginPath();
  ctx.moveTo(L + rad(tl), T);
  ctx.lineTo(R - rad(tr), T);
  if (tr === "conv") ctx.arc(R - r, T + r, r, -Q, 0, false);
  else if (tr === "conc") ctx.arc(R, T, ci, Math.PI, Q, true);
  else ctx.lineTo(R, T);
  ctx.lineTo(R, B - rad(br));
  if (br === "conv") ctx.arc(R - r, B - r, r, 0, Q, false);
  else if (br === "conc") ctx.arc(R, B, ci, 3 * Q, Math.PI, true);
  else ctx.lineTo(R, B);
  ctx.lineTo(L + rad(bl), B);
  if (bl === "conv") ctx.arc(L + r, B - r, r, Q, Math.PI, false);
  else if (bl === "conc") ctx.arc(L, B, ci, 0, -Q, true);
  else ctx.lineTo(L, B);
  ctx.lineTo(L, T + rad(tl));
  if (tl === "conv") ctx.arc(L + r, T + r, r, Math.PI, 3 * Q, false);
  else if (tl === "conc") ctx.arc(L, T, ci, Q, 0, true);
  else ctx.lineTo(L, T);
  ctx.closePath();
}

/** One cell of a wooden table surface (auto-tiled). Inset a touch more than the cell so a
 *  carpet underneath stays visible around the table (and merged tables read as one block). */
export function drawTableTile(ctx: Ctx, x: number, y: number, S: number, conn: Conn): void {
  const pad = S * 0.15;
  const ow = Math.max(1.6, S * 0.06);
  const ov = Math.max(0.75, S * 0.02);
  // black outline (slightly larger), then the wood top — outline shows only on
  // the OUTER edges of the merged shape (connected sides meet seamlessly).
  ctx.fillStyle = "#1c1822";
  piecePath(ctx, x, y, S, conn, Math.max(0, pad - ow), S * 0.17, ov);
  ctx.fill();
  ctx.fillStyle = "#c8a063";
  piecePath(ctx, x, y, S, conn, pad, S * 0.12, ov);
  ctx.fill();
  // wood grain, clipped to the top
  ctx.save();
  piecePath(ctx, x, y, S, conn, pad, S * 0.13, ov);
  ctx.clip();
  ctx.strokeStyle = "rgba(111, 77, 44, 0.22)";
  ctx.lineWidth = Math.max(1, S * 0.018);
  ctx.beginPath();
  for (const fx of [0.32, 0.62]) {
    ctx.moveTo(x + fx * S, y - 1);
    ctx.lineTo(x + fx * S, y + S + 1);
  }
  ctx.stroke();
  ctx.restore();
  // Only the bottom (front) of the surface gets detail: a darker front edge for
  // thickness and the two front legs peeking out below — exactly like the bed's
  // feet. In a slightly-tilted top-down view the two back legs are hidden under
  // the top, so we never draw all four (that looked like a box, not a table).
  if (!conn.s) {
    ctx.save();
    piecePath(ctx, x, y, S, conn, pad, S * 0.13, ov);
    ctx.clip();
    ctx.fillStyle = "rgba(90, 61, 34, 0.3)";
    ctx.fillRect(x - 1, y + S - pad - S * 0.06, S + 2, S * 0.06);
    ctx.restore();

    ctx.fillStyle = "#5a3d22";
    ctx.strokeStyle = "#1c1822";
    ctx.lineWidth = Math.max(1, S * 0.02);
    const legW = S * 0.1;
    const legH = S * 0.12;
    const legY = y + S - pad - S * 0.015;
    const drawLeg = (lx: number): void => {
      ctx.beginPath();
      ctx.roundRect(lx, legY, legW, legH, legW * 0.35);
      ctx.fill();
      ctx.stroke();
    };
    if (!conn.w) drawLeg(x + pad + S * 0.03);
    if (!conn.e) drawLeg(x + S - pad - S * 0.03 - legW);
  }
}

/** Rug geometry (fractions of S) — shared by the rug and its base blank below. */
const RUG_PAD = 0.1;
const RUG_R = 0.12;

/** Repaint the room colour opaquely in the rug's exact merged shape. Called right after
 *  the floor pattern: the rug itself is translucent (so the room colour — and any
 *  candidate wash drawn later — still tints it), but a floor pattern must not shine
 *  through fabric. Outside the rug the pattern keeps running up to its edge. */
export function drawCarpetBase(
  ctx: Ctx,
  x: number,
  y: number,
  S: number,
  conn: Conn,
  color: string,
): void {
  ctx.fillStyle = color;
  piecePath(ctx, x, y, S, conn, S * RUG_PAD, S * RUG_R, 0);
  ctx.fill();
}

/** One cell of a soft rug (auto-tiled, translucent so the room colour shows). Sized so it
 *  reads as a rug yet still peeks out around the smaller furniture sitting on it, with a
 *  small woven motif (a diamond per cell) that tiles across the whole merged rug. */
export function drawCarpetTile(ctx: Ctx, x: number, y: number, S: number, conn: Conn): void {
  const pad = S * RUG_PAD;
  ctx.fillStyle = "rgba(170, 108, 76, 0.55)";
  piecePath(ctx, x, y, S, conn, pad, S * RUG_R, 0);
  ctx.fill();
  // a lighter inner field, also merged, for a woven border (its larger inset makes the
  // darker field above line the diagonal notch as an inline, just like the outer edges)
  ctx.fillStyle = "rgba(216, 170, 134, 0.45)";
  piecePath(ctx, x, y, S, conn, pad + S * 0.06, S * 0.09, 0);
  ctx.fill();
  // woven motif: a small diamond centred in the cell (tiles across the merged rug)
  const cx = x + S / 2;
  const cy = y + S / 2;
  const d = S * 0.16;
  ctx.strokeStyle = "rgba(120, 74, 50, 0.4)";
  ctx.lineWidth = Math.max(1, S * 0.02);
  ctx.beginPath();
  ctx.moveTo(cx, cy - d);
  ctx.lineTo(cx + d, cy);
  ctx.lineTo(cx, cy + d);
  ctx.lineTo(cx - d, cy);
  ctx.closePath();
  ctx.stroke();
}

/** A plush armchair (occupiable seat), drawn from the bundled armchair.png. */
export function drawArmchair(ctx: Ctx, x: number, y: number, S: number): void {
  // soft contact shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
  ctx.beginPath();
  ctx.ellipse(x + S / 2, y + S * 0.8, S * 0.26, S * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  if (armchairImg && armchairImg.complete && armchairImg.naturalWidth > 0) {
    const size = S * 0.65; // smaller than the tile, centred
    const off = (S - size) / 2;
    ctx.drawImage(armchairImg, x + off, y + off, size, size);
    return;
  }
  // fallback before the image loads: a soft neutral cushion
  ctx.fillStyle = "#cbd2da";
  ctx.beginPath();
  ctx.roundRect(x + S * 0.16, y + S * 0.16, S * 0.68, S * 0.68, S * 0.16);
  ctx.fill();
}

const BOOK_COLORS = ["#9a4f3a", "#5f7392", "#76895a", "#b0813f", "#7d5f8e", "#9a6b52"];

/** A wooden bookshelf filled with colourful book spines (blocking). */
export function drawBookshelf(ctx: Ctx, x: number, y: number, S: number): void {
  // Shrink to 80% about the cell centre so the white "blocked" card shows around it.
  ctx.save();
  ctx.translate(x + S / 2, y + S / 2);
  ctx.scale(0.8, 0.8);
  ctx.translate(-(x + S / 2), -(y + S / 2));
  const pad = S * 0.1;
  const left = x + pad;
  const top = y + pad;
  const w = S - 2 * pad;
  const h = S - 2 * pad;
  const wood = "#c39a5e";
  const dark = "#5e4326";

  ctx.fillStyle = wood;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.4, S * 0.05);
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, S * 0.06);
  ctx.fill();
  ctx.stroke();

  const ib = S * 0.05;
  const iL = left + ib;
  const iT = top + ib;
  const iW = w - 2 * ib;
  const iH = h - 2 * ib;
  ctx.fillStyle = "#ece0c6";
  ctx.beginPath();
  ctx.roundRect(iL, iT, iW, iH, S * 0.03);
  ctx.fill();

  const rows = 3;
  const rowH = iH / rows;
  const board = Math.max(1, S * 0.022);
  ctx.save();
  ctx.beginPath();
  ctx.rect(iL, iT, iW, iH);
  ctx.clip();
  for (let r = 0; r < rows; r++) {
    const shelfY = iT + r * rowH + rowH - board;
    ctx.fillStyle = dark;
    ctx.fillRect(iL, shelfY, iW, board);
    let bx = iL + S * 0.02;
    let i = 0;
    while (bx < iL + iW - S * 0.03) {
      const bw = S * (0.05 + 0.018 * ((i * 7 + r * 3) % 3));
      const bh = rowH * (0.62 + 0.12 * ((i * 5 + r) % 3));
      ctx.fillStyle = BOOK_COLORS[(i + r * 2) % BOOK_COLORS.length];
      const by = shelfY - bh;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.14)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
      bx += bw + S * 0.012;
      i++;
    }
  }
  ctx.restore(); // clip
  ctx.restore(); // 80% scale
}

/** An occupiable mud puddle: an organic brown blob with a dark rim and ripples. */
export function drawMud(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S / 2;
  const cy = y + S * 0.54;
  const rx = S * 0.42;
  const ry = S * 0.32;
  // wobbly outline (deterministic, so it doesn't shimmer between redraws)
  const pts = 14;
  ctx.beginPath();
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const wob = 0.82 + 0.16 * Math.sin(a * 3 + 1.3) + 0.06 * Math.cos(a * 5);
    const px = cx + Math.cos(a) * rx * wob;
    const py = cy + Math.sin(a) * ry * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.save();
  ctx.fillStyle = "#3f2c18"; // dark muddy rim
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "#6b4a28";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7d5832";
  ctx.beginPath();
  ctx.ellipse(cx, cy - ry * 0.08, rx * 0.6, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // ripple ring + a couple of light glints
  ctx.strokeStyle = "rgba(180, 140, 90, 0.5)";
  ctx.lineWidth = Math.max(1, S * 0.02);
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.12, cy - ry * 0.1, rx * 0.32, ry * 0.24, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(214, 184, 140, 0.55)";
  ctx.beginPath();
  ctx.ellipse(cx + rx * 0.3, cy + ry * 0.22, S * 0.045, S * 0.028, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** An occupiable oil slick: a glossy near-black blob with an iridescent sheen. */
export function drawOil(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S / 2;
  const cy = y + S * 0.54;
  const rx = S * 0.42;
  const ry = S * 0.32;
  const pts = 16;
  ctx.beginPath();
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const wob = 0.8 + 0.18 * Math.sin(a * 3 + 0.7) + 0.07 * Math.cos(a * 5 + 2);
    const px = cx + Math.cos(a) * rx * wob;
    const py = cy + Math.sin(a) * ry * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.save();
  ctx.fillStyle = "#0c0a10"; // near-black oil
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "#15131c";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.95, ry * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  // iridescent sheen patches (oil-on-water rainbow)
  ctx.fillStyle = "rgba(80, 120, 150, 0.5)";
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.25, cy - ry * 0.2, rx * 0.42, ry * 0.32, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(150, 90, 140, 0.42)";
  ctx.beginPath();
  ctx.ellipse(cx + rx * 0.3, cy + ry * 0.18, rx * 0.32, ry * 0.24, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // glossy highlight
  ctx.fillStyle = "rgba(220, 230, 240, 0.7)";
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.15, cy - ry * 0.28, S * 0.06, S * 0.03, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * A metal locker (blocking), drawn front-on in the same framed style as the
 * bookshelf: an outlined metal frame holding two doors, each with louvered
 * vents up top, a name-plate slot and a handle.
 */
export function drawLocker(ctx: Ctx, x: number, y: number, S: number): void {
  // Shrink to 80% about the cell centre so the white "blocked" card shows around it.
  ctx.save();
  ctx.translate(x + S / 2, y + S / 2);
  ctx.scale(0.8, 0.8);
  ctx.translate(-(x + S / 2), -(y + S / 2));
  const pad = S * 0.1;
  const left = x + pad;
  const top = y + pad;
  const w = S - 2 * pad;
  const h = S - 2 * pad;
  const metal = "#9aa6b2";
  const dark = "#4b535c";

  // outer frame (metal body) with a dark outline — mirrors the bookshelf
  ctx.fillStyle = metal;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.4, S * 0.05);
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, S * 0.06);
  ctx.fill();
  ctx.stroke();

  // recessed inner area (the two doors live here)
  const ib = S * 0.05;
  const iL = left + ib;
  const iT = top + ib;
  const iW = w - 2 * ib;
  const iH = h - 2 * ib;
  ctx.fillStyle = "#aeb8c2";
  ctx.beginPath();
  ctx.roundRect(iL, iT, iW, iH, S * 0.03);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.rect(iL, iT, iW, iH);
  ctx.clip();

  const doorGap = S * 0.025;
  const doorW = (iW - doorGap) / 2;
  const doors = [iL, iL + doorW + doorGap];
  for (const dL of doors) {
    // door panel + slight shine, with a thin seam outline
    ctx.fillStyle = "#9aa6b2";
    ctx.fillRect(dL, iT, doorW, iH);
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(dL + doorW * 0.12, iT, doorW * 0.18, iH);
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1, S * 0.018);
    ctx.strokeRect(dL + 0.5, iT + 0.5, doorW - 1, iH - 1);
    // louvered vents near the top
    ctx.strokeStyle = "rgba(40, 48, 56, 0.6)";
    ctx.lineWidth = Math.max(1, S * 0.016);
    for (let i = 0; i < 3; i++) {
      const vy = iT + iH * (0.1 + i * 0.07);
      ctx.beginPath();
      ctx.moveTo(dL + doorW * 0.18, vy);
      ctx.lineTo(dL + doorW * 0.82, vy);
      ctx.stroke();
    }
    // name-plate slot
    ctx.fillStyle = "#dfe5ea";
    ctx.fillRect(dL + doorW * 0.28, iT + iH * 0.34, doorW * 0.44, iH * 0.1);
    // vertical handle
    ctx.fillStyle = "#3a4048";
    ctx.beginPath();
    ctx.roundRect(dL + doorW * 0.78, iT + iH * 0.52, doorW * 0.08, iH * 0.26, doorW * 0.04);
    ctx.fill();
  }
  ctx.restore(); // clip
  ctx.restore(); // 80% scale
}

/** A red boxing bag (blocking): a hanging leather cylinder seen from a slight angle. */
export function drawPunchbag(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S / 2;
  // contact shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.beginPath();
  ctx.ellipse(cx, y + S * 0.82, S * 0.18, S * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  const top = y + S * 0.22;
  const bot = y + S * 0.8;
  const r = S * 0.18; // half-width
  // strap + ceiling mount ring
  ctx.strokeStyle = "#555";
  ctx.lineWidth = Math.max(1.2, S * 0.03);
  ctx.beginPath();
  ctx.moveTo(cx, y + S * 0.13);
  ctx.lineTo(cx, top);
  ctx.stroke();
  ctx.fillStyle = "#777";
  ctx.beginPath();
  ctx.arc(cx, y + S * 0.13, Math.max(1.4, S * 0.04), 0, Math.PI * 2);
  ctx.fill();
  // body (red leather) with dark outline
  ctx.fillStyle = "#1c1822";
  ctx.beginPath();
  ctx.roundRect(cx - r - S * 0.02, top - S * 0.02, 2 * r + S * 0.04, bot - top + S * 0.04, r * 0.6);
  ctx.fill();
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.roundRect(cx - r, top, 2 * r, bot - top, r * 0.5);
  ctx.fill();
  // rounded top cap
  ctx.fillStyle = "#a93226";
  ctx.beginPath();
  ctx.ellipse(cx, top + S * 0.02, r, S * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  // vertical shine
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.6, top + S * 0.06, r * 0.35, bot - top - S * 0.16, r * 0.3);
  ctx.fill();
  // strap bands
  ctx.strokeStyle = "rgba(60, 20, 16, 0.7)";
  ctx.lineWidth = Math.max(1, S * 0.025);
  for (const f of [0.32, 0.62]) {
    const by = top + (bot - top) * f;
    ctx.beginPath();
    ctx.moveTo(cx - r, by);
    ctx.lineTo(cx + r, by);
    ctx.stroke();
  }
}

/** A checkout cash register (blocking): a drawer base, a body with a keypad, and
 *  a small green display tilted up at the back. Sized to sit on the white card. */
export function drawCashRegister(ctx: Ctx, x: number, y: number, S: number): void {
  const dark = "#2a2f36";
  ctx.lineWidth = Math.max(1.2, S * 0.03);
  ctx.strokeStyle = dark;

  // drawer base (bottom, widest)
  const dw = S * 0.62;
  const dh = S * 0.18;
  const dx = x + (S - dw) / 2;
  const dy = y + S * 0.6;
  ctx.fillStyle = "#aab2ba";
  ctx.beginPath();
  ctx.roundRect(dx, dy, dw, dh, S * 0.03);
  ctx.fill();
  ctx.stroke();
  // drawer handle slot
  ctx.fillStyle = "#5a6068";
  ctx.fillRect(dx + dw * 0.3, dy + dh * 0.55, dw * 0.4, dh * 0.18);

  // register body (on the drawer)
  const bw = S * 0.5;
  const bh = S * 0.3;
  const bx = x + (S - bw) / 2;
  const by = dy - bh + S * 0.02;
  ctx.fillStyle = "#c7ccd2";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, S * 0.04);
  ctx.fill();
  ctx.stroke();
  // keypad (3×2 little buttons) on the body
  ctx.fillStyle = "#5a6068";
  const kw = bw * 0.16;
  const kh = bh * 0.2;
  for (let r = 0; r < 2; r++) {
    for (let cc = 0; cc < 3; cc++) {
      ctx.beginPath();
      ctx.roundRect(
        bx + bw * 0.16 + cc * bw * 0.26,
        by + bh * 0.42 + r * bh * 0.3,
        kw,
        kh,
        kw * 0.3,
      );
      ctx.fill();
    }
  }

  // display screen tilted up at the back-left, with a green readout
  const sw = S * 0.32;
  const sh = S * 0.16;
  const sx = bx + bw * 0.08;
  const sy = by - sh + S * 0.02;
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, S * 0.025);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#6ee7a0"; // LCD glow
  ctx.fillRect(sx + sw * 0.14, sy + sh * 0.34, sw * 0.72, sh * 0.3);
}

/**
 * A front-loading washing machine (blocking), drawn front-on in the same framed
 * style as the locker/bookshelf: a white body with a top control panel (dial +
 * buttons) and a big round porthole door with tinted glass. Sized for the card.
 */
export function drawWashingMachine(ctx: Ctx, x: number, y: number, S: number): void {
  // Shrink to 80% about the cell centre so the white "blocked" card shows around it.
  ctx.save();
  ctx.translate(x + S / 2, y + S / 2);
  ctx.scale(0.8, 0.8);
  ctx.translate(-(x + S / 2), -(y + S / 2));
  const pad = S * 0.1;
  const left = x + pad;
  const top = y + pad;
  const w = S - 2 * pad;
  const h = S - 2 * pad;
  const body = "#e9edf1";
  const dark = "#4b535c";

  // appliance body with a dark outline — mirrors the locker frame
  ctx.fillStyle = body;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.4, S * 0.05);
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, S * 0.07);
  ctx.fill();
  ctx.stroke();

  // top control panel strip with a seam line under it
  const panelH = h * 0.24;
  ctx.fillStyle = "#cdd4db";
  ctx.beginPath();
  ctx.roundRect(left, top, w, panelH, [S * 0.07, S * 0.07, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, S * 0.02);
  ctx.beginPath();
  ctx.moveTo(left, top + panelH);
  ctx.lineTo(left + w, top + panelH);
  ctx.stroke();
  // program dial on the right, two buttons on the left
  ctx.fillStyle = "#5a6068";
  ctx.beginPath();
  ctx.arc(left + w * 0.8, top + panelH * 0.5, Math.max(1.6, S * 0.05), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7d8893";
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.roundRect(left + w * (0.13 + i * 0.16), top + panelH * 0.36, w * 0.1, panelH * 0.3, 2);
    ctx.fill();
  }

  // round porthole door in the lower body
  const cx = left + w / 2;
  const cy = top + panelH + (h - panelH) * 0.52;
  const rOuter = Math.min(w, h - panelH) * 0.4;
  // metal ring
  ctx.fillStyle = "#aab2ba";
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.2, S * 0.03);
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // tinted glass
  ctx.fillStyle = "#3f5b6e";
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter * 0.66, 0, Math.PI * 2);
  ctx.fill();
  // curved glass highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
  ctx.beginPath();
  ctx.ellipse(
    cx - rOuter * 0.22,
    cy - rOuter * 0.26,
    rOuter * 0.28,
    rOuter * 0.16,
    -0.5,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.restore(); // 80% scale
}

/**
 * A fridge (blocking): tall steel body with a freezer seam in the upper third
 * and two door handles on the left. Same appliance idiom (palette, card,
 * 80% shrink) as the washing machine so the kitchen props read as one family.
 */
export function drawFridge(ctx: Ctx, x: number, y: number, S: number): void {
  ctx.save();
  ctx.translate(x + S / 2, y + S / 2);
  ctx.scale(0.8, 0.8);
  ctx.translate(-(x + S / 2), -(y + S / 2));
  // taller than wide — pinch the sides so it reads as an upright appliance
  const left = x + S * 0.18;
  const top = y + S * 0.07;
  const w = S - 2 * (S * 0.18);
  const h = S - 2 * (S * 0.07);
  const body = "#e9edf1";
  const dark = "#4b535c";

  // body with the shared appliance outline
  ctx.fillStyle = body;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.4, S * 0.05);
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, S * 0.07);
  ctx.fill();
  ctx.stroke();

  // freezer compartment seam (upper third)
  const seamY = top + h * 0.34;
  ctx.lineWidth = Math.max(1, S * 0.02);
  ctx.beginPath();
  ctx.moveTo(left, seamY);
  ctx.lineTo(left + w, seamY);
  ctx.stroke();

  // door handles on the left edge: short bar (freezer) + long bar (fridge)
  ctx.fillStyle = "#5a6068";
  const handleW = Math.max(1.6, w * 0.09);
  const handleX = left + w * 0.12;
  ctx.beginPath();
  ctx.roundRect(handleX, top + h * 0.1, handleW, h * 0.16, handleW / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(handleX, seamY + h * 0.08, handleW, h * 0.3, handleW / 2);
  ctx.fill();

  // soft vertical sheen on the right, like light off brushed steel
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.roundRect(left + w * 0.68, top + h * 0.07, w * 0.13, h * 0.86, w * 0.07);
  ctx.fill();

  ctx.restore(); // 80% scale
}

/**
 * A standing floor lamp (blocking): a weighted base, a slim pole and a glowing
 * trapezoid shade. Drawn front-on like the other blocking props; sits on the card.
 */
export function drawFloorLamp(ctx: Ctx, x: number, y: number, S: number): void {
  ctx.save();
  ctx.translate(x + S / 2, y + S / 2);
  ctx.scale(0.8, 0.8);
  ctx.translate(-(x + S / 2), -(y + S / 2));
  const cx = x + S / 2;
  const dark = "#3a2f25";

  // weighted base
  ctx.fillStyle = "#6b543b";
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, S * 0.025);
  ctx.beginPath();
  ctx.ellipse(cx, y + S * 0.82, S * 0.16, S * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // pole
  ctx.fillStyle = "#9a7c56";
  ctx.beginPath();
  ctx.rect(cx - S * 0.02, y + S * 0.34, S * 0.04, S * 0.46);
  ctx.fill();
  ctx.stroke();

  // soft pool of light under the shade
  ctx.fillStyle = "rgba(255, 214, 130, 0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, y + S * 0.36, S * 0.2, S * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // trapezoid shade with a warm vertical gradient
  const topW = S * 0.16;
  const botW = S * 0.3;
  const shTop = y + S * 0.13;
  const shBot = y + S * 0.36;
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, shTop);
  ctx.lineTo(cx + topW / 2, shTop);
  ctx.lineTo(cx + botW / 2, shBot);
  ctx.lineTo(cx - botW / 2, shBot);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, shTop, 0, shBot);
  grad.addColorStop(0, "#f6e2a8");
  grad.addColorStop(1, "#e3b85f");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, S * 0.028);
  ctx.stroke();

  ctx.restore();
}

/**
 * An upright piano (blocking) seen slightly from above: dark walnut body, a lighter
 * lid surface on top, and a black-and-white keyboard (the 2+3 black-key grouping) across
 * the front. Same framed idiom (card + 82% shrink) as the other furniture.
 */
export function drawPiano(ctx: Ctx, x: number, y: number, S: number): void {
  ctx.save();
  ctx.translate(x + S / 2, y + S / 2);
  ctx.scale(0.82, 0.82);
  ctx.translate(-(x + S / 2), -(y + S / 2));
  const dark = "#241a12";
  const left = x + S * 0.13;
  const top = y + S * 0.13;
  const w = S - 2 * (S * 0.13);
  const h = S - 2 * (S * 0.13);

  // body
  ctx.fillStyle = "#5a3c28";
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.4, S * 0.05);
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, S * 0.06);
  ctx.fill();
  ctx.stroke();

  // lid: a lighter band along the top (the top surface, seen from above)
  ctx.fillStyle = "#6e4c33";
  ctx.beginPath();
  ctx.roundRect(left, top, w, h * 0.3, [S * 0.06, S * 0.06, S * 0.02, S * 0.02]);
  ctx.fill();
  ctx.stroke();

  // keyboard across the front
  const kbX = left + w * 0.07;
  const kbW = w * 0.86;
  const kbY = top + h * 0.55;
  const kbH = h * 0.34;
  ctx.fillStyle = "#f3ecde";
  ctx.beginPath();
  ctx.roundRect(kbX, kbY, kbW, kbH, S * 0.02);
  ctx.fill();
  ctx.stroke();
  // white-key separators
  ctx.strokeStyle = "#9a8f7c";
  ctx.lineWidth = Math.max(0.6, S * 0.012);
  const keys = 7;
  for (let i = 1; i < keys; i++) {
    const kx = kbX + (kbW * i) / keys;
    ctx.beginPath();
    ctx.moveTo(kx, kbY + kbH * 0.18);
    ctx.lineTo(kx, kbY + kbH);
    ctx.stroke();
  }
  // black keys in the iconic 2 + 3 grouping
  ctx.fillStyle = "#1c1822";
  const bw = (kbW / keys) * 0.52;
  for (const p of [1, 2, 4, 5, 6]) {
    ctx.beginPath();
    ctx.roundRect(kbX + (kbW * p) / keys - bw / 2, kbY + kbH * 0.04, bw, kbH * 0.55, bw * 0.2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * A bear (blocking, outdoors) in SIDE PROFILE, facing left — chunky and round: a bulky
 * body, a BIG round head, a SHORT blunt muzzle, four thick legs, eye + nose. The two round
 * ears are drawn BEFORE the head, so the head overlaps their base and they peek out cleanly
 * behind its top. Sits on the white card like the trees/boulders.
 */
export function drawBear(ctx: Ctx, x: number, y: number, S: number): void {
  ctx.save();
  ctx.translate(x + S / 2, y + S / 2);
  ctx.scale(0.96, 0.96);
  ctx.translate(-(x + S / 2), -(y + S / 2));
  const fur = "#6b4423";
  const furDark = "#2c1c10";
  const groundY = y + S * 0.85;
  ctx.strokeStyle = furDark;
  ctx.lineWidth = Math.max(1.2, S * 0.035);
  ctx.lineJoin = "round";

  // far legs (behind, darker)
  ctx.fillStyle = "#4a2f18";
  for (const lx of [0.42, 0.68]) {
    ctx.beginPath();
    ctx.roundRect(x + S * lx, y + S * 0.66, S * 0.12, groundY - (y + S * 0.66), S * 0.05);
    ctx.fill();
    ctx.stroke();
  }
  // chunky body
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(x + S * 0.58, y + S * 0.56, S * 0.28, S * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // near legs (front)
  for (const lx of [0.34, 0.6]) {
    ctx.beginPath();
    ctx.roundRect(x + S * lx, y + S * 0.66, S * 0.13, groundY - (y + S * 0.66), S * 0.055);
    ctx.fill();
    ctx.stroke();
  }
  // EARS FIRST — drawn before the head, so the head then overlaps their base and they
  // peek out behind its top (no floating circles, no donut).
  ctx.fillStyle = fur;
  for (const [ex, ey] of [
    [0.2, 0.29],
    [0.46, 0.29],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + S * ex, y + S * ey, S * 0.078, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // BIG round head, drawn AFTER the ears (covers their base) — overlaps the body, no neck
  ctx.beginPath();
  ctx.arc(x + S * 0.33, y + S * 0.45, S * 0.21, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // small inner ears on the parts that peek out
  ctx.fillStyle = "#9c7850";
  for (const [ex, ey] of [
    [0.18, 0.27],
    [0.48, 0.27],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + S * ex, y + S * ey, S * 0.028, 0, Math.PI * 2);
    ctx.fill();
  }
  // SHORT blunt muzzle (lighter), at the lower front of the head
  ctx.fillStyle = "#a07a52";
  ctx.beginPath();
  ctx.ellipse(x + S * 0.17, y + S * 0.52, S * 0.1, S * 0.085, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // nose at the muzzle tip + eye
  ctx.fillStyle = "#15100b";
  ctx.beginPath();
  ctx.ellipse(x + S * 0.1, y + S * 0.51, S * 0.04, S * 0.034, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + S * 0.31, y + S * 0.4, S * 0.022, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * A shower (occupiable) seen slightly from above: a tiled tray with a drain, and a WIDE
 * shower head on a pipe coming down the back wall, throwing a fan of water streams over
 * the tray. The head + spray are what make it read as a shower. No card (a person stands
 * on it).
 */
export function drawShower(ctx: Ctx, x: number, y: number, S: number): void {
  ctx.save();
  const pad = S * 0.1;
  const left = x + pad;
  const top = y + pad;
  const w = S - 2 * pad;
  const h = S - 2 * pad;
  // tiled tray
  ctx.fillStyle = "#cfe0e8";
  ctx.strokeStyle = "#7e98a0";
  ctx.lineWidth = Math.max(1, S * 0.03);
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, S * 0.08);
  ctx.fill();
  ctx.stroke();
  // tile grout (2×2)
  ctx.strokeStyle = "rgba(126, 152, 160, 0.45)";
  ctx.lineWidth = Math.max(0.6, S * 0.012);
  ctx.beginPath();
  ctx.moveTo(left + w / 2, top);
  ctx.lineTo(left + w / 2, top + h);
  ctx.moveTo(left, top + h / 2);
  ctx.lineTo(left + w, top + h / 2);
  ctx.stroke();
  // drain in the lower tray
  ctx.fillStyle = "#8b9aa0";
  ctx.strokeStyle = "#5a6b72";
  ctx.lineWidth = Math.max(0.8, S * 0.018);
  ctx.beginPath();
  ctx.arc(x + S / 2, y + S * 0.76, S * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // pipe down the back wall to the head
  const headY = y + S * 0.27;
  ctx.strokeStyle = "#8a949b";
  ctx.lineWidth = Math.max(2, S * 0.045);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + S / 2, top + S * 0.01);
  ctx.lineTo(x + S / 2, headY);
  ctx.stroke();
  // wide shower head with nozzle holes
  ctx.fillStyle = "#aab4ba";
  ctx.strokeStyle = "#5a6b72";
  ctx.lineWidth = Math.max(1, S * 0.025);
  ctx.beginPath();
  ctx.ellipse(x + S / 2, headY, S * 0.17, S * 0.065, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#5a6b72";
  for (const dx of [-0.11, -0.055, 0, 0.055, 0.11]) {
    ctx.beginPath();
    ctx.arc(x + S / 2 + dx * S, headY + S * 0.012, S * 0.011, 0, Math.PI * 2);
    ctx.fill();
  }
  // fan of water streams falling from the head
  ctx.strokeStyle = "rgba(90, 170, 205, 0.85)";
  ctx.lineWidth = Math.max(1, S * 0.018);
  ctx.beginPath();
  for (const dx of [-0.12, -0.07, -0.025, 0.025, 0.07, 0.12]) {
    const sx = x + S / 2 + dx * S;
    ctx.moveTo(sx, headY + S * 0.07);
    ctx.lineTo(sx + dx * S * 0.55, headY + S * 0.32);
  }
  ctx.stroke();
  ctx.restore();
}

/** A wooden crate (blocking): a slatted fruit/storage box. Sized for the white card. */
export function drawCrate(ctx: Ctx, x: number, y: number, S: number): void {
  const pad = S * 0.16;
  const left = x + pad;
  const top = y + pad;
  const w = S - 2 * pad;
  const h = S - 2 * pad;
  const wood = "#c39a5e";
  const rail = "#b3853f";
  const gap = "#5a3d22";

  // dark outline + the gap colour showing between the slats
  ctx.fillStyle = gap;
  ctx.beginPath();
  ctx.roundRect(left - S * 0.015, top - S * 0.015, w + S * 0.03, h + S * 0.03, S * 0.04);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, S * 0.03);
  ctx.clip();
  // vertical planks with gaps between them
  const planks = 4;
  const slot = w / planks;
  ctx.fillStyle = wood;
  for (let i = 0; i < planks; i++) {
    ctx.fillRect(left + i * slot + slot * 0.1, top, slot * 0.8, h);
  }
  // top & bottom rails frame the slats
  ctx.fillStyle = rail;
  ctx.fillRect(left, top, w, h * 0.18);
  ctx.fillRect(left, top + h * 0.82, w, h * 0.18);
  // diagonal brace (classic crate)
  ctx.strokeStyle = rail;
  ctx.lineWidth = Math.max(1.5, S * 0.04);
  ctx.beginPath();
  ctx.moveTo(left, top + h * 0.82);
  ctx.lineTo(left + w, top + h * 0.18);
  ctx.stroke();
  ctx.restore();

  // crisp dark border
  ctx.strokeStyle = "#3a2716";
  ctx.lineWidth = Math.max(1.2, S * 0.03);
  ctx.beginPath();
  ctx.roundRect(left, top, w, h, S * 0.03);
  ctx.stroke();
}

/**
 * One cell of an asphalt street/road (occupiable GROUND layer, auto-tiled into one
 * CONTINUOUS run exactly like the carpet rug). Dark tarmac with a faded dashed centre
 * line whose direction follows the road's run (E/W → across, N/S → down); a junction
 * draws solid stubs toward each connected side, an isolated tile a short centre dash.
 */
export function drawStreetTile(ctx: Ctx, x: number, y: number, S: number, conn: Conn): void {
  const pad = S * 0.06;
  const ov = Math.max(0.75, S * 0.02);
  // tarmac base, merged seamlessly with connected neighbours
  ctx.fillStyle = "#43474d";
  piecePath(ctx, x, y, S, conn, pad, S * 0.1, ov);
  ctx.fill();
  // a slightly lighter inner field for a worn-asphalt look
  ctx.fillStyle = "#4d525a";
  piecePath(ctx, x, y, S, conn, pad + S * 0.045, S * 0.08, ov);
  ctx.fill();
  // dashed centre line — orientation follows the run direction
  const horiz = conn.e || conn.w;
  const vert = conn.n || conn.s;
  const cx = x + S / 2;
  const cy = y + S / 2;
  ctx.strokeStyle = "rgba(233, 206, 110, 0.85)"; // faded road-marking yellow
  ctx.lineWidth = Math.max(1.4, S * 0.05);
  ctx.lineCap = "butt";
  ctx.beginPath();
  if (horiz && vert) {
    // junction/turn: solid stubs from the centre toward each connected side
    if (conn.e) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(x + S, cy);
    }
    if (conn.w) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, cy);
    }
    if (conn.n) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, y);
    }
    if (conn.s) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, y + S);
    }
    ctx.stroke();
  } else {
    ctx.setLineDash([S * 0.16, S * 0.12]);
    if (horiz) {
      ctx.moveTo(x, cy);
      ctx.lineTo(x + S, cy);
    } else if (vert) {
      ctx.moveTo(cx, y);
      ctx.lineTo(cx, y + S);
    } else {
      ctx.moveTo(cx - S * 0.18, cy);
      ctx.lineTo(cx + S * 0.18, cy);
    } // isolated
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * One cell of a dirt/gravel PATH (occupiable ground layer, auto-tiled like the street):
 * a trodden earth band with a darker packed edge and flat stepping stones staggered
 * along the run direction — the camping trail and the castle's carriage track.
 */
export function drawPathTile(ctx: Ctx, x: number, y: number, S: number, conn: Conn): void {
  const pad = S * 0.08;
  const ov = Math.max(0.75, S * 0.02);
  // packed-earth edge, merged seamlessly with connected neighbours
  ctx.fillStyle = "#8f6f45";
  piecePath(ctx, x, y, S, conn, pad, S * 0.14, ov);
  ctx.fill();
  // lighter trodden centre
  ctx.fillStyle = "#c2a06b";
  piecePath(ctx, x, y, S, conn, pad + S * 0.05, S * 0.11, ov);
  ctx.fill();
  // flat stepping stones staggered along the run direction (fixed layout per tile)
  const horiz = conn.e || conn.w;
  const vert = conn.n || conn.s;
  const stones: readonly [number, number, number][] =
    vert && !horiz
      ? [
          [0.42, 0.24, 0.4], // [u along-run centre → mapped below]
          [0.6, 0.52, -0.3],
          [0.42, 0.8, 0.2],
        ]
      : [
          [0.24, 0.58, 0.4],
          [0.52, 0.42, -0.3],
          [0.8, 0.58, 0.2],
        ];
  for (const [su, sv, rot] of stones) {
    const sx = x + S * su;
    const sy = y + S * sv;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.fillStyle = "#a98858";
    ctx.beginPath();
    ctx.roundRect(-S * 0.09, -S * 0.06, S * 0.18, S * 0.12, S * 0.045);
    ctx.fill();
    ctx.strokeStyle = "rgba(110, 85, 50, 0.55)";
    ctx.lineWidth = Math.max(0.8, S * 0.016);
    ctx.stroke();
    // light catching the stone's top edge
    ctx.strokeStyle = "rgba(236, 220, 180, 0.6)";
    ctx.beginPath();
    ctx.moveTo(-S * 0.06, -S * 0.045);
    ctx.lineTo(S * 0.05, -S * 0.045);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * A ridge (A-frame) tent seen from a slight front angle — OCCUPIABLE (a person is "in
 * the tent"), so it sits bare on the floor with no blocked card. Two fabric slopes, a
 * dark triangular door flap, and a guy line to a peg give it the camp-tent read.
 */
export function drawTent(ctx: Ctx, x: number, y: number, S: number): void {
  const groundY = y + S * 0.8;
  const apexX = x + S * 0.46;
  const apexY = y + S * 0.2;
  const leftX = x + S * 0.12;
  const frontFootX = x + S * 0.7; // front gable base, right foot
  const backFootX = x + S * 0.9; // far slope foot — gives the 3/4 depth
  // contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.beginPath();
  ctx.ellipse(x + S * 0.5, groundY + S * 0.03, S * 0.4, S * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1f3a2a";
  ctx.lineWidth = Math.max(1.2, S * 0.03);
  // far slope (darker) — the side wall receding back-right
  ctx.fillStyle = "#3f7a4f";
  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(backFootX, groundY);
  ctx.lineTo(frontFootX, groundY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // front gable (lighter) — the triangular face
  ctx.fillStyle = "#57a06a";
  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(frontFootX, groundY);
  ctx.lineTo(leftX, groundY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // door flap (dark opening) in the front gable
  ctx.fillStyle = "#243b2c";
  ctx.beginPath();
  ctx.moveTo(apexX, apexY + S * 0.06);
  ctx.lineTo(x + S * 0.3, groundY);
  ctx.lineTo(x + S * 0.52, groundY);
  ctx.closePath();
  ctx.fill();
  // curled-back flap edge
  ctx.strokeStyle = "#3f6b4c";
  ctx.lineWidth = Math.max(1, S * 0.02);
  ctx.beginPath();
  ctx.moveTo(apexX, apexY + S * 0.06);
  ctx.lineTo(x + S * 0.46, groundY);
  ctx.stroke();
  // guy line + peg at the front-left
  ctx.strokeStyle = "rgba(60,50,40,0.85)";
  ctx.lineWidth = Math.max(1, S * 0.015);
  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(x + S * 0.05, groundY);
  ctx.stroke();
}

/**
 * A campfire (blocking): a ring of stones around crossed logs with rising flames, seen
 * slightly from above. Drawn ring → logs → flames so the fire reads as burning inside
 * the pit. Sits on the white "blocked" card like the other props.
 */
export function drawCampfire(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S / 2;
  const cy = y + S * 0.58;
  // stone ring (drawn first, so logs + flames sit inside it)
  ctx.fillStyle = "#9aa0a6";
  ctx.strokeStyle = "#6c7176";
  ctx.lineWidth = Math.max(1, S * 0.018);
  const ringN = 8;
  for (let i = 0; i < ringN; i++) {
    const a = (i / ringN) * Math.PI * 2 + 0.4;
    const sx = cx + Math.cos(a) * S * 0.28;
    const sy = cy + S * 0.12 + Math.sin(a) * S * 0.13;
    ctx.beginPath();
    ctx.ellipse(sx, sy, S * 0.058, S * 0.044, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // crossed logs
  ctx.strokeStyle = "#6b4a2b";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, S * 0.07);
  ctx.beginPath();
  ctx.moveTo(cx - S * 0.2, cy + S * 0.12);
  ctx.lineTo(cx + S * 0.2, cy - S * 0.02);
  ctx.moveTo(cx + S * 0.2, cy + S * 0.12);
  ctx.lineTo(cx - S * 0.2, cy - S * 0.02);
  ctx.stroke();
  // flames (layered: outer orange → mid amber → inner yellow)
  const flame = (h: number, w: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.quadraticCurveTo(cx + w, cy - h * 0.45, cx + w * 0.5, cy);
    ctx.quadraticCurveTo(cx, cy + S * 0.03, cx - w * 0.5, cy);
    ctx.quadraticCurveTo(cx - w, cy - h * 0.45, cx, cy - h);
    ctx.closePath();
    ctx.fill();
  };
  flame(S * 0.42, S * 0.2, "#e8612b");
  flame(S * 0.3, S * 0.13, "#f6a623");
  flame(S * 0.18, S * 0.07, "#ffe07a");
}

/**
 * A kettle barbecue (blocking): a round black bowl on three splayed legs with a grill
 * grate, glowing coals showing through, a side handle and a wisp of smoke — seen from a
 * slight angle. Sits on the white "blocked" card.
 */
export function drawGrill(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S / 2;
  const bowlY = y + S * 0.46;
  const rx = S * 0.3;
  const ry = S * 0.2;
  // legs
  ctx.strokeStyle = "#3a3f45";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.5, S * 0.035);
  for (const dx of [-0.2, 0.04, 0.22]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * S, bowlY + S * 0.03);
    ctx.lineTo(cx + dx * S * 1.6, y + S * 0.84);
    ctx.stroke();
  }
  // bowl (dark, rounded bottom half)
  ctx.fillStyle = "#26292e";
  ctx.strokeStyle = "#15171a";
  ctx.lineWidth = Math.max(1.2, S * 0.025);
  ctx.beginPath();
  ctx.ellipse(cx, bowlY, rx, ry, 0, 0, Math.PI, false);
  ctx.fill();
  ctx.stroke();
  // grate rim (top ellipse)
  ctx.fillStyle = "#5a6068";
  ctx.beginPath();
  ctx.ellipse(cx, bowlY, rx, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // glowing coals through the grate
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, bowlY, rx * 0.84, ry * 0.44, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#3a3f45";
  ctx.fillRect(cx - rx, bowlY - ry, rx * 2, ry * 2);
  const coals: [number, number, string][] = [
    [-0.13, -0.02, "#e8612b"],
    [0.05, 0.03, "#f6a623"],
    [0.16, -0.04, "#e8612b"],
    [-0.02, 0.05, "#ffd24a"],
  ];
  for (const [gx, gy, col] of coals) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(cx + gx * S, bowlY + gy * S, S * 0.05, S * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // grate bars across the top
  ctx.strokeStyle = "rgba(20,22,25,0.8)";
  ctx.lineWidth = Math.max(1, S * 0.02);
  for (const f of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.86, bowlY + f * ry * 0.5);
    ctx.lineTo(cx + rx * 0.86, bowlY + f * ry * 0.5);
    ctx.stroke();
  }
  // side handle
  ctx.strokeStyle = "#3a3f45";
  ctx.lineWidth = Math.max(1.5, S * 0.03);
  ctx.beginPath();
  ctx.moveTo(cx + rx, bowlY - ry * 0.2);
  ctx.lineTo(cx + rx + S * 0.08, bowlY - ry * 0.32);
  ctx.stroke();
  // a wisp of smoke
  ctx.strokeStyle = "rgba(200,200,200,0.5)";
  ctx.lineWidth = Math.max(1, S * 0.018);
  ctx.beginPath();
  ctx.moveTo(cx, bowlY - ry * 0.4);
  ctx.quadraticCurveTo(cx + S * 0.08, y + S * 0.22, cx - S * 0.02, y + S * 0.1);
  ctx.stroke();
}

/**
 * A haystack (blocking): a plump, hand-stacked golden mound with a slightly crooked
 * crown — sunlit on the left, warm shadow on the right, sweeping layer curves that
 * follow the dome, loose straw ticks all over and a few flyaway strands (with tiny
 * seed heads) poking out of the silhouette. Sits on the white "blocked" card.
 */
export function drawHaystack(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S / 2;
  const baseY = y + S * 0.84;
  const rx = S * 0.36; // mound half-width
  const topY = y + S * 0.17; // crown height

  // ground shadow
  ctx.fillStyle = "rgba(64, 46, 12, 0.16)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY, rx * 1.06, S * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  // mound silhouette: a bumpy dome with a slightly tilted crown (hand-stacked, not a
  // perfect arc) — built once as a Path2D so the fill, the clipped shading and the
  // outline all share the exact same shape.
  const dome = new Path2D();
  dome.moveTo(cx - rx, baseY);
  dome.quadraticCurveTo(cx - rx * 1.04, y + S * 0.56, cx - rx * 0.72, y + S * 0.38);
  dome.quadraticCurveTo(cx - rx * 0.52, y + S * 0.24, cx - S * 0.05, topY);
  dome.quadraticCurveTo(cx + rx * 0.38, y + S * 0.13, cx + rx * 0.58, y + S * 0.35);
  dome.quadraticCurveTo(cx + rx * 1.03, y + S * 0.58, cx + rx, baseY);
  dome.closePath();
  ctx.fillStyle = "#e3b254";
  ctx.fill(dome);

  ctx.save();
  ctx.clip(dome);
  // sunlit upper-left flank
  ctx.fillStyle = "rgba(255, 224, 129, 0.6)";
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.38, y + S * 0.4, rx * 0.56, S * 0.28, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // warm shaded lower-right flank
  ctx.fillStyle = "rgba(148, 96, 24, 0.3)";
  ctx.beginPath();
  ctx.ellipse(cx + rx * 0.55, y + S * 0.62, rx * 0.62, S * 0.3, 0.35, 0, Math.PI * 2);
  ctx.fill();
  // sweeping layer curves — the stacked-in-passes look
  ctx.strokeStyle = "rgba(138, 100, 32, 0.5)";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, S * 0.02);
  for (const [ly, sag] of [
    [0.4, 0.07],
    [0.56, 0.05],
    [0.71, 0.04],
  ] as const) {
    const w = rx * (0.62 + ly * 0.55); // wider sweeps toward the base
    ctx.beginPath();
    ctx.moveTo(cx - w, y + S * ly);
    ctx.quadraticCurveTo(cx, y + S * (ly + sag), cx + w, y + S * ly);
    ctx.stroke();
  }
  // loose straw ticks scattered over the flanks (fixed table → identical stacks)
  const ticks: readonly [number, number, number, number][] = [
    // [u across, v down, angle, light?]  (u,v in mound-local fractions)
    [-0.62, 0.62, 2.6, 0],
    [-0.4, 0.44, 2.2, 1],
    [-0.18, 0.7, 2.9, 0],
    [0.05, 0.5, 0.5, 1],
    [0.28, 0.66, 0.4, 0],
    [0.5, 0.5, 0.7, 0],
    [-0.3, 0.78, 2.75, 1],
    [0.16, 0.8, 0.25, 1],
    [0.62, 0.7, 0.55, 1],
    [-0.05, 0.32, 2.4, 0],
  ];
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  for (const [u, v, a, light] of ticks) {
    ctx.strokeStyle = light ? "rgba(255, 232, 150, 0.75)" : "rgba(122, 82, 22, 0.55)";
    const px = cx + u * rx;
    const py = y + v * S * 0.8;
    const L = S * 0.07;
    ctx.beginPath();
    ctx.moveTo(px - Math.cos(a) * L, py - Math.sin(a) * L);
    ctx.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L);
    ctx.stroke();
  }
  ctx.restore();

  // silhouette outline
  ctx.strokeStyle = "#8a6420";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, S * 0.024);
  ctx.stroke(dome);

  // flyaway strands out of the crown and flanks, each ending in a tiny seed head
  const strands: readonly [number, number, number, number][] = [
    // [x0, y0, x1, y1] in cell fractions
    [0.42, 0.2, 0.34, 0.09],
    [0.52, 0.17, 0.56, 0.06],
    [0.6, 0.22, 0.7, 0.12],
    [0.17, 0.42, 0.07, 0.36],
    [0.84, 0.46, 0.93, 0.4],
  ];
  ctx.strokeStyle = "#b98a2e";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(0.9, S * 0.018);
  for (const [x0, y0, x1, y1] of strands) {
    ctx.beginPath();
    ctx.moveTo(x + x0 * S, y + y0 * S);
    ctx.quadraticCurveTo(
      x + (x0 + x1) * S * 0.5,
      y + Math.min(y0, y1) * S - S * 0.02,
      x + x1 * S,
      y + y1 * S,
    );
    ctx.stroke();
    ctx.fillStyle = "#8a6420";
    ctx.beginPath();
    ctx.ellipse(
      x + x1 * S,
      y + y1 * S,
      S * 0.017,
      S * 0.011,
      Math.atan2(y1 - y0, x1 - x0),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/**
 * A candelabra (blocking): a brass three-arm stand on a round foot, cream candles of
 * uneven height with warm flames and a soft glow — castle mood lighting. On the card.
 */
export function drawCandelabrum(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S / 2;
  const baseY = y + S * 0.84;
  // contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY + S * 0.02, S * 0.2, S * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  const brass = "#b8892f";
  const brassDark = "#7e5c1c";
  ctx.strokeStyle = brass;
  ctx.lineCap = "round";
  // round foot + stem
  ctx.fillStyle = brass;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, S * 0.13, S * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(1.6, S * 0.045);
  ctx.beginPath();
  ctx.moveTo(cx, baseY);
  ctx.lineTo(cx, y + S * 0.52);
  ctx.stroke();
  // two curved arms + straight centre riser
  ctx.lineWidth = Math.max(1.3, S * 0.035);
  ctx.beginPath();
  ctx.moveTo(cx, y + S * 0.56);
  ctx.quadraticCurveTo(cx - S * 0.22, y + S * 0.56, cx - S * 0.2, y + S * 0.4);
  ctx.moveTo(cx, y + S * 0.56);
  ctx.quadraticCurveTo(cx + S * 0.22, y + S * 0.56, cx + S * 0.2, y + S * 0.4);
  ctx.moveTo(cx, y + S * 0.52);
  ctx.lineTo(cx, y + S * 0.34);
  ctx.stroke();
  // drip pans
  ctx.fillStyle = brassDark;
  for (const [dx, dy] of [
    [-0.2, 0.4],
    [0, 0.34],
    [0.2, 0.4],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(cx + dx * S, y + dy * S, S * 0.055, S * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // candles (centre one taller) + flames with glow
  const candle = (dx: number, dy: number, h: number): void => {
    const px = cx + dx * S;
    const topY = y + (dy - h) * S;
    ctx.fillStyle = "#f3ead2";
    ctx.strokeStyle = "#c9bb9a";
    ctx.lineWidth = Math.max(0.8, S * 0.014);
    ctx.beginPath();
    ctx.roundRect(px - S * 0.035, topY, S * 0.07, h * S, S * 0.015);
    ctx.fill();
    ctx.stroke();
    // glow halo, then teardrop flame
    ctx.fillStyle = "rgba(255, 196, 64, 0.28)";
    ctx.beginPath();
    ctx.arc(px, topY - S * 0.055, S * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6a623";
    ctx.beginPath();
    ctx.moveTo(px, topY - S * 0.115);
    ctx.quadraticCurveTo(px + S * 0.038, topY - S * 0.04, px, topY - S * 0.005);
    ctx.quadraticCurveTo(px - S * 0.038, topY - S * 0.04, px, topY - S * 0.115);
    ctx.fill();
    ctx.fillStyle = "#ffe07a";
    ctx.beginPath();
    ctx.ellipse(px, topY - S * 0.045, S * 0.016, S * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  candle(-0.2, 0.4, 0.14);
  candle(0.2, 0.4, 0.17);
  candle(0, 0.34, 0.15);
}

/**
 * A stone fireplace (blocking): a grey block surround with a mantel shelf, an arched
 * firebox glowing with layered flames over a log, and two small flanking stones.
 * NOT the campfire — this is the built-in, indoor hearth. Sits on the card.
 */
export function drawFireplace(ctx: Ctx, x: number, y: number, S: number): void {
  const left = x + S * 0.14;
  const w = S * 0.72;
  const top = y + S * 0.2;
  const baseY = y + S * 0.86;
  ctx.lineJoin = "round";
  // stone body
  ctx.fillStyle = "#9aa0a6";
  ctx.strokeStyle = "#5f646a";
  ctx.lineWidth = Math.max(1.2, S * 0.028);
  ctx.beginPath();
  ctx.roundRect(left, top + S * 0.06, w, baseY - top - S * 0.06, S * 0.03);
  ctx.fill();
  ctx.stroke();
  // mantel shelf (wider than the body)
  ctx.fillStyle = "#b4bac0";
  ctx.beginPath();
  ctx.roundRect(left - S * 0.05, top, w + S * 0.1, S * 0.09, S * 0.02);
  ctx.fill();
  ctx.stroke();
  // block joints on the surround
  ctx.strokeStyle = "rgba(70, 74, 80, 0.55)";
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  ctx.beginPath();
  for (const fy of [0.42, 0.62]) {
    ctx.moveTo(left, y + fy * S);
    ctx.lineTo(left + S * 0.12, y + fy * S);
    ctx.moveTo(left + w - S * 0.12, y + fy * S);
    ctx.lineTo(left + w, y + fy * S);
  }
  ctx.moveTo(left + S * 0.06, top + S * 0.15);
  ctx.lineTo(left + S * 0.06, baseY);
  ctx.moveTo(left + w - S * 0.06, top + S * 0.15);
  ctx.lineTo(left + w - S * 0.06, baseY);
  ctx.stroke();
  // arched firebox opening
  const fx = x + S / 2;
  const fw = S * 0.22;
  ctx.fillStyle = "#241d18";
  ctx.beginPath();
  ctx.moveTo(fx - fw, baseY);
  ctx.lineTo(fx - fw, y + S * 0.5);
  ctx.quadraticCurveTo(fx, y + S * 0.34, fx + fw, y + S * 0.5);
  ctx.lineTo(fx + fw, baseY);
  ctx.closePath();
  ctx.fill();
  // log + layered flames (clipped to the opening)
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "#6b4a2b";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, S * 0.06);
  ctx.beginPath();
  ctx.moveTo(fx - fw * 0.75, baseY - S * 0.05);
  ctx.lineTo(fx + fw * 0.75, baseY - S * 0.05);
  ctx.stroke();
  const flame = (h: number, w2: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fx, baseY - h);
    ctx.quadraticCurveTo(fx + w2, baseY - h * 0.4, fx + w2 * 0.5, baseY - S * 0.04);
    ctx.quadraticCurveTo(fx, baseY, fx - w2 * 0.5, baseY - S * 0.04);
    ctx.quadraticCurveTo(fx - w2, baseY - h * 0.4, fx, baseY - h);
    ctx.closePath();
    ctx.fill();
  };
  flame(S * 0.3, S * 0.13, "#e8612b");
  flame(S * 0.21, S * 0.085, "#f6a623");
  flame(S * 0.12, S * 0.045, "#ffe07a");
  ctx.restore();
}

/**
 * A wooden barrel (blocking): upright, bulging staves, two iron hoops and a lighter
 * elliptical lid with a bunghole — cellar, tavern and harbour stock. On the card.
 */
export function drawBarrel(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S / 2;
  const topY = y + S * 0.24;
  const botY = y + S * 0.82;
  const rTop = S * 0.24;
  const bulge = S * 0.31;
  // contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.beginPath();
  ctx.ellipse(cx, botY + S * 0.035, S * 0.28, S * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  // body (bulged sides)
  ctx.fillStyle = "#a9743c";
  ctx.strokeStyle = "#5e4326";
  ctx.lineWidth = Math.max(1.2, S * 0.03);
  ctx.beginPath();
  ctx.moveTo(cx - rTop, topY);
  ctx.quadraticCurveTo(cx - bulge, (topY + botY) / 2, cx - rTop, botY);
  ctx.ellipse(cx, botY, rTop, S * 0.06, 0, Math.PI, 0, true);
  ctx.quadraticCurveTo(cx + bulge, (topY + botY) / 2, cx + rTop, topY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // stave joints
  ctx.strokeStyle = "rgba(94, 67, 38, 0.55)";
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  for (const f of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(cx + f * rTop * 1.4, topY + S * 0.04);
    ctx.quadraticCurveTo(
      cx + f * bulge * 1.35,
      (topY + botY) / 2,
      cx + f * rTop * 1.4,
      botY - S * 0.02,
    );
    ctx.stroke();
  }
  // iron hoops
  ctx.strokeStyle = "#3e4249";
  ctx.lineWidth = Math.max(1.6, S * 0.045);
  for (const fy of [0.4, 0.66]) {
    const yy = y + fy * S;
    const t = Math.abs(yy - (topY + botY) / 2) / ((botY - topY) / 2);
    const r = rTop + (bulge - rTop) * (1 - t * t);
    ctx.beginPath();
    ctx.moveTo(cx - r, yy);
    ctx.quadraticCurveTo(cx, yy + S * 0.05, cx + r, yy);
    ctx.stroke();
  }
  // lid
  ctx.fillStyle = "#c99a5e";
  ctx.strokeStyle = "#5e4326";
  ctx.lineWidth = Math.max(1, S * 0.024);
  ctx.beginPath();
  ctx.ellipse(cx, topY, rTop, S * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#5e4326";
  ctx.beginPath();
  ctx.ellipse(cx + S * 0.07, topY, S * 0.028, S * 0.016, 0, 0, Math.PI * 2);
  ctx.fill();
  // side highlight
  ctx.strokeStyle = "rgba(255, 226, 170, 0.4)";
  ctx.lineWidth = Math.max(1, S * 0.022);
  ctx.beginPath();
  ctx.moveTo(cx - rTop * 0.72, topY + S * 0.1);
  ctx.quadraticCurveTo(cx - bulge * 0.72, (topY + botY) / 2, cx - rTop * 0.72, botY - S * 0.04);
  ctx.stroke();
}

/**
 * A suit of armor (blocking): polished plate on a plinth — plumed great helm with a
 * dark visor slit, riveted breastplate, pauldrons, and a halberd held upright.
 */
export function drawArmor(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S * 0.46;
  const steel = "#c3cad3";
  const steelDark = "#8a93a0";
  const line = "#4a505a";
  ctx.lineJoin = "round";
  // plinth
  ctx.fillStyle = "#9aa0a6";
  ctx.strokeStyle = "#5f646a";
  ctx.lineWidth = Math.max(1, S * 0.024);
  ctx.beginPath();
  ctx.roundRect(x + S * 0.2, y + S * 0.8, S * 0.52, S * 0.09, S * 0.02);
  ctx.fill();
  ctx.stroke();
  // halberd: shaft + blade (behind the figure, held to the right)
  ctx.strokeStyle = "#6b4a2b";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.4, S * 0.032);
  ctx.beginPath();
  ctx.moveTo(x + S * 0.78, y + S * 0.82);
  ctx.lineTo(x + S * 0.78, y + S * 0.18);
  ctx.stroke();
  ctx.fillStyle = steel;
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.9, S * 0.018);
  ctx.beginPath();
  ctx.moveTo(x + S * 0.78, y + S * 0.1);
  ctx.quadraticCurveTo(x + S * 0.63, y + S * 0.16, x + S * 0.78, y + S * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // legs
  ctx.strokeStyle = steelDark;
  ctx.lineWidth = Math.max(2, S * 0.055);
  ctx.beginPath();
  ctx.moveTo(cx - S * 0.07, y + S * 0.6);
  ctx.lineTo(cx - S * 0.08, y + S * 0.8);
  ctx.moveTo(cx + S * 0.07, y + S * 0.6);
  ctx.lineTo(cx + S * 0.08, y + S * 0.8);
  ctx.stroke();
  // breastplate
  ctx.fillStyle = steel;
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(1, S * 0.022);
  ctx.beginPath();
  ctx.moveTo(cx - S * 0.14, y + S * 0.36);
  ctx.quadraticCurveTo(cx - S * 0.16, y + S * 0.52, cx - S * 0.06, y + S * 0.62);
  ctx.lineTo(cx + S * 0.06, y + S * 0.62);
  ctx.quadraticCurveTo(cx + S * 0.16, y + S * 0.52, cx + S * 0.14, y + S * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // waist line + rivets
  ctx.strokeStyle = "rgba(74, 80, 90, 0.5)";
  ctx.lineWidth = Math.max(0.8, S * 0.014);
  ctx.beginPath();
  ctx.moveTo(cx - S * 0.11, y + S * 0.5);
  ctx.quadraticCurveTo(cx, y + S * 0.54, cx + S * 0.11, y + S * 0.5);
  ctx.stroke();
  ctx.fillStyle = line;
  for (const dx of [-0.07, 0, 0.07]) {
    ctx.beginPath();
    ctx.arc(cx + dx * S, y + S * 0.42, S * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  // arms: the left hangs at the side, the right reaches out and grips the halberd
  ctx.strokeStyle = steelDark;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, S * 0.05);
  ctx.beginPath();
  ctx.moveTo(cx - S * 0.16, y + S * 0.42);
  ctx.quadraticCurveTo(cx - S * 0.22, y + S * 0.5, cx - S * 0.2, y + S * 0.58);
  ctx.moveTo(cx + S * 0.16, y + S * 0.42);
  ctx.quadraticCurveTo(cx + S * 0.26, y + S * 0.46, x + S * 0.75, y + S * 0.52);
  ctx.stroke();
  // gauntlets (fists): one hanging, one closed around the shaft
  ctx.fillStyle = steel;
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.9, S * 0.018);
  for (const [gx, gy] of [
    [cx - S * 0.2, y + S * 0.6],
    [x + S * 0.78, y + S * 0.52],
  ] as const) {
    ctx.beginPath();
    ctx.arc(gx, gy, S * 0.038, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // pauldrons
  ctx.fillStyle = steelDark;
  ctx.strokeStyle = line;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      cx + side * S * 0.17,
      y + S * 0.38,
      S * 0.07,
      S * 0.055,
      side * 0.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
  }
  // great helm + visor slit + plume
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.roundRect(cx - S * 0.09, y + S * 0.17, S * 0.18, S * 0.17, S * 0.06);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#2c3038";
  ctx.lineWidth = Math.max(1.2, S * 0.026);
  ctx.beginPath();
  ctx.moveTo(cx - S * 0.055, y + S * 0.245);
  ctx.lineTo(cx + S * 0.055, y + S * 0.245);
  ctx.stroke();
  ctx.strokeStyle = "#a03c30"; // crimson plume
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.6, S * 0.04);
  ctx.beginPath();
  ctx.moveTo(cx, y + S * 0.17);
  ctx.quadraticCurveTo(cx + S * 0.02, y + S * 0.08, cx + S * 0.12, y + S * 0.07);
  ctx.stroke();
}

/**
 * A throne (occupiable — one SITS on it): a tall gilded high-back with pointed
 * finials, crimson velvet seat and back, and sturdy armrests. No card (a seat).
 */
export function drawThrone(ctx: Ctx, x: number, y: number, S: number): void {
  const gold = "#c9a13c";
  const goldDark = "#8a6420";
  const velvet = "#9e2f33";
  const velvetLight = "#bd4a4a";
  // contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.beginPath();
  ctx.ellipse(x + S / 2, y + S * 0.82, S * 0.3, S * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineJoin = "round";
  // tall back (gold frame)
  ctx.fillStyle = gold;
  ctx.strokeStyle = goldDark;
  ctx.lineWidth = Math.max(1.2, S * 0.028);
  ctx.beginPath();
  ctx.roundRect(x + S * 0.24, y + S * 0.1, S * 0.52, S * 0.56, S * 0.07);
  ctx.fill();
  ctx.stroke();
  // finials: two side points + centre orb
  ctx.fillStyle = gold;
  for (const dx of [-0.22, 0.22]) {
    ctx.beginPath();
    ctx.moveTo(x + S * (0.5 + dx) - S * 0.045, y + S * 0.12);
    ctx.lineTo(x + S * (0.5 + dx), y + S * 0.03);
    ctx.lineTo(x + S * (0.5 + dx) + S * 0.045, y + S * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x + S * 0.5, y + S * 0.07, S * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // velvet back panel with button tufts
  ctx.fillStyle = velvet;
  ctx.beginPath();
  ctx.roundRect(x + S * 0.3, y + S * 0.16, S * 0.4, S * 0.44, S * 0.05);
  ctx.fill();
  ctx.fillStyle = velvetLight;
  for (const [dx, dy] of [
    [-0.08, 0.26],
    [0.08, 0.26],
    [0, 0.36],
    [-0.08, 0.46],
    [0.08, 0.46],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + S * (0.5 + dx), y + S * dy, S * 0.014, 0, Math.PI * 2);
    ctx.fill();
  }
  // seat cushion
  ctx.fillStyle = velvet;
  ctx.strokeStyle = goldDark;
  ctx.beginPath();
  ctx.roundRect(x + S * 0.22, y + S * 0.6, S * 0.56, S * 0.14, S * 0.05);
  ctx.fill();
  ctx.stroke();
  // armrests + front legs
  ctx.fillStyle = gold;
  for (const side of [0, 1]) {
    const ax = x + S * (0.16 + side * 0.6);
    ctx.beginPath();
    ctx.roundRect(ax, y + S * 0.52, S * 0.08, S * 0.24, S * 0.03);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(ax + S * 0.005, y + S * 0.76, S * 0.07, S * 0.1, S * 0.02);
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * A weapon rack (blocking): a dark oak stand holding a sword, a battle axe and a
 * spear in its slots — armory furniture (castles and police lock-ups alike).
 */
export function drawWeaponRack(ctx: Ctx, x: number, y: number, S: number): void {
  const wood = "#7a5230";
  const woodDark = "#4c331d";
  const steel = "#c3cad3";
  const line = "#4a505a";
  ctx.lineJoin = "round";
  // frame: two posts + top and bottom rails
  ctx.fillStyle = wood;
  ctx.strokeStyle = woodDark;
  ctx.lineWidth = Math.max(1, S * 0.022);
  for (const fx of [0.14, 0.78]) {
    ctx.beginPath();
    ctx.roundRect(x + S * fx, y + S * 0.14, S * 0.08, S * 0.72, S * 0.02);
    ctx.fill();
    ctx.stroke();
  }
  for (const fy of [0.2, 0.74]) {
    ctx.beginPath();
    ctx.roundRect(x + S * 0.14, y + S * fy, S * 0.72, S * 0.07, S * 0.02);
    ctx.fill();
    ctx.stroke();
  }
  // sword: blade, crossguard, grip
  const sx = x + S * 0.32;
  ctx.fillStyle = steel;
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  ctx.beginPath();
  ctx.moveTo(sx - S * 0.025, y + S * 0.34);
  ctx.lineTo(sx, y + S * 0.8);
  ctx.lineTo(sx + S * 0.025, y + S * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#8a6420";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.4, S * 0.032);
  ctx.beginPath();
  ctx.moveTo(sx - S * 0.07, y + S * 0.34);
  ctx.lineTo(sx + S * 0.07, y + S * 0.34);
  ctx.stroke();
  ctx.strokeStyle = "#5b3a20";
  ctx.beginPath();
  ctx.moveTo(sx, y + S * 0.33);
  ctx.lineTo(sx, y + S * 0.24);
  ctx.stroke();
  // battle axe: shaft + crescent blade
  const axx = x + S * 0.52;
  ctx.strokeStyle = "#6b4a2b";
  ctx.lineWidth = Math.max(1.3, S * 0.03);
  ctx.beginPath();
  ctx.moveTo(axx, y + S * 0.26);
  ctx.lineTo(axx, y + S * 0.8);
  ctx.stroke();
  ctx.fillStyle = steel;
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  ctx.beginPath();
  ctx.moveTo(axx, y + S * 0.3);
  ctx.quadraticCurveTo(axx + S * 0.16, y + S * 0.3, axx + S * 0.14, y + S * 0.44);
  ctx.quadraticCurveTo(axx + S * 0.06, y + S * 0.4, axx, y + S * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // spear: long shaft + leaf tip
  const px = x + S * 0.68;
  ctx.strokeStyle = "#6b4a2b";
  ctx.lineWidth = Math.max(1.1, S * 0.025);
  ctx.beginPath();
  ctx.moveTo(px, y + S * 0.3);
  ctx.lineTo(px, y + S * 0.8);
  ctx.stroke();
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.moveTo(px, y + S * 0.16);
  ctx.quadraticCurveTo(px + S * 0.045, y + S * 0.24, px, y + S * 0.31);
  ctx.quadraticCurveTo(px - S * 0.045, y + S * 0.24, px, y + S * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * A sun lounger from ABOVE (occupiable — one lies on it): a slim pale frame, teal
 * fabric with cream cross-stripes, a white head cushion and the backrest fold line —
 * the same clean top-down language as the parasol and hot tub. No card (a seat).
 */
export function drawDeckchair(ctx: Ctx, x: number, y: number, S: number): void {
  ctx.lineJoin = "round";
  const fx = x + S * 0.27;
  const fy = y + S * 0.08;
  const fw = S * 0.46;
  const fh = S * 0.84;
  // offset contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.13)";
  ctx.beginPath();
  ctx.roundRect(fx + S * 0.035, fy + S * 0.045, fw, fh, S * 0.1);
  ctx.fill();
  // pale wooden frame
  ctx.fillStyle = "#e6dcc3";
  ctx.strokeStyle = "#9a8f74";
  ctx.lineWidth = Math.max(1, S * 0.022);
  ctx.beginPath();
  ctx.roundRect(fx, fy, fw, fh, S * 0.1);
  ctx.fill();
  ctx.stroke();
  // fabric panel
  const pad = S * 0.045;
  const cloth = new Path2D();
  cloth.roundRect(fx + pad, fy + pad, fw - 2 * pad, fh - 2 * pad, S * 0.07);
  ctx.fillStyle = "#2fa3a3";
  ctx.fill(cloth);
  ctx.save();
  ctx.clip(cloth);
  // cream cross-stripes
  ctx.strokeStyle = "rgba(246, 240, 226, 0.9)";
  ctx.lineWidth = Math.max(1.6, S * 0.05);
  ctx.beginPath();
  for (const t of [0.3, 0.46, 0.62, 0.78]) {
    ctx.moveTo(fx, y + t * S);
    ctx.lineTo(fx + fw, y + t * S);
  }
  ctx.stroke();
  // gentle side shading so the fabric reads slung, not flat
  ctx.fillStyle = "rgba(23, 105, 107, 0.25)";
  ctx.fillRect(fx, fy, pad * 1.6, fh);
  ctx.fillRect(fx + fw - pad * 1.6, fy, pad * 1.6, fh);
  ctx.restore();
  // backrest hinge (fold line)
  ctx.strokeStyle = "rgba(23, 105, 107, 0.7)";
  ctx.lineWidth = Math.max(1, S * 0.024);
  ctx.beginPath();
  ctx.moveTo(fx + pad, y + S * 0.38);
  ctx.lineTo(fx + fw - pad, y + S * 0.38);
  ctx.stroke();
  // head cushion (top end)
  ctx.fillStyle = "#f6f3ea";
  ctx.strokeStyle = "#b9b099";
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  ctx.beginPath();
  ctx.roundRect(fx + fw * 0.16, fy + S * 0.05, fw * 0.68, S * 0.13, S * 0.04);
  ctx.fill();
  ctx.stroke();
}

/**
 * A parasol seen from ABOVE (occupiable — one stands in its shade): a big scalloped
 * canopy of alternating red/cream wedges around a centre pole cap, with an offset
 * shadow. Top-down so a person drawn on the tile reads as standing UNDER it.
 */
export function drawParasol(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S * 0.5;
  const cy = y + S * 0.5;
  const r = S * 0.4;
  // offset canopy shadow
  ctx.fillStyle = "rgba(0,0,0,0.13)";
  ctx.beginPath();
  ctx.arc(cx + S * 0.06, cy + S * 0.07, r * 0.94, 0, Math.PI * 2);
  ctx.fill();
  // eight wedges, alternating colours
  const wedges = 8;
  for (let k = 0; k < wedges; k++) {
    const a0 = (k / wedges) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((k + 1) / wedges) * Math.PI * 2 - Math.PI / 2;
    ctx.fillStyle = k % 2 === 0 ? "#d4453a" : "#f6efe0";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  // scalloped rim: a small bump at the middle of each wedge edge
  ctx.strokeStyle = "#8f2b23";
  ctx.lineWidth = Math.max(1, S * 0.022);
  ctx.beginPath();
  for (let k = 0; k < wedges; k++) {
    const a0 = (k / wedges) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((k + 1) / wedges) * Math.PI * 2 - Math.PI / 2;
    const mid = (a0 + a1) / 2;
    ctx.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
    ctx.quadraticCurveTo(
      cx + Math.cos(mid) * r * 1.1,
      cy + Math.sin(mid) * r * 1.1,
      cx + Math.cos(a1) * r,
      cy + Math.sin(a1) * r,
    );
  }
  ctx.stroke();
  // seam lines + centre pole cap
  ctx.strokeStyle = "rgba(143, 43, 35, 0.5)";
  ctx.lineWidth = Math.max(0.8, S * 0.014);
  ctx.beginPath();
  for (let k = 0; k < wedges; k++) {
    const a = (k / wedges) * Math.PI * 2 - Math.PI / 2;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.fillStyle = "#8f2b23";
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6efe0";
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.02, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * A slide, side view (occupiable — one sits on it): ladder up to a small platform on
 * the left, then ONE STRAIGHT chute down to the run-out on the right — no swoosh.
 * One type, two looks (the caller checks the surroundings): `water` = the blue lido
 * slide splashing into the pool; otherwise the red-and-yellow playground slide.
 * `exitLeft` mirrors the whole drawing so the chute can face a pool to the west.
 */
export function drawSlide(
  ctx: Ctx,
  x: number,
  y: number,
  S: number,
  water = false,
  exitLeft = false,
): void {
  ctx.save();
  if (exitLeft) {
    // mirror about the cell's vertical centre line
    ctx.translate(x + S / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + S / 2), 0);
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const groundY = y + S * 0.84;
  // The water slide flume is warm ORANGE, not blue — a blue chute vanishes on the
  // blue pool water. Orange pops on that ground and stays distinct from the red-and-
  // yellow playground slide. (Playground palette unchanged.)
  const rail = water ? "#b8560f" : "#a3721d";
  const ladder = water ? "#8d9298" : "#e8b93c";
  const bedCol = water ? "#f2812e" : "#d4453a";
  const bedLite = water ? "#ffc078" : "#e8756b";

  // contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.13)";
  ctx.beginPath();
  ctx.ellipse(x + S * 0.52, groundY + S * 0.04, S * 0.38, S * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // ladder (left): two stringers + rungs
  const lx = x + S * 0.2;
  ctx.strokeStyle = ladder;
  ctx.lineWidth = Math.max(1.3, S * 0.032);
  ctx.beginPath();
  ctx.moveTo(lx - S * 0.05, groundY);
  ctx.lineTo(lx - S * 0.05, y + S * 0.26);
  ctx.moveTo(lx + S * 0.05, groundY);
  ctx.lineTo(lx + S * 0.05, y + S * 0.26);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, S * 0.022);
  ctx.beginPath();
  for (const fy of [0.38, 0.5, 0.62, 0.74]) {
    ctx.moveTo(lx - S * 0.05, y + fy * S);
    ctx.lineTo(lx + S * 0.05, y + fy * S);
  }
  ctx.stroke();

  // STRAIGHT chute: a parallel band from the platform edge down to the run-out.
  // Perpendicular offset gives the band its width.
  const x0 = x + S * 0.3;
  const y0 = y + S * 0.3;
  const x1 = x + S * 0.86;
  const y1 = y + S * (water ? 0.72 : 0.78);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * S * 0.075; // half-width normal
  const ny = (dx / len) * S * 0.075;
  const bed = new Path2D();
  bed.moveTo(x0 + nx, y0 + ny);
  bed.lineTo(x1 + nx, y1 + ny);
  bed.lineTo(x1 - nx, y1 - ny);
  bed.lineTo(x0 - nx, y0 - ny);
  bed.closePath();
  ctx.fillStyle = bedCol;
  ctx.fill(bed);
  // lighter sliding lane down the middle
  ctx.strokeStyle = bedLite;
  ctx.lineWidth = Math.max(1.6, S * 0.06);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  // rails along both edges
  ctx.strokeStyle = rail;
  ctx.lineWidth = Math.max(1, S * 0.024);
  ctx.beginPath();
  ctx.moveTo(x0 + nx, y0 + ny);
  ctx.lineTo(x1 + nx, y1 + ny);
  ctx.moveTo(x0 - nx, y0 - ny);
  ctx.lineTo(x1 - nx, y1 - ny);
  ctx.stroke();
  // support post under the middle of the chute
  ctx.strokeStyle = ladder;
  ctx.lineWidth = Math.max(1.2, S * 0.028);
  ctx.beginPath();
  ctx.moveTo(x + S * 0.58, y + S * 0.56);
  ctx.lineTo(x + S * 0.58, groundY);
  ctx.stroke();

  // platform bridging ladder and chute start, with a little safety rail
  ctx.fillStyle = water ? "#ffb15a" : "#e8b93c";
  ctx.strokeStyle = rail;
  ctx.lineWidth = Math.max(1, S * 0.022);
  ctx.beginPath();
  ctx.roundRect(x + S * 0.1, y + S * 0.24, S * 0.26, S * 0.08, S * 0.025);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + S * 0.12, y + S * 0.24);
  ctx.lineTo(x + S * 0.12, y + S * 0.12);
  ctx.lineTo(x + S * 0.3, y + S * 0.12);
  ctx.lineTo(x + S * 0.3, y + S * 0.24);
  ctx.stroke();

  if (water) {
    // splash where the chute meets the water
    ctx.strokeStyle = "rgba(191, 230, 246, 0.95)";
    ctx.lineWidth = Math.max(1, S * 0.022);
    ctx.beginPath();
    for (const [a, len2] of [
      [-0.6, 0.08],
      [0, 0.1],
      [0.55, 0.07],
    ] as const) {
      ctx.moveTo(x1, y1 + S * 0.02);
      ctx.lineTo(x1 + Math.sin(a) * len2 * S * 1.4, y1 - Math.cos(a) * len2 * S * 1.6);
    }
    ctx.stroke();
  } else {
    // playground run-out: a short flat lip at the bottom end
    ctx.strokeStyle = bedCol;
    ctx.lineWidth = Math.max(2, S * 0.07);
    ctx.beginPath();
    ctx.moveTo(x1 - S * 0.01, y1 + S * 0.01);
    ctx.lineTo(x1 + S * 0.08, y1 + S * 0.03);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * A diving board from ABOVE (occupiable — one stands on its tip): a chequer-plate
 * base block ANCHORED FLUSH on the pool edge, a pale springboard reaching out over
 * rippling water, grip stripes, a red "jump here" tip. `base` names the wall side
 * the block is mounted on — the board springs toward the opposite side, so with a
 * wall to the EAST one jumps WEST (the caller finds the wall; 'S' when free-standing).
 */
export function drawDivingBoard(
  ctx: Ctx,
  x: number,
  y: number,
  S: number,
  base: "N" | "S" | "W" | "E" = "S",
): void {
  ctx.save();
  // Canonical drawing: base flush at the BOTTOM edge, tip pointing up. Rotate the
  // whole cell so the base lands on the requested wall side.
  const theta = { S: 0, W: Math.PI / 2, N: Math.PI, E: (3 * Math.PI) / 2 }[base];
  if (theta) {
    ctx.translate(x + S / 2, y + S / 2);
    ctx.rotate(theta);
    ctx.translate(-(x + S / 2), -(y + S / 2));
  }
  ctx.lineJoin = "round";
  // water ripples around the springing end
  ctx.strokeStyle = "rgba(63, 138, 180, 0.55)";
  ctx.lineWidth = Math.max(1, S * 0.02);
  for (const [fy, w] of [
    [0.1, 0.3],
    [0.22, 0.44],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x + S * (0.5 - w / 2), y + S * fy);
    ctx.quadraticCurveTo(x + S * 0.5, y + S * (fy + 0.05), x + S * (0.5 + w / 2), y + S * fy);
    ctx.stroke();
  }
  // base block: chequer-plate, FLUSH with the bottom cell edge (it sits on the rim,
  // not in the water) — only the water-side corners are rounded.
  ctx.fillStyle = "#9aa0a6";
  ctx.strokeStyle = "#5f646a";
  ctx.lineWidth = Math.max(1, S * 0.024);
  ctx.beginPath();
  ctx.roundRect(x + S * 0.26, y + S * 0.74, S * 0.48, S * 0.26, [S * 0.05, S * 0.05, 0, 0]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (const [dx, dy] of [
    [0.34, 0.8],
    [0.47, 0.86],
    [0.6, 0.8],
    [0.4, 0.93],
    [0.55, 0.93],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + dx * S, y + dy * S, S * 0.014, 0, Math.PI * 2);
    ctx.fill();
  }
  // springboard reaching out over the water, rounded tip
  const bw = S * 0.24;
  ctx.fillStyle = "#eef3f4";
  ctx.strokeStyle = "#7f8b90";
  ctx.lineWidth = Math.max(1, S * 0.022);
  ctx.beginPath();
  ctx.roundRect(x + S * 0.5 - bw / 2, y + S * 0.14, bw, S * 0.66, [S * 0.11, S * 0.11, 0, 0]);
  ctx.fill();
  ctx.stroke();
  // grip stripes
  ctx.strokeStyle = "rgba(127, 139, 144, 0.55)";
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  ctx.beginPath();
  for (const fy of [0.34, 0.45, 0.56, 0.67]) {
    ctx.moveTo(x + S * 0.5 - bw * 0.32, y + fy * S);
    ctx.lineTo(x + S * 0.5 + bw * 0.32, y + fy * S);
  }
  ctx.stroke();
  // tip marking (the "jump here" edge)
  ctx.strokeStyle = "#d4453a";
  ctx.lineWidth = Math.max(1.2, S * 0.028);
  ctx.beginPath();
  ctx.moveTo(x + S * 0.5 - bw * 0.34, y + S * 0.21);
  ctx.quadraticCurveTo(x + S * 0.5, y + S * 0.16, x + S * 0.5 + bw * 0.34, y + S * 0.21);
  ctx.stroke();
  ctx.restore();
}

/**
 * A hot tub from ABOVE (occupiable — one sits IN it): a round wooden stave tub with
 * rope binding, steaming turquoise water with foam bubbles along the rim and a small
 * step pad. Top-down so a person on the tile reads as soaking in the water.
 */
export function drawHottub(ctx: Ctx, x: number, y: number, S: number): void {
  const cx = x + S * 0.5;
  const cy = y + S * 0.52;
  const rOut = S * 0.4;
  // contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.13)";
  ctx.beginPath();
  ctx.arc(cx + S * 0.03, cy + S * 0.04, rOut, 0, Math.PI * 2);
  ctx.fill();
  // wooden rim
  ctx.fillStyle = "#8a5a2b";
  ctx.strokeStyle = "#4c331d";
  ctx.lineWidth = Math.max(1, S * 0.024);
  ctx.beginPath();
  ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // stave joints around the rim
  ctx.strokeStyle = "rgba(76, 51, 29, 0.55)";
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  ctx.beginPath();
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    ctx.moveTo(cx + Math.cos(a) * rOut * 0.78, cy + Math.sin(a) * rOut * 0.78);
    ctx.lineTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
  }
  ctx.stroke();
  // water
  const rIn = rOut * 0.74;
  ctx.fillStyle = "#63c2c9";
  ctx.beginPath();
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
  ctx.fill();
  // foam bubbles hugging the inside of the rim
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.3;
    const rr2 = rIn * (0.78 + 0.08 * ((k * 7) % 3));
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(a) * rr2,
      cy + Math.sin(a) * rr2,
      S * (0.028 + 0.012 * ((k * 5) % 2)),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  // gentle centre ripple
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  ctx.beginPath();
  ctx.arc(cx, cy, rIn * 0.4, 0.4, Math.PI * 1.3);
  ctx.stroke();
  // steam wisps
  ctx.strokeStyle = "rgba(230, 240, 242, 0.6)";
  ctx.lineWidth = Math.max(1, S * 0.02);
  ctx.lineCap = "round";
  for (const dx of [-0.12, 0.08]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * S, cy - rIn * 0.5);
    ctx.quadraticCurveTo(
      cx + (dx + 0.05) * S,
      cy - rOut - S * 0.02,
      cx + (dx - 0.02) * S,
      y + S * 0.03,
    );
    ctx.stroke();
  }
  // step pad at the bottom edge
  ctx.fillStyle = "#6b4a2b";
  ctx.strokeStyle = "#4c331d";
  ctx.lineWidth = Math.max(0.8, S * 0.016);
  ctx.beginPath();
  ctx.roundRect(cx - S * 0.1, y + S * 0.88, S * 0.2, S * 0.08, S * 0.02);
  ctx.fill();
  ctx.stroke();
}

/**
 * A hammock (occupiable — one lies IN it): slung between two wooden posts, a striped
 * cloth sagging in the middle with spread cords at both ends and a fringe. No card.
 */
export function drawHammock(ctx: Ctx, x: number, y: number, S: number): void {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // contact shadows under the posts
  ctx.fillStyle = "rgba(0,0,0,0.13)";
  for (const fx of [0.12, 0.88]) {
    ctx.beginPath();
    ctx.ellipse(x + fx * S, y + S * 0.84, S * 0.09, S * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // posts
  ctx.strokeStyle = "#6b4a2b";
  ctx.lineWidth = Math.max(2, S * 0.055);
  for (const fx of [0.12, 0.88]) {
    ctx.beginPath();
    ctx.moveTo(x + fx * S, y + S * 0.84);
    ctx.lineTo(x + fx * S, y + S * 0.24);
    ctx.stroke();
  }
  // spread cords from each post head to the cloth corners
  ctx.strokeStyle = "#a98547";
  ctx.lineWidth = Math.max(0.9, S * 0.018);
  ctx.beginPath();
  for (const [px, tx] of [
    [0.12, 0.3],
    [0.88, 0.7],
  ] as const) {
    for (const ty of [0.4, 0.5, 0.6]) {
      ctx.moveTo(x + px * S, y + S * 0.28);
      ctx.lineTo(x + tx * S, y + ty * S);
    }
  }
  ctx.stroke();
  // sagging cloth
  const cloth = new Path2D();
  cloth.moveTo(x + S * 0.3, y + S * 0.4);
  cloth.quadraticCurveTo(x + S * 0.5, y + S * 0.56, x + S * 0.7, y + S * 0.4);
  cloth.lineTo(x + S * 0.7, y + S * 0.6);
  cloth.quadraticCurveTo(x + S * 0.5, y + S * 0.78, x + S * 0.3, y + S * 0.6);
  cloth.closePath();
  ctx.fillStyle = "#d9924a";
  ctx.fill(cloth);
  ctx.save();
  ctx.clip(cloth);
  // cream stripes following the sag
  ctx.strokeStyle = "rgba(246, 239, 224, 0.85)";
  ctx.lineWidth = Math.max(1.4, S * 0.04);
  for (const t of [0.38, 0.5, 0.62]) {
    ctx.beginPath();
    ctx.moveTo(x + S * 0.28, y + S * (t - 0.02));
    ctx.quadraticCurveTo(x + S * 0.5, y + S * (t + 0.16), x + S * 0.72, y + S * (t - 0.02));
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = "#8a5a2b";
  ctx.lineWidth = Math.max(0.9, S * 0.02);
  ctx.stroke(cloth);
  // little fringe tassels along the near edge
  ctx.strokeStyle = "#a98547";
  ctx.lineWidth = Math.max(0.8, S * 0.014);
  ctx.beginPath();
  for (const fx of [0.36, 0.44, 0.52, 0.6, 0.68]) {
    const fy = 0.6 + 0.16 * Math.sin(Math.PI * ((fx - 0.3) / 0.4));
    ctx.moveTo(x + fx * S, y + fy * S);
    ctx.lineTo(x + fx * S, y + (fy + 0.05) * S);
  }
  ctx.stroke();
}

/**
 * One cell of a LAKE surface (auto-tiled the way the table/carpet merge): the room's
 * cells fuse into one body of water with rounded outer corners and concave inner corners,
 * leaving the room's grass-green base showing as a bank around the edge. Inside: a calm
 * blue fill, a lighter shallow ring just inside the bank, and a couple of gentle ripples.
 * The room stays a normal (occupiable) room — this only changes how it LOOKS.
 */
export function drawWaterTile(ctx: Ctx, x: number, y: number, S: number, conn: Conn): void {
  const pad = S * 0.13; // grass bank width (about the table's inset, so corners round alike)
  const ov = Math.max(0.75, S * 0.02);
  // deep water, merged into one surface
  ctx.fillStyle = "#4f9ec8";
  piecePath(ctx, x, y, S, conn, pad, S * 0.2, ov);
  ctx.fill();
  // a lighter "shallows" field just inside the bank (its bigger inset lets the darker
  // water line the concave notches as an inline, exactly like the carpet's woven border)
  ctx.fillStyle = "#62b2d8";
  piecePath(ctx, x, y, S, conn, pad + S * 0.06, S * 0.16, ov);
  ctx.fill();
  // gentle ripple lines + a sparkle, clipped to the water so they never spill onto grass
  ctx.save();
  piecePath(ctx, x, y, S, conn, pad, S * 0.2, ov);
  ctx.clip();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = Math.max(1, S * 0.02);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const fy of [0.36, 0.66]) {
    const yy = y + fy * S;
    ctx.moveTo(x + S * 0.16, yy);
    ctx.bezierCurveTo(x + S * 0.38, yy - S * 0.05, x + S * 0.62, yy + S * 0.05, x + S * 0.84, yy);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.ellipse(x + S * 0.7, y + S * 0.3, S * 0.05, S * 0.025, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** One round lily pad with the classic single wedge notch, a green radial sheen, a dark
 *  rim and pale radial veins. `notch` is the direction the V-cut faces (radians). */
function lilyPad(ctx: Ctx, cx: number, cy: number, r: number, notch: number): void {
  const gap = 0.32; // half-angle of the wedge cut
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, notch + gap, notch - gap + Math.PI * 2);
  ctx.closePath();
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  g.addColorStop(0, "#5bb368");
  g.addColorStop(1, "#2e6f3c");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#1f4f29";
  ctx.lineWidth = Math.max(1, r * 0.09);
  ctx.stroke();
  // pale radial veins fanning out from the centre
  ctx.strokeStyle = "rgba(225, 245, 225, 0.3)";
  ctx.lineWidth = Math.max(0.8, r * 0.05);
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = notch + gap + ((Math.PI * 2 - 2 * gap) * (i + 0.5)) / 7;
    ctx.moveTo(cx + Math.cos(a) * r * 0.14, cy + Math.sin(a) * r * 0.14);
    ctx.lineTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86);
  }
  ctx.stroke();
}

/** A water-lily blossom seen from above: two rings of pointed petals around a golden centre. */
function lilyFlower(ctx: Ctx, cx: number, cy: number, R: number): void {
  const petal = (rot: number, len: number, wid: number, color: string): void => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, -len * 0.55, wid, len * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  // soft shadow on the pad
  ctx.fillStyle = "rgba(0,0,0,0.10)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + R * 0.1, R * 1.05, R * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 8; i++) petal((i / 8) * Math.PI * 2, R, R * 0.32, "#ef9fc2"); // outer pink
  for (let i = 0; i < 6; i++) petal((i / 6) * Math.PI * 2 + 0.4, R * 0.66, R * 0.26, "#fbd2e5"); // inner
  ctx.fillStyle = "#f4d35e"; // golden centre
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#dca828"; // a couple of stamen dots
  for (const [dx, dy] of [
    [-0.08, -0.04],
    [0.07, 0.02],
    [0, 0.08],
  ] as const) {
    ctx.beginPath();
    ctx.arc(cx + dx * R, cy + dy * R, R * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Water lilies (OCCUPIABLE — a person can be "on a water lily"), seen from directly
 * above: a faint water shimmer with two floating lily pads and a pink blossom on the
 * larger one. Sits bare on the tile (no blocked card). The generator places these only
 * in lake/water rooms, so they read as floating on water.
 */
export function drawWaterlily(ctx: Ctx, x: number, y: number, S: number): void {
  ctx.lineJoin = "round";
  // Scale the WHOLE plant — pads (leaves), blossom and ripple — to ~80% about the tile
  // centre, so the entire lily sits smaller and compactly centred on its tile.
  const cx = x + S * 0.5;
  const cy = y + S * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.8, 0.8);
  ctx.translate(-cx, -cy);
  // faint ripple of open water under the pads
  ctx.fillStyle = "rgba(120, 170, 200, 0.16)";
  ctx.beginPath();
  ctx.ellipse(x + S * 0.5, y + S * 0.54, S * 0.42, S * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  lilyPad(ctx, x + S * 0.66, y + S * 0.4, S * 0.19, -0.8); // small pad, upper-right
  lilyPad(ctx, x + S * 0.42, y + S * 0.6, S * 0.3, 2.3); // large pad under the blossom
  lilyFlower(ctx, x + S * 0.5, y + S * 0.5, S * 0.17); // blossom, centred on the large pad
  ctx.restore();
}
