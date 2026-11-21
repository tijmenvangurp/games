---
name: Spellen
description: Calm, tactile Elevated Paper Craft design system for Dutch children's educational games.
colors:
  indigo-accent: "oklch(0.485 0.125 268)"
  indigo-deep: "oklch(0.435 0.13 268)"
  indigo-wash: "oklch(0.945 0.026 268)"
  indigo-ink-on-fill: "oklch(0.985 0.005 268)"
  ivory-paper: "oklch(0.968 0.017 86)"
  warm-recess: "oklch(0.946 0.02 86)"
  cotton-card: "oklch(0.994 0.006 86)"
  cotton-lifted: "oklch(0.998 0.004 86)"
  quiet-stone: "oklch(0.935 0.019 86)"
  deep-ink: "oklch(0.25 0.024 148)"
  slate-ink: "oklch(0.45 0.024 120)"
  warm-hairline: "oklch(0.845 0.022 86)"
  warm-edge: "oklch(0.74 0.028 82)"
  botanical-green: "oklch(0.465 0.115 152)"
  botanical-wash: "oklch(0.945 0.032 152)"
  botanical-ink: "oklch(0.35 0.095 152)"
  warm-ochre: "oklch(0.55 0.14 68)"
  ochre-wash: "oklch(0.955 0.042 78)"
  ochre-ink: "oklch(0.39 0.115 64)"
  terracotta-red: "oklch(0.51 0.175 24)"
  terracotta-wash: "oklch(0.952 0.032 24)"
  terracotta-ink: "oklch(0.41 0.15 24)"
  parchment-paper: "oklch(0.978 0.028 88)"
  parchment-edge: "oklch(0.73 0.088 80)"
  parchment-ink: "oklch(0.31 0.055 56)"
typography:
  display:
    fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif'
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif'
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", system-ui, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0em"
  body:
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  body-sm:
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
  label:
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
  label-xs:
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", system-ui, sans-serif'
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
  mono:
    fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace'
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.025em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  pill: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  2xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.indigo-accent}"
    textColor: "{colors.indigo-ink-on-fill}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-deep}"
    textColor: "{colors.indigo-ink-on-fill}"
  button-outline:
    backgroundColor: "{colors.cotton-card}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-success:
    backgroundColor: "{colors.botanical-green}"
    textColor: "{colors.indigo-ink-on-fill}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "56px"
  choice-card:
    backgroundColor: "{colors.cotton-card}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.md}"
    padding: "12px"
  choice-card-selected:
    backgroundColor: "{colors.indigo-wash}"
    textColor: "{colors.indigo-accent}"
    rounded: "{rounded.md}"
  panel-card:
    backgroundColor: "{colors.cotton-card}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  status-banner-success:
    backgroundColor: "{colors.botanical-wash}"
    textColor: "{colors.botanical-ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  badge-primary:
    backgroundColor: "{colors.indigo-wash}"
    textColor: "{colors.indigo-accent}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  dialog-default:
    backgroundColor: "{colors.cotton-lifted}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Spellen

## Overview

**Creative North Star: "The Paper Workbench"**

Spellen looks and feels like a calm Montessori paper workbench: warm ivory paper laid flat under soft daylight, deep readable ink, crisp cotton cards with gentle physical weight, and one craftsman indigo accent. Children should never have to fight through rainbow gradients, flashing badges, or decorative chrome just to read a question or move a piece.

Every visual decision serves attention and touch clarity. Interactive controls—buttons, choice cards, answer tiles, and disclosures—carry subtle paper lift at rest and a quiet tactile press on touch so kids immediately feel what is clickable without visual noise. Color is reserved strictly for meaning: action and selection in indigo, feedback in botanical green, warm ochre, and terracotta red, and playful hues only inside game pieces themselves.

All tokens live in a single zero-runtime Vanilla Extract contract (`libs/shared/ui/tokens.css.ts`) bridged directly to Tailwind CSS v4 `@theme inline` and placed in `@layer components`, keeping styling type-safe, offline-only, and free of `!important`.

**Key Characteristics:**

- Warm ivory paper ground (`ivory-paper`) with brighter cotton paper cards (`cotton-card`) and recessed warm wells (`warm-recess`).
- Single craftsman indigo accent (`indigo-accent`) paired with meaning-only feedback triplets (base, soft wash, high-contrast ink).
- Tactile, calm elevation: soft warm-ink drop shadows and hairline borders instead of harsh black shadows or flat wireframes.
- System editorial serif for screen and game titles paired with rounded system sans for friendly UI legibility and `tabular-nums` on every counter.
- Unified line-icon family (Lucide for UI controls, Phosphor for game identity); zero emojis in UI chrome.

## Colors

A quiet warm-paper neutral foundation anchored by a single craftsman indigo accent, three semantic feedback triplets (each pairing a soft wash with a dark, accessible ink), and an optional parchment surface reserved for historic board games.

### Primary

- **Craftsman Indigo** (`indigo-accent`): Primary action, active selection border/text, focus rings, progress fill, and text caret. Deepens to **Indigo Deep** (`indigo-deep`) on hover and softens to **Indigo Wash** (`indigo-wash`) for selected choice cards, active icon badges, and primary status banners.

### Neutral

- **Ivory Paper** (`ivory-paper`): Global page background with a faint overhead daylight glow, keeping screens warm and low-glare.
- **Warm Recess** (`warm-recess`): Recessed trays, hover fills on cards, and subtle nested fieldsets (such as chess player setup blocks).
- **Cotton Card** (`cotton-card`): Primary surface for game panels, menu cards, inputs, and outline buttons. Lifts to **Cotton Lifted** (`cotton-lifted`) for modal dialogs.
- **Quiet Stone** (`quiet-stone`): Muted chips, progress tracks, icon wells, and disabled/inactive answer states.
- **Deep Ink** (`deep-ink`): Primary body copy, headings, and game markings (>12:1 contrast on cotton paper).
- **Slate Ink** (`slate-ink`): Secondary descriptions, subtitles, and captions (≥4.5:1 contrast on both paper and cards).
- **Warm Hairline** (`warm-hairline`) & **Warm Edge** (`warm-edge`): 1px structural borders at rest and slightly firmer tactile edges on hover.

### Semantic & Domain

- **Botanical Green** (`botanical-green` / `botanical-wash` / `botanical-ink`): Correct answers, solved puzzles, start/continue actions, and completion banners.
- **Warm Ochre** (`warm-ochre` / `ochre-wash` / `ochre-ink`): Hints, gentle retry prompts, and stars/streaks.
- **Terracotta Red** (`terracotta-red` / `terracotta-wash` / `terracotta-ink`): Mistakes, conflicts, check alerts, and blocked moves—deliberately darker and earthier than board-game pawn red so a red game piece never reads as an error.
- **Historic Parchment** (`parchment-paper` / `parchment-edge` / `parchment-ink`): Reserved exclusively for Ganzenbord event dialogs so they harmonize with the historic board illustration while sharing the same dialog mechanics.

### Named Rules

**The Meaning-Only Color Rule.** Never use raw Tailwind palette scales (`slate`, `emerald`, `rose`, `sky`, `amber`) or decorative gradients in UI chrome. Indigo is exclusively for action and selection; green, ochre, and terracotta are exclusively for feedback.

**The Player-Piece Separation Rule.** Player and pawn colors belong strictly to game pieces (board discs, goose pawns, element badges). Active player emphasis uses neutral ink/border contrast or `indigo-accent`, never feedback green or red.

## Typography

**Display Font:** Georgia (with Iowan Old Style, Palatino Linotype, Book Antiqua, serif fallback)
**Body Font:** System rounded sans (`ui-rounded`, SF Pro Rounded, Segoe UI Variable Display, system-ui)
**Mono Font:** System monospace (`ui-monospace`, SFMono-Regular, Menlo, Consolas)

**Character:** Editorial storybook warmth meets friendly legibility. Regular-weight serifs give screen and game headings quiet authority without shouting, while rounded sans keeps buttons, choices, and short child-facing instructions crisp and approachable—with zero external webfonts.

### Hierarchy

- **Display** (400, 2.25rem–3rem, 1.15): Home screen title (`Spellen`) and large word/country prompts.
- **Headline** (400, 1.5rem, 1.25): `PageHeader` game titles, setup panel headings (`Nieuw spel`), dialog titles, and menu card names.
- **Title** (700, 1rem–1.125rem, 1.35): HUD headings, player names, and prominent status messages.
- **Body** (400–600, 0.875rem–0.9375rem, 1.55): Short instructions, game card descriptions, and parent tips (keep readable prose concise).
- **Label** (700, 0.75rem–0.875rem, 1.2): Fieldset legends, button text, badges, and progress counts.
- **Mono** (900, 1.875rem–2.25rem, 1.2): Typing target characters in Typepret only.

### Named Rules

**The Serif-For-Titles Rule.** Screen headings, setup headings, card titles, and dialog titles use the display serif (`font-display`) at weight 400 with tight tracking (`-0.02em`), never heavy all-caps sans.

**The Tabular Counter Rule.** Every star count, streak, round counter, move number, and progress ratio (such as 4 of 242 or 1 of 10) uses `tabular-nums` so digits never jitter during play.

## Layout

Spellen uses centered, calm single-column and asymmetric two-column workbenches with generous outer breathing room and safe-area respect (`pt-safe`, `pb-safe`).

- **Containers:** Home menu spans `max-w-5xl` (1024 px) with a 1 / 2 / 3-column responsive card grid (`<640px` / `sm` / `lg`). Standard games center in `max-w-4xl` (`GameShell`); setup panels sit cleanly in `max-w-xl`–`max-w-2xl`; workbench games (Mengelmoes, Draaiwerk, Wie was het?) expand to `max-w-6xl` (`wide` or `wideLandscape`) and lock to `100svh` on tablet+ (`fitViewport`) so boards and trays stay visible without page scrolling.
- **Header chrome:** `GameShell` renders a full-width top bar (`PageHeader`) separated by a 1px `warm-hairline` bottom border: back button and title/subtitle on the left, speech toggle, sound toggle, and optional new-game button pinned cleanly to the right edge.
- **Spacing rhythm:** 4 px base grid (`xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 24px`, `2xl: 32px`). Group tightly related controls at `8px` (`gap-2`), separate panels at `12px–16px` (`gap-3`–`gap-4`), and separate major setup groups at `20px` (`mt-5`).
- **Touch targets:** Every interactive control maintains a minimum `44 × 44 px` hit area on mobile (390 px) and tablet (1024 px) with zero horizontal overflow.

## Elevation & Depth

Tactile paper layering—a hybrid of tonal surface stepping (`ivory-paper` → `cotton-card` → `cotton-lifted`) and soft, warm-ink directional shadows. Interactive controls carry a subtle 1px bottom bevel shadow that compresses on press (`translateY(1px)`), giving children physical confirmation without harsh neobrutalist blocks or glossy 3D skeuomorphism.

### Shadow Vocabulary

- **Tactile** (`inset 0 1px 0 oklch(1 0 0 / 0.85), 0 2px 0 oklch(0.74 0.028 82 / 0.65), 0 4px 10px -4px oklch(0.25 0.024 148 / 0.14)`): Resting outline buttons, choice cards, and answer options.
- **Tactile Primary / Success** (`inset 0 1px 0 oklch(1 0 0 / 0.24), 0 2.5px 0 oklch(0.33 0.12 268 / 0.78), 0 6px 14px -6px oklch(0.485 0.125 268 / 0.42)` and botanical green equivalent): Solid call-to-action buttons (`Spelen`, `Volgende`).
- **Panel** (`inset 0 1px 0 oklch(1 0 0 / 0.85), 0 1px 2px oklch(0.25 0.024 148 / 0.06), 0 14px 30px -22px oklch(0.25 0.024 148 / 0.26)`): Resting panels, HUD bars, disclosures, and menu cards.
- **Card Hover** (`inset 0 1px 0 oklch(1 0 0 / 0.9), 0 3px 6px oklch(0.25 0.024 148 / 0.08), 0 22px 42px -20px oklch(0.25 0.024 148 / 0.32)`): Interactive menu and hub cards lifting `-2px` to `-3px` on pointer hover.
- **Dialog** (`inset 0 1px 0 oklch(1 0 0 / 0.92), 0 6px 16px oklch(0.25 0.024 148 / 0.1), 0 32px 68px -24px oklch(0.25 0.024 148 / 0.38)`): Floating modals above a blurred warm-ink backdrop (`backdrop-filter: blur(4px)`).

### Named Rules

**The Warm-Ink Shadow Rule.** Every shadow is tinted with `deep-ink` (or the button's own hue), never cold gray or pure black, so elevation reads as warm paper depth.

## Shapes

Soft, approachable geometry scaled strictly by container size—never mixing pill-like `rounded-3xl` panels next to sharp `rounded-lg` buttons on the same screen.

- **Small (`8px` / `0.5rem`):** Inner icon wells and tight token tiles.
- **Medium (`12px` / `0.75rem`):** All interactive controls—buttons, choice cards, answer options, status banners, and text inputs.
- **Large (`16px` / `1rem`):** Panels, HUD bars, disclosures, and game menu cards.
- **Extra-large (`20px` / `1.25rem`):** Modal dialogs.
- **Pill (`9999px`):** Badges, progress tracks/fills, and circular avatars/icon buttons.
- **Borders:** Crisp `1px` `warm-hairline` on containers and buttons; `1.5px` on selectable choice/answer cards so selected state borders read immediately.

## Components

All shared primitives live in `libs/shared/ui/` with zero-runtime Vanilla Extract recipes (`*.css.ts`) placed in `@layer components`.

### Buttons (`Button`)

Tactile, confident controls with consistent 44 px minimum touch height (`default: 44px`, `sm: 38px`, `lg: 56px`, `icon: 44 × 44px`).

- **Shape:** Medium rounded edges (`12px` radius) and `1px` border.
- **Variants:** `default` (`indigo-accent` fill + tactile indigo lip), `success` (`botanical-green` fill for Start/Next/Again), `outline` (`cotton-card` + `warm-hairline` + tactile paper shadow), `soft` (`indigo-wash` + `indigo-accent`), `ghost` (transparent, `quiet-stone` on hover), `danger` (`terracotta-red`).
- **Hover / Focus / Active:** Smooth `140ms` exponential ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`), `4px` `focusRing` halo on `:focus-visible`, subtle `1px` downward press on `:active`, and `0.48` opacity with no shadow when disabled.

### Choice Cards & Option Pickers (`ChoiceCard`, `OptionPicker`)

Tactile selection tiles for game setup screens.

- **Shape:** Medium rounded edges (`12px` radius), `1.5px` border, `default` height (`88px` min) for icon/symbol cards and `compact` height (`52px` min) for text-only options.
- **State:** Unselected uses `cotton-card` + `warm-hairline` + tactile shadow; selected switches to `indigo-wash`, `indigo-accent` border & label, and a subtle inset indigo hairline.

### Answer Options (`AnswerOption`)

Uniform quiz answer tiles across Vlaggenreis, Tafel Topper, and Pokémon Quiz.

- **Shape:** Medium rounded edges (`12px` radius), `1.5px` border, sizes `sm` (`48px`), `md` (`56px`), `lg` (`60px` bold numeral).
- **States:** `default` (paper tactile), `correct` (`botanical-wash` + `botanical-green` border + `botanical-ink` + check icon), `wrong` (`terracotta-wash` + `terracotta-red` + cross icon), `warn` (`ochre-wash` + `warm-ochre` + cross icon for gentle retry), `muted` (`quiet-stone` at `55%` opacity).

### Panels & Cards (`Panel`, `GameMenu`)

Consistent cotton-paper containers replacing ad-hoc card divs.

- **Corner Style:** Large rounded edges (`16px` radius) with `1px` `warm-hairline` border and `panel` shadow.
- **Surfaces:** `card` (`cotton-card`), `subtle` (`warm-recess`, flat), `elevated` (`cotton-lifted` + `dialog` shadow), `dashed` (workbenches/drop zones).
- **GameMenu cards:** Equal-height vertical cards with a 16:10 thumbnail separated by a hairline divider, an icon chip + serif title, and a short description. Entire card is clickable with a `-3px` hover lift.

### Status Banners (`StatusBanner`)

Semantic live-region strips (`aria-live="polite"`) for coach bubbles, hints, and round status.

- **Style:** Medium rounded edges (`12px` radius), `1px` tinted border, `10px 16px` padding, optional leading icon and trailing action (such as `SpeechButton` or `Button`).
- **Tones:** `neutral`, `primary`, `success`, `warning`, `danger`—each using its wash fill and high-contrast ink token.

### Dialogs (`Dialog`, `CelebrationDialog`)

Centered modal overlays for celebrations, new discoveries, lab book, pawn promotion, and board-game events.

- **Style:** Extra-large rounded edges (`20px` radius), `24px` padding, `cotton-lifted` surface (or `parchment-paper` for Ganzenbord), `dialog` shadow, and blurred warm-ink backdrop.
- **Behavior:** Spring entrance that collapses to opacity-only under `prefers-reduced-motion`, Escape key dismissal, and optional confetti overlay behind the card.

### HUD Primitives (`ScoreHeader`, `ProgressBar`, `Badge`, `Disclosure`)

- **`ScoreHeader`:** Compact `Panel` header bar pairing tabular progress text on the left with Lucide `Star` and `Flame` counters on the right.
- **`ProgressBar`:** Pill-shaped track (`6px` or `8px`) with animated `indigo-accent` or `botanical-green` fill and full ARIA progressbar attributes.
- **`Badge`:** Pill chip (`neutral`, `primary`, `primarySolid`, `success`, `warning`) with `tabular-nums`.
- **`Disclosure`:** Native `<details>` inside a `16px` cotton card with a `44px` minimum summary bar and rotating chevron.

### Navigation (`GameShell`, `PageHeader`)

Full-width top bar with ghost back button (`44 × 44px`), truncated serif `h1` and muted subtitle on the left, and right-aligned `SpeechToggle`, `SoundToggle`, and optional `Nieuw spel` outline icon button.

## Do's and Don'ts

### Do:

- **Do** define all new design tokens in `libs/shared/ui/tokens.css.ts` and compose component styles via Vanilla Extract recipes in `@layer components` merged with `cn()`.
- **Do** use `GameShell`, `Panel`, `Button`, `OptionPicker`, `AnswerOption`, `StatusBanner`, `Dialog`, `ProgressBar`, `ScoreHeader`, `Badge`, and `Disclosure` before building custom markup.
- **Do** keep touch targets at least `44 × 44 px`, respect `pt-safe`/`pb-safe`, and verify layouts at both `390 × 844` and `1024 × 768` with zero horizontal overflow.
- **Do** use `tabular-nums` on every counter, score, star count, and progress indicator.
- **Do** respect `prefers-reduced-motion` on all transitions, spring dialogs, and board animations.

### Don't:

- **Don't** use raw Tailwind color palettes (`bg-slate-*`, `bg-emerald-*`, `bg-rose-*`, `bg-amber-*`, `bg-sky-*`) or hex literals in UI chrome.
- **Don't** use `!important` anywhere in CSS; rely on the `@layer theme, base, components, utilities, games, motion` cascade.
- **Don't** put emojis in UI chrome (buttons, headers, tabs, status counters); use Lucide or Phosphor icons via `libs/shared/ui/`. Emojis are only for learning content or player avatars.
- **Don't** add rainbow gradients, eyebrow kickers above headings, hard zero-blur drop shadows, or external fonts/images/requests.
- **Don't** mix unrelated corner radii (`rounded-3xl` panels next to `rounded-lg` cards) within the same screen.
