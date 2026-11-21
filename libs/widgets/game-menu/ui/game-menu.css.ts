import { style } from "@vanilla-extract/css";
import { vars } from "@shared/ui";

export const menuCard = style({
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: vars.radius.lg,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: vars.color.border,
  backgroundColor: vars.color.card,
  boxShadow: vars.shadow.panel,
  transitionProperty: "transform, border-color, box-shadow",
  transitionDuration: vars.motion.normal,
  transitionTimingFunction: vars.motion.easeOut,
  ":hover": {
    transform: "translateY(-3px)",
    borderColor: vars.color.borderStrong,
    boxShadow: vars.shadow.cardHover,
  },
  ":active": {
    transform: "translateY(0)",
  },
  ":focus-visible": {
    outline: "none",
    boxShadow: `0 0 0 4px ${vars.color.focusRing}`,
  },
});

export const menuCardMedia = style({
  position: "relative",
  aspectRatio: "16 / 10",
  overflow: "hidden",
  backgroundColor: vars.color.backgroundSubtle,
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: `color-mix(in oklab, ${vars.color.border} 70%, transparent)`,
});

export const menuCardThumb = style({
  height: "100%",
  width: "100%",
  objectFit: "cover",
  transitionProperty: "transform",
  transitionDuration: vars.motion.slow,
  transitionTimingFunction: vars.motion.easeOut,
  selectors: {
    [`${menuCard}:hover &`]: {
      transform: "scale(1.03)",
    },
  },
});

export const menuCardDisabled = style({
  display: "flex",
  minHeight: "10rem",
  flexDirection: "column",
  borderRadius: vars.radius.lg,
  borderWidth: "1px",
  borderStyle: "dashed",
  borderColor: vars.color.border,
  backgroundColor: `color-mix(in oklab, ${vars.color.card} 70%, transparent)`,
  padding: vars.space.xl,
  color: vars.color.mutedForeground,
});
