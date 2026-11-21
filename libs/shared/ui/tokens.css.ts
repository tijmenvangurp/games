import { createGlobalTheme, createGlobalThemeContract, globalLayer } from "@vanilla-extract/css";

/**
 * Shared CSS cascade layers declared by `apps/games/src/app/styles/index.css`.
 * Design-system component styles live in `components` (above `base`, below
 * `utilities`), so Tailwind layout utilities passed via `className` override
 * defaults cleanly without `!important`.
 */
export const componentsLayer = globalLayer("components");

/**
 * Type-safe design token contract for Spellen.
 *
 * Every leaf name maps directly to a `:root` CSS custom property (e.g.
 * `background` -> `--background`), so Vanilla Extract stylesheets (`vars.*`)
 * and Tailwind v4 utilities (`bg-background`, `text-foreground`) share one
 * single source of truth.
 */
export const vars = createGlobalThemeContract({
  color: {
    background: "background",
    backgroundSubtle: "background-subtle",
    foreground: "foreground",
    card: "card",
    cardElevated: "card-elevated",
    muted: "muted",
    mutedForeground: "muted-foreground",
    border: "border",
    borderStrong: "border-strong",
    primary: "primary",
    primaryHover: "primary-hover",
    primarySoft: "primary-soft",
    primaryForeground: "primary-foreground",
    success: "success",
    successHover: "success-hover",
    successSoft: "success-soft",
    successInk: "success-ink",
    successForeground: "success-foreground",
    warning: "warning",
    warningSoft: "warning-soft",
    warningInk: "warning-ink",
    danger: "danger",
    dangerHover: "danger-hover",
    dangerSoft: "danger-soft",
    dangerInk: "danger-ink",
    dangerForeground: "danger-foreground",
    backdrop: "backdrop",
    focusRing: "focus-ring",
    selectionBg: "selection-bg",
    playerOne: "player-one",
    playerTwo: "player-two",
    pawnRed: "pawn-red",
    pawnOrange: "pawn-orange",
    pawnGreen: "pawn-green",
    pawnBlue: "pawn-blue",
    pawnViolet: "pawn-violet",
    pawnPink: "pawn-pink",
    parchmentBg: "parchment-bg",
    parchmentSurface: "parchment-surface",
    parchmentBorder: "parchment-border",
    parchmentInk: "parchment-ink",
  },
  font: {
    sans: "ds-font-sans",
    display: "ds-font-display",
    mono: "ds-font-mono",
  },
  radius: {
    sm: "ds-radius-sm",
    md: "ds-radius-md",
    lg: "ds-radius-lg",
    xl: "ds-radius-xl",
    pill: "ds-radius-pill",
  },
  space: {
    xs: "ds-space-xs",
    sm: "ds-space-sm",
    md: "ds-space-md",
    lg: "ds-space-lg",
    xl: "ds-space-xl",
    "2xl": "ds-space-2xl",
  },
  shadow: {
    none: "ds-shadow-none",
    tactile: "ds-shadow-tactile",
    tactilePrimary: "ds-shadow-tactile-primary",
    tactileSuccess: "ds-shadow-tactile-success",
    panel: "ds-shadow-panel",
    cardHover: "ds-shadow-card-hover",
    dialog: "ds-shadow-dialog",
  },
  motion: {
    fast: "ds-motion-fast",
    normal: "ds-motion-normal",
    slow: "ds-motion-slow",
    easeOut: "ds-motion-ease-out",
  },
});

createGlobalTheme(":root", vars, {
  color: {
    /* Rustige ivoor-papier basis: warm papier, diepe inkt en één rijke indigo-accentkleur. */
    background: "oklch(0.968 0.017 86)",
    backgroundSubtle: "oklch(0.946 0.02 86)",
    foreground: "oklch(0.25 0.024 148)",
    card: "oklch(0.994 0.006 86)",
    cardElevated: "oklch(0.998 0.004 86)",
    muted: "oklch(0.935 0.019 86)",
    mutedForeground: "oklch(0.45 0.024 120)",
    border: "oklch(0.845 0.022 86)",
    borderStrong: "oklch(0.74 0.028 82)",
    primary: "oklch(0.485 0.125 268)",
    primaryHover: "oklch(0.435 0.13 268)",
    primarySoft: "oklch(0.945 0.026 268)",
    primaryForeground: "oklch(0.985 0.005 268)",
    success: "oklch(0.465 0.115 152)",
    successHover: "oklch(0.415 0.115 152)",
    successSoft: "oklch(0.945 0.032 152)",
    successInk: "oklch(0.35 0.095 152)",
    successForeground: "oklch(0.985 0.008 152)",
    warning: "oklch(0.55 0.14 68)",
    warningSoft: "oklch(0.955 0.042 78)",
    warningInk: "oklch(0.39 0.115 64)",
    danger: "oklch(0.51 0.175 24)",
    dangerHover: "oklch(0.46 0.175 24)",
    dangerSoft: "oklch(0.952 0.032 24)",
    dangerInk: "oklch(0.41 0.15 24)",
    dangerForeground: "oklch(0.985 0.006 24)",
    backdrop: "oklch(0.24 0.024 145 / 0.36)",
    focusRing: "oklch(0.485 0.125 268 / 0.28)",
    selectionBg: "oklch(0.89 0.05 268)",
    /* Vaste kleuren voor Vier op een Rij blijven rustig van toon. */
    playerOne: "oklch(0.485 0.125 268)",
    playerTwo: "oklch(0.58 0.2 30)",
    /* Vrolijke pionkleuren voor bordspellen (los van feedbackkleuren). */
    pawnRed: "oklch(0.6 0.21 22)",
    pawnOrange: "oklch(0.66 0.17 55)",
    pawnGreen: "oklch(0.62 0.16 148)",
    pawnBlue: "oklch(0.58 0.19 255)",
    pawnViolet: "oklch(0.56 0.2 300)",
    pawnPink: "oklch(0.64 0.2 350)",
    /* Perkament-tokens voor historische bordspellen zoals Ganzenbord. */
    parchmentBg: "oklch(0.978 0.028 88)",
    parchmentSurface: "oklch(0.915 0.048 84)",
    parchmentBorder: "oklch(0.73 0.088 80)",
    parchmentInk: "oklch(0.31 0.055 56)",
  },
  font: {
    sans: 'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", system-ui, -apple-system, "Segoe UI", sans-serif',
    display: 'Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
    mono: 'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    pill: "9999px",
  },
  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
  },
  shadow: {
    none: "none",
    tactile: "0 1px 0 oklch(0.25 0.024 148 / 0.08), 0 2px 6px -2px oklch(0.25 0.024 148 / 0.1)",
    tactilePrimary:
      "0 2px 0 oklch(0.34 0.12 268 / 0.55), 0 4px 12px -4px oklch(0.485 0.125 268 / 0.35)",
    tactileSuccess:
      "0 2px 0 oklch(0.32 0.1 152 / 0.55), 0 4px 12px -4px oklch(0.465 0.115 152 / 0.35)",
    panel: "0 1px 2px oklch(0.25 0.024 148 / 0.05), 0 12px 28px -20px oklch(0.25 0.024 148 / 0.22)",
    cardHover:
      "0 2px 4px oklch(0.25 0.024 148 / 0.06), 0 18px 36px -20px oklch(0.25 0.024 148 / 0.3)",
    dialog:
      "0 4px 12px oklch(0.25 0.024 148 / 0.08), 0 28px 60px -24px oklch(0.25 0.024 148 / 0.34)",
  },
  motion: {
    fast: "140ms",
    normal: "220ms",
    slow: "340ms",
    easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
});
