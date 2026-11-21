# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary users:** Dutch primary-school children (roughly ages 4–10) playing independently on a family phone, tablet (portrait or landscape), or laptop/desktop (with a physical QWERTY keyboard for Typepret).
- **Secondary users:** Parents sitting alongside their child, choosing a game or difficulty level, and reinforcing learning offline.

## Product Purpose

Spellen (`games.tijmenvangurp.nl`) is a public, static collection of Dutch educational and classic games built for family use first and shared publicly. It makes calm, focused learning and play possible across math, phonics/reading, touch-typing, French listening, chess, geography, logic mysteries, gears, alchemy, memory, sudoku, word search, and board games. Success means a child can open a game directly, understand what to do without reading walls of text, make mistakes safely, and grow at their own pace without sensory overload, ads, or accounts.

## Positioning

Unlike commercial kids' game portals and ed-tech platforms, Spellen runs 100% locally in the browser with zero backend, zero accounts or login walls, zero analytics or trackers, zero ads, and zero external network requests during play. Learning is mistake-friendly ("foutvriendelijk") by design: stars reward first-try accuracy without taking earned progress away on mistakes, hints step up gradually ("hinttrap") instead of spoiling answers immediately, and difficulty adapts to the child (`ADR 0026`).

## Operating Context

- Used on shared family devices: mobile phones (390 px), tablets (1024 px portrait and landscape), and desktop/laptop browsers with physical QWERTY keyboards (required for Typepret).
- Played in short, self-contained rounds ("rondes") or lessons ("lessen"), either solo or pass-and-play together on one screen (Chess, Vier op een Rij, Ganzenbord).
- Pre-generated Dutch (`nl_BE-nathalie-medium`, CC0) and French (Piper Tom) speech audio supports early readers and non-readers; speech and sound effects are toggled independently.
- Progress and local settings persist only in browser `localStorage` on the device.

## Capabilities and Constraints

- **17 playable games** registered in `libs/entities/game/model/game-catalog.ts` (Sudoku, Tafel Topper, Pijlen, Waar is Wobbel?, Woordzoeker, Mengelmoes, Draaiwerk, Pokémon Memory, Wie is deze Pokémon?, Schaken [les, partij met lokale Stockfish WASM, puzzels], Vlaggenreis [vlaggen + kaartpuzzel], Bonjour !, Letterpret, Vier op een Rij, Ganzenbord, Typepret, Wie was het?).
- **Static & privacy-first:** Deployed as a static Cloudflare Worker (`games`). Strict CSP (`apps/games/public/_headers`) with `default-src 'self'` and `noindex`; no external fonts, CDNs, trackers, analytics, or remote images. Adding any backend requires an ADR and explicit maintainer approval.
- **Public repository rules:** Never include secrets, tokens, internal hostnames, IP addresses, or personal data anywhere in code, assets, or docs.
- **Domain terminology:** Follows `GLOSSARY.md` (Dutch UI language; e.g. _Spel_, _Ronde_, _Sterren_, _Hinttrap_, _Buit_, _Dief_, _Klank_, _Reeks_, _Vingerzone_).
- **Undecided / future:** Optional parent accounts and cross-device sync remain documented as future architectural options (`ADR 0012`, `ADR 0013`) and are not currently built or required.

## Brand Commitments

- **Name:** Spellen (`games.tijmenvangurp.nl`).
- **Voice:** Dutch, concise, encouraging, child-friendly, and mistake-friendly — never punitive, noisy, or patronizing.
- **Assets:** Local, offline-bundled thumbnails (`apps/games/public/thumbnails/`), local sprites/maps/flags, local pre-generated speech audio (`apps/games/public/audio/`), and MIT/CC0/public-domain sources tracked in `LICENSES/` and `VENDORED.md`.

## Evidence on Hand

- 17 implemented games with unit, component, and Playwright E2E coverage (`tests/`, `e2e/`).
- Architecture Decision Records in `docs/adr/0001`–`0032` and educational/library research in `docs/research/`.
- Domain glossary in `GLOSSARY.md` and visual/UI rules in `docs/design-system.md`.
- Local pre-generated Dutch and French audio catalogs verified by `pnpm run audio:check` and `pnpm run audio:check:french`.
- **Absences not to fabricate:** No user metrics, testimonials, school endorsements, or third-party reviews exist; future copy must not invent them.

## Product Principles

1. **Calm over stimulation:** Remove noise, ads, timers that punish, and decorative clutter so children can focus on the puzzle or lesson.
2. **Privacy by architecture:** Keep everything static, local, and account-free with zero external runtime requests.
3. **Mistake-friendly learning:** Never punish errors; use progressive hints ("hinttrap"), adaptive levels, and local speech so children build confidence.
4. **Immediate access on any family device:** Work smoothly across phones, tablets (portrait and landscape), and keyboards with generous touch targets and zero setup friction.
5. **Real craft in every game:** Ground every game in real rules, verifiable generators/engines, and clear Dutch domain language.

## Accessibility & Inclusion

- Minimum 44 × 44 px touch targets and `env(safe-area-inset-*)` support on mobile/tablet screens.
- Independent speech ("voorlezen") and sound-effect toggles so early readers and children who prefer quiet play are both supported.
- Full keyboard navigation, focus visibility, ARIA labels/live regions, and strict respect for `prefers-reduced-motion`.
- Never rely on color alone to distinguish players, pieces, or feedback states.
