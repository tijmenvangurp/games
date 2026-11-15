/**
 * Detailed vector drawings for 2-cell objects (bed, car) — 2:1 aspect.
 * Drawn across two adjacent tiles; vertical pairs reuse the horizontal drawing
 * rotated 90°. Kept here so artwork is one place to refine.
 */

type Ctx = CanvasRenderingContext2D

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

/** Horizontal bed in box (bx,by, w=2u, h=u). Head (pillow) on the left. */
function bedH(ctx: Ctx, bx: number, by: number, w: number, h: number): void {
  rr(ctx, bx + 0.03 * w, by + 0.12 * h, 0.94 * w, 0.8 * h, 0.1 * h, '#7a5230') // frame
  rr(ctx, bx + 0.06 * w, by + 0.2 * h, 0.88 * w, 0.62 * h, 0.08 * h, '#efe7d6') // mattress
  // blanket (foot end, right)
  rr(ctx, bx + 0.38 * w, by + 0.2 * h, 0.56 * w, 0.62 * h, 0.07 * h, '#6f93c4')
  rr(ctx, bx + 0.38 * w, by + 0.2 * h, 0.05 * w, 0.62 * h, 0, '#5a7da8') // fold line
  // pillow (head, left)
  rr(ctx, bx + 0.1 * w, by + 0.27 * h, 0.22 * w, 0.46 * h, 0.06 * h, '#ffffff')
  ctx.strokeStyle = 'rgba(120,100,80,0.5)'
  ctx.lineWidth = Math.max(1, h * 0.02)
  ctx.strokeRect(bx + 0.1 * w, by + 0.27 * h, 0.22 * w, 0.46 * h)
  // feet
  rr(ctx, bx + 0.04 * w, by + 0.86 * h, 0.06 * w, 0.12 * h, 1, '#5a3d22')
  rr(ctx, bx + 0.9 * w, by + 0.86 * h, 0.06 * w, 0.12 * h, 1, '#5a3d22')
}

/** Vertical bed in box (bx,by, w=u, h=2u). Pillow on top, feet at the bottom. */
function bedV(ctx: Ctx, bx: number, by: number, w: number, h: number): void {
  rr(ctx, bx + 0.1 * w, by + 0.04 * h, 0.8 * w, 0.92 * h, 0.06 * w, '#7a5230') // frame
  rr(ctx, bx + 0.17 * w, by + 0.07 * h, 0.66 * w, 0.86 * h, 0.05 * w, '#efe7d6') // mattress
  rr(ctx, bx + 0.17 * w, by + 0.34 * h, 0.66 * w, 0.59 * h, 0.04 * w, '#6f93c4') // blanket
  rr(ctx, bx + 0.17 * w, by + 0.34 * h, 0.66 * w, 0.04 * h, 0, '#5a7da8') // fold line
  rr(ctx, bx + 0.27 * w, by + 0.1 * h, 0.46 * w, 0.16 * h, 0.04 * w, '#ffffff') // pillow
  ctx.strokeStyle = 'rgba(120,100,80,0.5)'
  ctx.lineWidth = Math.max(1, w * 0.03)
  ctx.strokeRect(bx + 0.27 * w, by + 0.1 * h, 0.46 * w, 0.16 * h)
  rr(ctx, bx + 0.13 * w, by + 0.92 * h, 0.12 * w, 0.06 * h, 1, '#5a3d22') // feet (bottom)
  rr(ctx, bx + 0.75 * w, by + 0.92 * h, 0.12 * w, 0.06 * h, 1, '#5a3d22')
}

/** Top-down car in box (bx,by, w=2u, h=u) — front (headlights) on the right. */
function carH(ctx: Ctx, bx: number, by: number, w: number, h: number): void {
  const color = '#d24b4b'
  // four wheels on the long sides
  const ww = 0.09 * w
  const wh = 0.15 * h
  for (const wx of [bx + 0.24 * w, bx + 0.67 * w]) {
    rr(ctx, wx, by + 0.05 * h, ww, wh, wh * 0.4, '#222')
    rr(ctx, wx, by + 0.8 * h, ww, wh, wh * 0.4, '#222')
  }
  // body
  rr(ctx, bx + 0.06 * w, by + 0.15 * h, 0.88 * w, 0.7 * h, 0.2 * h, color)
  // roof / cabin
  rr(ctx, bx + 0.33 * w, by + 0.24 * h, 0.42 * w, 0.52 * h, 0.14 * h, '#ab3a36')
  // windshield (front, right) + rear window (left)
  rr(ctx, bx + 0.63 * w, by + 0.3 * h, 0.12 * w, 0.4 * h, 0.05 * h, '#bfe2f2')
  rr(ctx, bx + 0.31 * w, by + 0.3 * h, 0.1 * w, 0.4 * h, 0.05 * h, '#bfe2f2')
  // headlights (front, right end)
  rr(ctx, bx + 0.9 * w, by + 0.24 * h, 0.04 * w, 0.14 * h, 1, '#ffe08a')
  rr(ctx, bx + 0.9 * w, by + 0.62 * h, 0.04 * w, 0.14 * h, 1, '#ffe08a')
  // hood/trunk seams
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = Math.max(1, h * 0.02)
  ctx.beginPath()
  ctx.moveTo(bx + 0.06 * w, by + 0.5 * h)
  ctx.lineTo(bx + 0.31 * w, by + 0.5 * h)
  ctx.moveTo(bx + 0.75 * w, by + 0.5 * h)
  ctx.lineTo(bx + 0.94 * w, by + 0.5 * h)
  ctx.stroke()
}

/**
 * Top-down rowing boat in box (bx,by, w=2u, h=u) — a pointed wooden hull (bow on the
 * right), a planked interior with two thwart seats, and two oars reaching out to the
 * stern side with visible blades. Occupiable: it floats on the open lake water, so it
 * gets no white card; the water shows around it.
 */
function boatH(ctx: Ctx, bx: number, by: number, w: number, h: number): void {
  const cy = by + 0.5 * h
  // The hull outline (pointed lens, bow right). Reused at two insets so a dark wooden
  // gunwale rim shows around the lighter interior.
  const hull = (ix: number, iy: number): void => {
    const L = bx + ix
    const R = bx + w - ix
    const T = by + iy
    const B = by + h - iy
    ctx.beginPath()
    ctx.moveTo(L, cy)
    ctx.quadraticCurveTo(bx + 0.3 * w, T, bx + 0.6 * w, T)
    ctx.quadraticCurveTo(bx + 0.85 * w, T, R, cy)
    ctx.quadraticCurveTo(bx + 0.85 * w, B, bx + 0.6 * w, B)
    ctx.quadraticCurveTo(bx + 0.3 * w, B, L, cy)
    ctx.closePath()
  }

  ctx.save()
  ctx.lineJoin = 'round'

  // soft shadow on the water beneath the hull
  ctx.save()
  ctx.translate(0, h * 0.05)
  hull(0.04 * w, 0.1 * h)
  ctx.fillStyle = 'rgba(15, 35, 55, 0.16)'
  ctx.fill()
  ctx.restore()

  // outer hull (dark wood gunwale)
  hull(0.035 * w, 0.09 * h)
  ctx.fillStyle = '#6b4423'
  ctx.fill()
  ctx.strokeStyle = 'rgba(30, 18, 8, 0.55)'
  ctx.lineWidth = Math.max(1, h * 0.03)
  ctx.stroke()

  // planked interior (clipped so seats/boards stay inside the rim)
  ctx.save()
  hull(0.085 * w, 0.21 * h)
  ctx.clip()
  ctx.fillStyle = '#bf8b50'
  ctx.fillRect(bx, by, w, h)
  ctx.strokeStyle = 'rgba(120, 80, 40, 0.35)'
  ctx.lineWidth = Math.max(1, h * 0.02)
  for (const fy of [0.4, 0.6]) {
    ctx.beginPath()
    ctx.moveTo(bx + 0.05 * w, by + fy * h)
    ctx.lineTo(bx + 0.95 * w, by + fy * h)
    ctx.stroke()
  }
  ctx.fillStyle = '#8a5a2b' // thwart seats (cross planks)
  for (const sx of [0.36, 0.58]) {
    ctx.beginPath()
    ctx.roundRect(bx + sx * w, by + 0.16 * h, 0.05 * w, 0.68 * h, 0.02 * w)
    ctx.fill()
  }
  ctx.restore()

  // two oars: handles just right of centre, blades reaching out to the stern (top & bottom)
  const oar = (hx: number, hy: number, tx: number, ty: number): void => {
    ctx.strokeStyle = '#73512c'
    ctx.lineWidth = Math.max(1.5, w * 0.022)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(hx, hy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
    ctx.save() // blade (paddle) at the outboard tip, oriented along the shaft
    ctx.translate(tx, ty)
    ctx.rotate(Math.atan2(ty - hy, tx - hx))
    ctx.beginPath()
    ctx.ellipse(0, 0, w * 0.06, h * 0.05, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#caa063'
    ctx.fill()
    ctx.strokeStyle = 'rgba(60, 40, 18, 0.6)'
    ctx.lineWidth = Math.max(1, h * 0.02)
    ctx.stroke()
    ctx.restore()
  }
  oar(bx + 0.66 * w, by + 0.42 * h, bx + 0.12 * w, by + 0.05 * h)
  oar(bx + 0.66 * w, by + 0.58 * h, bx + 0.12 * w, by + 0.95 * h)

  // oarlock pegs where the oars cross the gunwale
  ctx.fillStyle = '#3a2613'
  for (const [px, py] of [[0.42, 0.2], [0.42, 0.8]] as const) {
    ctx.beginPath()
    ctx.arc(bx + px * w, by + py * h, Math.max(1.5, w * 0.016), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/**
 * A horse-drawn carriage from ABOVE (bx,by, w=2u, h=u), facing right — a Landau with
 * a HALF-FOLDED canopy: you look INTO the open coach and see two facing upholstered
 * benches; the folded top sits as nested pleats against the rear wall. Four wheels
 * protrude clearly beyond the body sides (nothing car-like about it), the coachman's
 * box sits separate in front, and the shafts reach forward to the swingle bar.
 * Top-down like the car/boat, so vertical pairs rotate cleanly in both directions.
 */
function carriageH(ctx: Ctx, bx: number, by: number, w: number, h: number): void {
  const body = '#7a2e2e'
  const bodyDark = '#571f1f'
  const gold = '#c9a13c'
  const wood = '#6b4a2b'
  const woodDark = '#4c331d'
  const cushion = '#b23b3b'
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // soft ground shadow under the whole rig
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.beginPath()
  ctx.roundRect(bx + 0.05 * w, by + 0.1 * h, 0.78 * w, 0.84 * h, 0.2 * h)
  ctx.fill()

  // shafts (Deichsel) reaching forward from the box, joined by the swingle bar
  ctx.strokeStyle = wood
  ctx.lineWidth = Math.max(1.4, h * 0.045)
  ctx.beginPath()
  ctx.moveTo(bx + 0.78 * w, by + 0.36 * h)
  ctx.quadraticCurveTo(bx + 0.9 * w, by + 0.38 * h, bx + 0.96 * w, by + 0.42 * h)
  ctx.moveTo(bx + 0.78 * w, by + 0.64 * h)
  ctx.quadraticCurveTo(bx + 0.9 * w, by + 0.62 * h, bx + 0.96 * w, by + 0.58 * h)
  ctx.moveTo(bx + 0.96 * w, by + 0.42 * h)
  ctx.lineTo(bx + 0.96 * w, by + 0.58 * h)
  ctx.stroke()

  // four wheels, protruding clearly beyond the body on BOTH long sides — the
  // signature that says "coach": dark iron tyres with a gold hub cap.
  const wheel = (wx: number, len: number): void => {
    for (const top of [true, false]) {
      const wy = top ? by + 0.01 * h : by + 0.99 * h - 0.14 * h
      ctx.fillStyle = '#33241a'
      ctx.beginPath()
      ctx.roundRect(bx + wx * w - (len * w) / 2, wy, len * w, 0.14 * h, 0.07 * h)
      ctx.fill()
      // hub cap
      ctx.fillStyle = gold
      ctx.beginPath()
      ctx.arc(bx + wx * w, wy + 0.07 * h, Math.max(1, h * 0.028), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  wheel(0.18, 0.15) // rear pair (bigger)
  wheel(0.56, 0.11) // front pair

  // axles peeking between wheel and body
  ctx.strokeStyle = woodDark
  ctx.lineWidth = Math.max(1, h * 0.03)
  ctx.beginPath()
  for (const wx of [0.18, 0.56]) {
    ctx.moveTo(bx + wx * w, by + 0.12 * h)
    ctx.lineTo(bx + wx * w, by + 0.88 * h)
  }
  ctx.stroke()

  // open coach tub: burgundy, gently curved ends, gold beltline on the rim
  const tub = new Path2D()
  tub.roundRect(bx + 0.05 * w, by + 0.16 * h, 0.62 * w, 0.68 * h, 0.16 * h)
  ctx.fillStyle = body
  ctx.fill(tub)
  ctx.strokeStyle = bodyDark
  ctx.lineWidth = Math.max(1, h * 0.03)
  ctx.stroke(tub)
  ctx.strokeStyle = gold
  ctx.lineWidth = Math.max(0.8, h * 0.018)
  ctx.beginPath()
  ctx.roundRect(bx + 0.065 * w, by + 0.19 * h, 0.59 * w, 0.62 * h, 0.14 * h)
  ctx.stroke()

  // interior floor you look down into
  ctx.fillStyle = '#5a2222'
  ctx.beginPath()
  ctx.roundRect(bx + 0.09 * w, by + 0.24 * h, 0.52 * w, 0.52 * h, 0.1 * h)
  ctx.fill()

  // HALF-FOLDED canopy: nested pleats hugging the rear wall (left end)
  ctx.strokeStyle = '#3d3d49'
  ctx.lineCap = 'butt'
  ctx.lineWidth = Math.max(1.4, h * 0.05)
  for (const fx of [0.115, 0.16, 0.205]) {
    ctx.beginPath()
    ctx.moveTo(bx + fx * w, by + 0.26 * h)
    ctx.quadraticCurveTo(bx + (fx - 0.055) * w, by + 0.5 * h, bx + fx * w, by + 0.74 * h)
    ctx.stroke()
  }
  ctx.lineCap = 'round'

  // two facing upholstered benches (crimson, with button tufts)
  const bench = (fx: number): void => {
    ctx.fillStyle = cushion
    ctx.strokeStyle = bodyDark
    ctx.lineWidth = Math.max(0.8, h * 0.02)
    ctx.beginPath()
    ctx.roundRect(bx + fx * w, by + 0.26 * h, 0.09 * w, 0.48 * h, 0.03 * h)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgba(255, 220, 190, 0.55)'
    for (const fy of [0.38, 0.5, 0.62]) {
      ctx.beginPath()
      ctx.arc(bx + (fx + 0.045) * w, by + fy * h, Math.max(0.8, h * 0.02), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  bench(0.26) // rear bench (in front of the folded top)
  bench(0.5) // front bench, facing it

  // lanterns on the front corners of the tub
  ctx.fillStyle = '#ffe08a'
  ctx.strokeStyle = '#8a6420'
  ctx.lineWidth = Math.max(0.7, h * 0.016)
  for (const fy of [0.2, 0.8]) {
    ctx.beginPath()
    ctx.arc(bx + 0.66 * w, by + fy * h, Math.max(1.2, h * 0.035), 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // coachman's box: a separate wooden bench in front, joined by a reach beam
  ctx.strokeStyle = woodDark
  ctx.lineWidth = Math.max(1.2, h * 0.035)
  ctx.beginPath()
  ctx.moveTo(bx + 0.67 * w, by + 0.5 * h)
  ctx.lineTo(bx + 0.73 * w, by + 0.5 * h)
  ctx.stroke()
  ctx.fillStyle = wood
  ctx.strokeStyle = woodDark
  ctx.lineWidth = Math.max(1, h * 0.025)
  ctx.beginPath()
  ctx.roundRect(bx + 0.72 * w, by + 0.28 * h, 0.09 * w, 0.44 * h, 0.04 * h)
  ctx.fill()
  ctx.stroke()
  // the coachman's plank seat marked on the box
  ctx.strokeStyle = 'rgba(76, 51, 29, 0.7)'
  ctx.lineWidth = Math.max(0.8, h * 0.018)
  ctx.beginPath()
  ctx.moveTo(bx + 0.745 * w, by + 0.32 * h)
  ctx.lineTo(bx + 0.745 * w, by + 0.68 * h)
  ctx.stroke()
}

/**
 * Draw a 2-cell object at its primary (left/top) cell. `vertical` spans down;
 * otherwise it spans right. `x,y,S` are the primary cell box.
 */
export function drawBigObject(
  ctx: Ctx,
  type: string,
  x: number,
  y: number,
  S: number,
  vertical: boolean,
): void {
  // Shrink to ~82% about the 2-cell footprint's centre so a carpet underneath stays visible.
  const cx = vertical ? x + S / 2 : x + S
  const cy = vertical ? y + S : y + S / 2
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(0.82, 0.82)
  ctx.translate(-cx, -cy)
  // The bed has a real up/down (pillow/feet), so it gets a dedicated vertical
  // drawing. The car and boat are top-down, so rotating them 90° is fine.
  if (type === 'bed') {
    if (vertical) bedV(ctx, x, y, S, 2 * S)
    else bedH(ctx, x, y, 2 * S, S)
  } else {
    const topDown = type === 'boat' ? boatH : type === 'carriage' ? carriageH : carH
    if (vertical) {
      ctx.translate(x + S / 2, y + S)
      ctx.rotate(Math.PI / 2)
      topDown(ctx, -S, -S / 2, 2 * S, S)
    } else {
      topDown(ctx, x, y, 2 * S, S)
    }
  }
  ctx.restore()
}

/** Single-cell version (legacy 1-tile beds, and the legend chip): the same drawing in one cell. */
export function drawSingleObject(ctx: Ctx, type: string, x: number, y: number, S: number): void {
  const draw = type === 'car' ? carH : type === 'boat' ? boatH : type === 'carriage' ? carriageH : bedH
  draw(ctx, x + S * 0.04, y + S * 0.18, S * 0.92, S * 0.64)
}
