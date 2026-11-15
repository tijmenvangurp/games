/**
 * Generates a recognizable head avatar as a self-contained SVG, used both by the
 * React clue cards (<img>) and the Canvas board (drawn via an Image). One source
 * of truth so both targets always match.
 *
 * Cues that matter for the clue logic: gender, beard, glasses, hair colour AND
 * now the concrete style (hairstyle / beardStyle / glassesShape / glassesColor).
 * Every catalog below is exported so the editor dropdowns and the clue builder
 * reuse exactly the values this renderer understands. When a style is unset we
 * fall back to a deterministic pick from the id, so old levels still vary nicely.
 *
 * Look: "inked dossier portrait" — every hair/beard shape carries a soft
 * contour in a slightly darker version of its own colour plus a second tone
 * for strands/shadow, and each style has its own silhouette.
 *
 * NOTE: scripts/portrait.ts (app icon) extracts layers from this SVG by exact
 * string match — keep the coin circles and the letter badge markup stable.
 */

const SKIN = '#f0c6a0'
const SKIN_SHADE = '#e0b48d'
const FRAME = '#241f2b'
const MOUTH = '#9c5b4a'
const LIP = '#c66b66'

export interface AvatarAttrs {
  gender?: unknown
  beard?: unknown
  glasses?: unknown
  bald?: unknown
  hair?: unknown
  hairstyle?: unknown
  beardStyle?: unknown
  glassesShape?: unknown
  glassesColor?: unknown
}

// ─── Catalogs (single source of truth, reused by editor + clue builder) ──────

/** Hairstyle ids per gender (≥10 each). Distinct silhouettes, female vs male. */
export const HAIRSTYLES_F = [
  'long',
  'longCenter',
  'bob',
  'wavy',
  'ponytailLeft',
  'ponytailRight',
  'braids',
  'bun',
  'updo',
  'pixie',
  'curly',
  'hime',
] as const
export const HAIRSTYLES_M = [
  'short',
  'fringe',
  'sidePart',
  'curtains',
  'buzz',
  'quiff',
  'slick',
  'shaggy',
  'curly',
  'undercut',
  'manbun',
  'longM',
] as const

/** Retired style ids (still stored in old levels) → their closest current look. */
const LEGACY_HAIRSTYLES: Record<string, string> = {
  afro: 'curly',
  caesar: 'fringe',
  combOver: 'sidePart',
  mohawk: 'buzz',
  spiky: 'shaggy',
}

/** Distinct union of all hairstyle ids (for the clue value picker). */
export const HAIRSTYLE_IDS = Array.from(new Set([...HAIRSTYLES_F, ...HAIRSTYLES_M]))

export const BEARD_STYLES = ['full', 'mustache', 'goatee', 'stubble', 'chinstrap'] as const
export const GLASSES_SHAPES = ['round', 'square', 'rectangle', 'oversized', 'cat', 'rimless'] as const
export const GLASSES_COLORS = ['black', 'brown', 'gold', 'red', 'blue', 'silver'] as const

const GLASSES_COLOR_HEX: Record<string, string> = {
  black: '#241f2b',
  brown: '#5b3a23',
  gold: '#c9a227',
  red: '#b5302a',
  blue: '#2f5d9e',
  silver: '#9aa3ad',
}

export function hairstylesFor(gender: unknown): readonly string[] {
  return gender === 'm' ? HAIRSTYLES_M : HAIRSTYLES_F
}

/**
 * The concrete hairstyle a suspect ends up with: the explicit choice if it is
 * valid for the gender, otherwise a deterministic pick from the letter. Shared
 * by the renderer AND `suspectAttributes`, so "what you see" == "what clues match".
 */
export function resolveHairstyle(gender: unknown, explicit: unknown, letter: string): string {
  const list = hairstylesFor(gender)
  const raw = typeof explicit === 'string' ? explicit : ''
  const e = LEGACY_HAIRSTYLES[raw] ?? raw
  if (e && list.includes(e)) return e
  return list[letter.charCodeAt(0) % list.length]
}

// ─── Colours ─────────────────────────────────────────────────────────────────

/** Mix a #rrggbb colour toward white (amt>0) or black (amt<0). */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const target = amt > 0 ? 255 : 0
  const f = Math.abs(amt)
  const ch = (v: number) => Math.round(v + (target - v) * f)
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
}

/** Strand/shadow tone: darker on light hair, a lighter sheen on dark hair. */
function strandColor(H: string): string {
  return luminance(H) < 90 ? shade(H, 0.3) : shade(H, -0.24)
}

/** Fallback palette (id-hashed) — mirrors the six clue colour values. */
const HAIR_PALETTE = ['#e8c568', '#6f4a28', '#2e2a33', '#b0502c', '#8f959e', '#f3f0e8']

function hairColor(attrs: AvatarAttrs, hash: number): string {
  // grey and white must be tellable apart at a glance: grey is a mid steel
  // grey, white a warm near-white (its shading strands stay light).
  const named: Record<string, string> = {
    blond: '#e8c568',
    darkblond: '#bd8f45',
    'dark blond': '#bd8f45',
    brown: '#6f4a28',
    black: '#2e2a33',
    white: '#f3f0e8',
    grey: '#8f959e',
    gray: '#8f959e',
    red: '#b0502c',
    auburn: '#7a3f24',
  }
  const key = String(attrs.hair ?? '').toLowerCase()
  return named[key] ?? HAIR_PALETTE[hash % HAIR_PALETTE.length]
}

// ─── Head ────────────────────────────────────────────────────────────────────

/** Face outline — women narrower with a soft chin, men wider with a squarer jaw. */
function facePath(female: boolean): string {
  return female
    ? 'M50 34 C62 34 71 44 71 57 C71 73 62 88 50 88 C38 88 29 73 29 57 C29 44 38 34 50 34 Z'
    : 'M50 33 C64 33 73 43 74 56 C74 71 66 86 50 86 C34 86 26 71 26 56 C27 43 36 33 50 33 Z'
}

/** Eyebrows — soft thin arcs for women, heavier straight ones for men. Very light
 *  hair gets darkened brows so they never vanish against the skin. */
function brows(female: boolean, H: string): string {
  const B = luminance(H) > 170 ? shade(H, -0.38) : H
  return female
    ? `<path d="M34 49 Q40 46.5 46 48.5" fill="none" stroke="${B}" stroke-width="1.7" stroke-linecap="round"/>` +
        `<path d="M54 48.5 Q60 46.5 66 49" fill="none" stroke="${B}" stroke-width="1.7" stroke-linecap="round"/>`
    : `<path d="M33 48.5 Q40 45.5 47 48.5" fill="none" stroke="${B}" stroke-width="2.8" stroke-linecap="round"/>` +
        `<path d="M53 48.5 Q60 45.5 67 48.5" fill="none" stroke="${B}" stroke-width="2.8" stroke-linecap="round"/>`
}

const EYES =
  `<ellipse cx="40" cy="55" rx="3" ry="3.4" fill="${FRAME}"/>` +
  `<ellipse cx="60" cy="55" rx="3" ry="3.4" fill="${FRAME}"/>` +
  `<circle cx="41" cy="54" r="0.9" fill="#fff"/><circle cx="61" cy="54" r="0.9" fill="#fff"/>`

const NOSE = `<path d="M50 57 L48 64 Q50 65.4 52 64" fill="none" stroke="${SKIN_SHADE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`

function mouth(female: boolean): string {
  return female
    ? `<path d="M43 72 Q50 78 57 72 Q50 74.5 43 72 Z" fill="${LIP}"/>`
    : `<path d="M44 72.5 Q50 76 56 72.5" fill="none" stroke="${MOUTH}" stroke-width="2.3" stroke-linecap="round"/>`
}

// ─── Hair ────────────────────────────────────────────────────────────────────

/** Contour tone: only a touch darker than the hair itself, so light colours
 *  (blond/white/grey) keep a soft edge instead of a hard dark rim — a dark rim
 *  around light hair reads as a cap, not as hair. */
function outlineFor(H: string): string {
  return shade(H, -0.3)
}

/** A filled hair shape with a soft same-hue contour. */
function blob(d: string, H: string, w = 1.1): string {
  return `<path d="${d}" fill="${H}" stroke="${outlineFor(H)}" stroke-width="${w}" stroke-linejoin="round"/>`
}

/** An outlined hair circle (curls, buns, braids). */
function puff(cx: number, cy: number, r: number, H: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${H}" stroke="${outlineFor(H)}" stroke-width="1"/>`
}

/**
 * Full hair cap covering the whole upper head, closed off by a hairline running
 * from the right temple (72,T) back to the left temple (28,T). `T` is the temple
 * height (men wear it a little higher). The *style* lives in the hairline shape,
 * the parting, texture strands and any extra volume/length.
 */
function capD(T: number, hairline: string): string {
  return `M28 ${T} Q27 ${T - 20} 50 ${T - 23} Q73 ${T - 20} 72 ${T} ${hairline} Z`
}

/** Hair as { back: behind face (length/volume), front: over the head/face edge. } */
function hair(id: string, female: boolean, H: string): { back: string; front: string } {
  const T = female ? 50 : 47 // temple hairline height — men a touch higher
  const S1 = strandColor(H)
  const line = (d: string, w = 1.4, o = 0.55) =>
    `<path d="${d}" fill="none" stroke="${S1}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`
  const cap = (hairline: string) => blob(capD(T, hairline), H)

  const round = `Q50 ${T - 10} 28 ${T}` // standard rounded hairline
  const sleek = `Q50 ${T - 8} 28 ${T}` // hair pulled back / flat
  // Texture strands following the skull curve — used by several plain styles.
  const capStrands =
    line(`M35 ${T - 7} Q37 ${T - 15} 45 ${T - 19}`) + line(`M65 ${T - 7} Q63 ${T - 15} 55 ${T - 19}`)
  const partCenter = `<path d="M48 ${T - 21} L50 ${T - 7} L52 ${T - 21} Z" fill="${SKIN}"/>`
  // Little sideburns grounding the male cuts at ear height — hair that stops
  // well above the ears reads as a cap.
  const burns =
    blob(`M27.6 ${T - 1} Q26.8 ${T + 4} 27.8 ${T + 9} L30.6 ${T + 7.5} Q30 ${T + 3} 30.4 ${T - 0.5} Z`, H, 0.8) +
    blob(`M72.4 ${T - 1} Q73.2 ${T + 4} 72.2 ${T + 9} L69.4 ${T + 7.5} Q70 ${T + 3} 69.6 ${T - 0.5} Z`, H, 0.8)

  switch (id) {
    // ── female ────────────────────────────────────────────────────────────
    case 'long':
      // Flowing mane framing the face, widening softly toward the ends; a soft
      // lock falls in front of each temple.
      return {
        back:
          blob(`M28 42 Q18 60 20 90 Q29 86 32 70 Q32 54 34 46 Z`, H) +
          blob(`M72 42 Q82 60 80 90 Q71 86 68 70 Q68 54 66 46 Z`, H),
        front:
          cap(round) +
          blob(`M28 46 Q23 64 25 88 Q32 84 33 70 Q33 55 36 47 Q31 43 28 46 Z`, H) +
          blob(`M72 46 Q77 64 75 88 Q68 84 67 70 Q67 55 64 47 Q69 43 72 46 Z`, H) +
          blob(`M30 ${T - 8} Q36 ${T - 4} 34.5 ${T + 6} Q30 ${T + 1} 30 ${T - 8} Z`, H, 0.9) +
          blob(`M70 ${T - 8} Q64 ${T - 4} 65.5 ${T + 6} Q70 ${T + 1} 70 ${T - 8} Z`, H, 0.9) +
          line(`M27 58 Q26 72 27 82`) +
          line(`M73 58 Q74 72 73 82`) +
          capStrands,
      }
    case 'longCenter':
      // Sleek and straight with a sharp centre part.
      return {
        back:
          blob(`M28 42 Q23 62 24 91 Q30 88 31 70 Q31 52 33 45 Z`, H) +
          blob(`M72 42 Q77 62 76 91 Q70 88 69 70 Q69 52 67 45 Z`, H),
        front:
          cap(round) +
          partCenter +
          blob(`M28 45 L26 90 Q32 88 33 68 L34 46 Q30 42 28 45 Z`, H) +
          blob(`M72 45 L74 90 Q68 88 67 68 L66 46 Q70 42 72 45 Z`, H) +
          blob(`M30 ${T - 6} Q33 ${T - 2} 32.5 ${T + 7} L30.5 ${T + 5} Q29.5 ${T - 1} 30 ${T - 6} Z`, H, 0.9) +
          blob(`M70 ${T - 6} Q67 ${T - 2} 67.5 ${T + 7} L69.5 ${T + 5} Q70.5 ${T - 1} 70 ${T - 6} Z`, H, 0.9) +
          line(`M29 56 L28 80`) +
          line(`M71 56 L72 80`),
      }
    case 'bob':
      // Chin-length helmet with a blunt fringe, ends curving inward (A-line).
      return {
        back: '',
        front:
          cap(`Q71 ${T - 4} 60 ${T - 5.5} Q50 ${T - 7.5} 40 ${T - 5.5} Q29 ${T - 4} 28 ${T}`) +
          blob(`M28 44 Q21 58 26 71 Q31 76 36 71 Q33 60 34 48 Q30 42 28 44 Z`, H) +
          blob(`M72 44 Q79 58 74 71 Q69 76 64 71 Q67 60 66 48 Q70 42 72 44 Z`, H) +
          line(`M34 ${T - 5} Q50 ${T - 8.5} 66 ${T - 5}`, 1.2) +
          line(`M27 54 Q25 63 28 69`),
      }
    case 'wavy':
      // Loose waves: scalloped outer edges rippling down to the shoulders.
      return {
        back:
          blob(`M28 44 Q17 55 23 66 Q15 75 22 86 Q26 91 30 88 Q27 79 32 71 Q28 61 33 50 Z`, H) +
          blob(`M72 44 Q83 55 77 66 Q85 75 78 86 Q74 91 70 88 Q73 79 68 71 Q72 61 67 50 Z`, H),
        front:
          cap(`Q50 ${T - 12} 28 ${T}`) +
          blob(`M28 46 Q23 55 27 62 Q23 70 27 78 Q31 82 33 78 Q30 69 33 61 Q31 52 35 47 Q31 43 28 46 Z`, H) +
          blob(`M72 46 Q77 55 73 62 Q77 70 73 78 Q69 82 67 78 Q70 69 67 61 Q69 52 65 47 Q69 43 72 46 Z`, H) +
          blob(`M33 ${T - 14} Q42 ${T - 19} 55 ${T - 13} Q60 ${T - 9} 61 ${T - 4} Q52 ${T - 10} 42 ${T - 9} Q36 ${T - 9} 33 ${T - 14} Z`, H, 0.9) +
          line(`M26 56 Q24 62 27 67`),
      }
    case 'ponytailLeft':
      // Hair pulled back tight, high ponytail swinging out to the upper left.
      return {
        back:
          blob(`M34 33 Q20 22 10 30 Q4 38 8 50 Q11 58 17 60 Q13 50 16 42 Q20 33 33 37 Z`, H) +
          `<path d="M30 28 L36 34" stroke="${S1}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M12 34 Q9 42 12 52" fill="none" stroke="${S1}" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/>`,
        front: cap(sleek) + line(`M34 ${T - 6} Q40 ${T - 16} 48 ${T - 19}`) + line(`M52 ${T - 20} Q42 ${T - 14} 37 ${T - 8}`, 1.1, 0.4),
      }
    case 'ponytailRight':
      return {
        back:
          blob(`M66 33 Q80 22 90 30 Q96 38 92 50 Q89 58 83 60 Q87 50 84 42 Q80 33 67 37 Z`, H) +
          `<path d="M70 28 L64 34" stroke="${S1}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M88 34 Q91 42 88 52" fill="none" stroke="${S1}" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/>`,
        front: cap(sleek) + line(`M66 ${T - 6} Q60 ${T - 16} 52 ${T - 19}`) + line(`M48 ${T - 20} Q58 ${T - 14} 63 ${T - 8}`, 1.1, 0.4),
      }
    case 'braids': {
      // Centre part + two plaited braids hanging in front of the shoulders:
      // stacked, slightly offset bumps with a little tuft at the end.
      const braid = (x: number): string =>
        puff(x, 52, 4.6, H) +
        puff(x - 1.5, 60, 4.4, H) +
        puff(x + 1, 68, 4.2, H) +
        puff(x - 1, 76, 4, H) +
        blob(`M${x - 3.4} 81 Q${x - 1} 90 ${x + 0.5} 90 Q${x + 2.6} 90 ${x + 2.4} 81 Q${x} 84 ${x - 3.4} 81 Z`, H) +
        `<path d="M${x - 3.2} 80.5 L${x + 3} 80.5" stroke="${S1}" stroke-width="2.2" stroke-linecap="round"/>`
      return {
        back: '',
        front: cap(round) + partCenter + braid(30) + braid(70),
      }
    }
    case 'bun':
      // Pulled back into a high donut bun (visible hole shadow + tie).
      return {
        back:
          puff(50, 16, 9.5, H) +
          `<path d="M44 16 Q50 21 56 16" fill="none" stroke="${S1}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>` +
          `<ellipse cx="50" cy="26" rx="6.5" ry="2.4" fill="${S1}"/>`,
        front: cap(sleek) + line(`M36 ${T - 8} Q42 ${T - 17} 49 ${T - 20}`) + line(`M64 ${T - 8} Q58 ${T - 17} 51 ${T - 20}`),
      }
    case 'updo':
      // Voluminous swept-up do — a soft tall twist above the head.
      return {
        back:
          blob(`M33 36 Q26 14 50 10 Q74 14 67 36 Q60 27 50 27 Q40 27 33 36 Z`, H) +
          `<path d="M41 16 Q51 11 60 19" fill="none" stroke="${S1}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>` +
          `<path d="M37 25 Q47 19 58 25" fill="none" stroke="${S1}" stroke-width="1.3" stroke-linecap="round" opacity="0.45"/>`,
        front: cap(sleek) + line(`M35 ${T - 7} Q42 ${T - 15} 50 ${T - 18}`),
      }
    case 'pixie':
      // Short shaggy crop: side-swept fringe plus feathered wisps flicking out
      // at the temples — the jagged edge is what says "pixie", not the cap.
      return {
        back: '',
        front:
          cap(`Q50 ${T - 12} 28 ${T}`) +
          blob(`M33 ${T - 16} Q46 ${T - 23} 63 ${T - 8} L56 ${T - 10} Q57 ${T - 5} 51 ${T - 6} Q51 ${T - 10} 44 ${T - 10} Q37 ${T - 8} 33 ${T - 16} Z`, H) +
          blob(`M28 ${T - 2} L22 ${T + 3} L29 ${T + 4} Z`, H) +
          blob(`M29 ${T + 4} L25 ${T + 10} L32 ${T + 7} Z`, H) +
          blob(`M72 ${T - 2} L78 ${T + 3} L71 ${T + 4} Z`, H) +
          blob(`M71 ${T + 4} L75 ${T + 10} L68 ${T + 7} Z`, H) +
          line(`M38 ${T - 13} Q46 ${T - 17} 54 ${T - 11}`),
      }
    case 'curly':
      if (female)
        // A full cloud of curls all around the head — bumpy silhouette.
        return {
          back:
            puff(25, 49, 8, H) + puff(75, 49, 8, H) + puff(27, 60, 7, H) + puff(73, 60, 7, H),
          front:
            blob(`M28 52 Q26 30 50 26 Q74 30 72 52 Q50 42 28 52 Z`, H) +
            puff(29, 38, 8, H) +
            puff(38, 30, 8.5, H) +
            puff(50, 27, 9, H) +
            puff(62, 30, 8.5, H) +
            puff(71, 38, 8, H) +
            puff(28, 47, 5.5, H) +
            puff(72, 47, 5.5, H) +
            line(`M40 34 Q43 31 46 34`, 1.2, 0.5) +
            line(`M55 32 Q58 29 61 32`, 1.2, 0.5),
        }
      // Male: tight curl mop — an IRREGULAR mass of differently sized curls
      // hugging the skull down to the temples (a neat row of equal circles
      // reads as a frilly cap on light hair colours).
      return {
        back: '',
        front:
          cap(round) +
          burns +
          puff(30, T - 5, 5.5, H) +
          puff(70, T - 5, 5, H) +
          puff(50, T - 12, 6.5, H) +
          puff(35, T - 12, 6.5, H) +
          puff(65, T - 11, 5.5, H) +
          puff(43, T - 17, 7, H) +
          puff(58, T - 16, 6, H) +
          puff(50, T - 20, 7.5, H) +
          line(`M39 ${T - 11} Q42 ${T - 14} 45 ${T - 11}`, 1.2, 0.5) +
          line(`M55 ${T - 10} Q58 ${T - 13} 61 ${T - 10}`, 1.2, 0.5) +
          line(`M46 ${T - 6} Q49 ${T - 9} 52 ${T - 6}`, 1.2, 0.45),
      }
    case 'hime':
      // Hime cut: blunt straight fringe, cheek-length side locks, long straight back.
      return {
        back:
          blob(`M27 44 L24 90 L31 90 L33 58 Z`, H) + blob(`M73 44 L76 90 L69 90 L67 58 Z`, H),
        front:
          cap(`L70 ${T - 6} Q50 ${T - 9} 30 ${T - 6} L28 ${T}`) +
          blob(`M27 46 L26 66 Q29.5 69 33 66 L34 47 Q30 43 27 46 Z`, H) +
          blob(`M73 46 L74 66 Q70.5 69 67 66 L66 47 Q70 43 73 46 Z`, H) +
          line(`M32 ${T - 6.5} L68 ${T - 6.5}`, 1.1, 0.4),
      }

    // ── male ──────────────────────────────────────────────────────────────
    case 'short':
      // Classic short cut: natural hairline with a small side-swept fringe flick.
      return {
        back: '',
        front:
          cap(`Q66 ${T - 7} 58 ${T - 8} Q50 ${T - 10.5} 42 ${T - 8} Q34 ${T - 7} 28 ${T}`) +
          burns +
          blob(`M30 ${T - 4} Q34 ${T - 15} 49 ${T - 13} Q41 ${T - 9} 34 ${T - 3} Z`, H, 0.9) +
          line(`M49 ${T - 10} L50 ${T - 14}`, 1.3, 0.5) +
          line(`M57 ${T - 8} L58 ${T - 12}`, 1.3, 0.5) +
          capStrands,
      }
    case 'fringe':
      // French crop: dense short hair, a textured fringe falling onto the forehead.
      return {
        back: '',
        front:
          cap(
            `L72 ${T - 2} L67 ${T - 5} L63 ${T - 1.5} L58 ${T - 5.5} L54 ${T - 1.5} L50 ${T - 5.5} L46 ${T - 1.5} L41 ${T - 5.5} L37 ${T - 1.5} L33 ${T - 5} L28 ${T - 2}`,
          ) +
          burns +
          line(`M42 ${T - 7} L42 ${T - 12}`, 1.2, 0.45) +
          line(`M52 ${T - 8} L52 ${T - 13}`, 1.2, 0.45) +
          line(`M61 ${T - 7} L61 ${T - 12}`, 1.2, 0.45),
      }
    case 'sidePart':
      // A crisp parting on the left, volume combed over to the right.
      return {
        back: '',
        front:
          cap(`Q50 ${T - 11} 28 ${T}`) +
          burns +
          blob(`M42 ${T - 19} Q56 ${T - 27} 68 ${T - 12} Q56 ${T - 18} 45 ${T - 14} Z`, H) +
          `<path d="M40 ${T - 20} Q38 ${T - 12} 38.5 ${T - 5} L41 ${T - 5} Q40.5 ${T - 12} 42.5 ${T - 19} Z" fill="${SKIN}"/>` +
          line(`M46 ${T - 15} Q56 ${T - 20} 63 ${T - 13}`),
      }
    case 'curtains': {
      // Curtain cut: middle part, ear-length pieces sweeping down over the temples
      // and into the face.
      const curtain = (m: number): string =>
        blob(
          `M${50 + m * 0.5} ${T - 20} Q${50 - m * 13} ${T - 16} ${50 - m * 18.5} ${T - 6} Q${50 - m * 21.5} ${T + 1} ${50 - m * 21} ${T + 9} L${50 - m * 17} ${T + 7} Q${50 - m * 16.5} ${T - 1} ${50 - m * 13} ${T - 8} Q${50 - m * 9} ${T - 14} 50 ${T - 16} Z`,
          H,
        )
      return {
        back: '',
        front:
          cap(sleek) +
          `<path d="M48.5 ${T - 22} L50 ${T - 15} L51.5 ${T - 22} Z" fill="${SKIN}"/>` +
          curtain(1) +
          curtain(-1) +
          line(`M${50 - 16} ${T - 6} Q${50 - 18.5} ${T} ${50 - 18} ${T + 6}`, 1.2, 0.5) +
          line(`M${50 + 16} ${T - 6} Q${50 + 18.5} ${T} ${50 + 18} ${T + 6}`, 1.2, 0.5),
      }
    }
    case 'buzz': {
      // Very short / shaved: a low cap hugging the skull, muted with stubble specks.
      const speck = (x: number, y: number) =>
        `<circle cx="${x}" cy="${T - y}" r="0.7" fill="${SKIN_SHADE}" opacity="0.45"/>`
      return {
        back: '',
        front:
          `<path d="M29 ${T} Q28 ${T - 13} 50 ${T - 15} Q72 ${T - 13} 71 ${T} Q50 ${T - 4} 29 ${T} Z" fill="${H}" opacity="0.88" stroke="${outlineFor(H)}" stroke-width="0.8" stroke-linejoin="round"/>` +
          speck(38, 8) + speck(46, 11) + speck(54, 9) + speck(61, 11) + speck(34, 10) + speck(50, 13),
      }
    }
    case 'quiff':
      // Pompadour: one solid wave, tall and rounded over the forehead, sloping
      // back down to the right — upswept comb lines carry the motion.
      return {
        back: '',
        front:
          blob(
            `M28 ${T} Q27 ${T - 8} 31 ${T - 13} Q30 ${T - 27} 46 ${T - 29} Q62 ${T - 30} 66 ${T - 19} Q70 ${T - 10} 72 ${T} Q50 ${T - 8} 28 ${T} Z`,
            H,
          ) +
          burns +
          line(`M35 ${T - 8} Q34 ${T - 17} 42 ${T - 23}`) +
          line(`M46 ${T - 9} Q48 ${T - 17} 56 ${T - 22}`, 1.2, 0.45) +
          line(`M58 ${T - 9} Q60 ${T - 14} 63 ${T - 17}`, 1.2, 0.4),
      }
    case 'slick':
      // Slicked straight back: flat crown, slightly receded line, comb strokes.
      return {
        back: '',
        front:
          blob(`M29 ${T - 2} Q29 ${T - 20} 50 ${T - 21} Q71 ${T - 20} 71 ${T - 2} Q58 ${T - 9} 50 ${T - 8.5} Q42 ${T - 9} 29 ${T - 2} Z`, H) +
          burns +
          line(`M34 ${T - 16} Q50 ${T - 21} 66 ${T - 15}`, 1.1, 0.5) +
          line(`M32 ${T - 11} Q50 ${T - 16} 68 ${T - 10}`, 1.1, 0.5) +
          line(`M31 ${T - 6} Q50 ${T - 11} 69 ${T - 5}`, 1.1, 0.5),
      }
    case 'shaggy':
      // Shaggy mop: one full head of tousled hair, its ragged lower edge falling
      // over the forehead and down past the ears.
      return {
        back: '',
        front:
          blob(
            `M26 ${T + 8} Q23 ${T - 14} 50 ${T - 23} Q77 ${T - 14} 74 ${T + 8} L70 ${T + 3} L68 ${T + 9} L64 ${T + 2} Q66 ${T - 2} 62 ${T - 3} L58 ${T + 1} L55 ${T - 3.5} Q52 ${T - 1} 49 ${T - 2.5} L45 ${T + 1} L42 ${T - 3.5} Q38 ${T - 2} 36 ${T + 2} L32 ${T + 9} L30 ${T + 3} Z`,
            H,
          ) +
          line(`M35 ${T - 10} Q40 ${T - 15} 47 ${T - 15}`, 1.2, 0.5) +
          line(`M55 ${T - 15} Q61 ${T - 13} 64 ${T - 8}`, 1.2, 0.5),
      }
    case 'undercut':
      // Undercut: a full head of hair whose clipped sides show as a darker
      // tone zone (never bare skin — that read as smudges).
      return {
        back: '',
        front:
          cap(sleek) +
          `<path d="M28.5 ${T - 1} Q28 ${T - 13} 34 ${T - 16.5} L36.5 ${T - 7} Q34.5 ${T - 4} 34 ${T - 1} Z" fill="${S1}" opacity="0.5"/>` +
          `<path d="M71.5 ${T - 1} Q72 ${T - 13} 66 ${T - 16.5} L63.5 ${T - 7} Q65.5 ${T - 4} 66 ${T - 1} Z" fill="${S1}" opacity="0.5"/>` +
          `<path d="M27.6 ${T - 1} Q26.8 ${T + 4} 27.8 ${T + 8} L30.4 ${T + 6.5} Q30 ${T + 3} 30.4 ${T - 0.5} Z" fill="${S1}" opacity="0.5"/>` +
          `<path d="M72.4 ${T - 1} Q73.2 ${T + 4} 72.2 ${T + 8} L69.6 ${T + 6.5} Q70 ${T + 3} 69.6 ${T - 0.5} Z" fill="${S1}" opacity="0.5"/>` +
          line(`M40 ${T - 12} Q44 ${T - 19} 50 ${T - 21}`, 1.3, 0.55) +
          line(`M60 ${T - 12} Q56 ${T - 19} 50 ${T - 21}`, 1.3, 0.55),
      }
    case 'manbun':
      // Man bun: hair combed back into a small top knot — like the woman's bun,
      // just a smaller knot on a flatter head of hair.
      return {
        back:
          puff(50, 15, 6.5, H) +
          `<path d="M44.5 21 Q50 24 55.5 21" fill="none" stroke="${S1}" stroke-width="2.2" stroke-linecap="round"/>`,
        front:
          cap(sleek) +
          burns +
          line(`M37 ${T - 8} Q43 ${T - 17} 50 ${T - 19}`) +
          line(`M63 ${T - 8} Q57 ${T - 17} 50 ${T - 19}`),
      }
    case 'longM':
      // Long hair, worn the masculine way: tucked behind the ears so the whole
      // face stays open — the mane shows behind the head and beside the neck.
      return {
        back:
          blob(`M27 40 Q19 60 23 87 Q32 84 33 68 Q32 50 35 44 Z`, H) +
          blob(`M73 40 Q81 60 77 87 Q68 84 67 68 Q68 50 65 44 Z`, H),
        front:
          // Combed straight back with slightly receded temples (widow's peak) —
          // the strongest at-a-glance masculine cue for long hair.
          cap(
            `Q70 ${T - 2} 66 ${T - 9} Q60 ${T - 13} 53 ${T - 9.5} Q50 ${T - 8} 47 ${T - 9.5} Q40 ${T - 13} 34 ${T - 9} Q30 ${T - 2} 28 ${T}`,
          ) +
          line(`M36 ${T - 10} Q41 ${T - 17} 48 ${T - 19}`, 1.6, 0.6) +
          line(`M64 ${T - 10} Q59 ${T - 17} 52 ${T - 19}`, 1.6, 0.6) +
          line(`M25 56 Q24 68 26 78`) +
          line(`M75 56 Q76 68 74 78`),
      }

    default:
      return { back: '', front: cap(round) }
  }
}

// ─── Beard ───────────────────────────────────────────────────────────────────

function beardShape(style: string, H: string): string {
  const S1 = strandColor(H)
  // A fuller natural moustache with a dip under the nose — its top edge stays
  // BELOW the nose tip (y≈65.5), in the gap above the mouth (y≈72.5).
  const moustache = blob(
    `M39 69.5 Q44 65.5 49 67.5 L50 68.5 L51 67.5 Q56 65.5 61 69.5 Q56 72.8 50 71.6 Q44 72.8 39 69.5 Z`,
    H,
    0.9,
  )
  switch (style) {
    case 'mustache':
      return moustache
    case 'goatee':
      // Circle beard: moustache joined to a rounded chin patch.
      return (
        moustache +
        blob(`M43 73 Q42.5 85 50 86.5 Q57.5 85 57 73 Q56 77.5 50 78.2 Q44 77.5 43 73 Z`, H, 0.9) +
        `<path d="M47 81 Q50 83 53 81" fill="none" stroke="${S1}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>`
      )
    case 'stubble': {
      // A soft jaw shadow plus fine specks — no hard contour.
      const d = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="0.65" fill="${H}" opacity="0.5"/>`
      return (
        `<path d="M29 60 Q31 83 50 87.5 Q69 83 71 60 Q69 73 50 75.5 Q31 73 29 60 Z" fill="${H}" opacity="0.26"/>` +
        `<path d="M40 69.5 Q50 66.5 60 69.5 Q57 72.3 50 71.3 Q43 72.3 40 69.5 Z" fill="${H}" opacity="0.26"/>` +
        d(36, 70) + d(42, 76) + d(50, 79) + d(58, 76) + d(64, 70) + d(45, 71) + d(55, 71) + d(50, 74)
      )
    }
    case 'chinstrap':
      // A thin, crisp strap tracing the jawline.
      return (
        `<path d="M30 55 Q31 82 50 87.5 Q69 82 70 55" fill="none" stroke="${H}" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M30 55 Q31 82 50 87.5 Q69 82 70 55" fill="none" stroke="${outlineFor(H)}" stroke-width="0.8" stroke-linecap="round" opacity="0.6"/>`
      )
    default: // full
      return (
        blob(
          `M28 54 Q28 70 33 80 Q39 89 50 90 Q61 89 67 80 Q72 70 72 54 Q70 68 61 72 Q56 74 50 74 Q44 74 39 72 Q30 68 28 54 Z`,
          H,
        ) +
        `<path d="M42 79 Q46 83 50 83 Q54 83 58 79" fill="none" stroke="${S1}" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>` +
        `<path d="M35 70 Q37 76 41 80" fill="none" stroke="${S1}" stroke-width="1.1" stroke-linecap="round" opacity="0.45"/>` +
        `<path d="M65 70 Q63 76 59 80" fill="none" stroke="${S1}" stroke-width="1.1" stroke-linecap="round" opacity="0.45"/>` +
        moustache
      )
  }
}

// ─── Glasses ─────────────────────────────────────────────────────────────────

function glassesShapeSvg(shape: string, colorId: string): string {
  const c = GLASSES_COLOR_HEX[colorId] ?? FRAME
  const temples = `<path d="M32 55 H27 M68 55 H73" fill="none" stroke="${c}" stroke-linecap="round"/>`
  switch (shape) {
    case 'square':
      return `<g fill="none" stroke="${c}" stroke-width="2.8" stroke-linejoin="round"><rect x="31" y="48.5" width="16" height="13" rx="3"/><rect x="53" y="48.5" width="16" height="13" rx="3"/><path d="M47 55 H53"/>${temples}</g>`
    case 'rectangle':
      return `<g fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"><rect x="31" y="51" width="16" height="8" rx="2.5"/><rect x="53" y="51" width="16" height="8" rx="2.5"/><path d="M47 55 H53"/>${temples}</g>`
    case 'oversized':
      return `<g stroke="${c}" stroke-width="3.6"><circle cx="39" cy="55" r="9" fill="rgba(0,0,0,0.05)"/><circle cx="61" cy="55" r="9" fill="rgba(0,0,0,0.05)"/><path d="M48 55 H52" fill="none"/><path d="M30 55 H26 M70 55 H74" fill="none" stroke-linecap="round"/></g>`
    case 'cat':
      return `<g fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"><path d="M30 50 Q40 47 49 52 Q49 61 39 61 Q30 60 30 50 Z"/><path d="M70 50 Q60 47 51 52 Q51 61 61 61 Q70 60 70 50 Z"/><path d="M49 54 H51"/>${temples}</g>`
    case 'rimless':
      return `<g fill="none" stroke="${c}" stroke-width="1.3" stroke-linejoin="round"><rect x="32" y="51" width="15" height="8" rx="3.5"/><rect x="53" y="51" width="15" height="8" rx="3.5"/><path d="M47 55 H53"/>${temples}</g>`
    default: // round
      return `<g fill="none" stroke="${c}" stroke-width="2.6"><circle cx="40" cy="55" r="7.5"/><circle cx="60" cy="55" r="7.5"/><path d="M47.5 55 H52.5"/>${temples}</g>`
  }
}

// ─── Assemble ────────────────────────────────────────────────────────────────

export function avatarSvg(attrs: AvatarAttrs, color: string, letter: string): string {
  const female = attrs.gender !== 'm' // default female, matching the text Renderer
  const beard = attrs.beard === true
  const glasses = attrs.glasses === true
  const bald = attrs.bald === true
  const hash = letter.charCodeAt(0)
  const H = hairColor(attrs, hash * 7 + 3)

  const styleId = resolveHairstyle(attrs.gender, attrs.hairstyle, letter)
  const { back, front } = hair(styleId, female, H)
  const beardSvg = beard ? beardShape(String(attrs.beardStyle ?? 'full'), H) : ''
  const glassesSvg = glasses
    ? glassesShapeSvg(String(attrs.glassesShape ?? 'round'), String(attrs.glassesColor ?? 'black'))
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="49" fill="${color}"/>
    <circle cx="50" cy="57" r="49" fill="rgba(0,0,0,0.08)"/>
    ${bald ? '' : back}
    <path d="${facePath(female)}" fill="${SKIN}"/>
    ${bald ? `<path d="M34 44 Q50 32 66 44 Q50 40 34 44 Z" fill="rgba(255,255,255,0.18)"/>` : ''}
    ${beardSvg}
    ${bald ? '' : front}
    ${brows(female, H)}
    ${EYES}
    ${NOSE}
    ${glassesSvg}
    ${mouth(female)}
    <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <circle cx="79" cy="79" r="15" fill="${FRAME}"/>
    <text x="79" y="85" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-weight="700" fill="#fff">${letter}</text>
  </svg>`
}

export function avatarDataUri(attrs: AvatarAttrs, color: string, letter: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg(attrs, color, letter))}`
}
