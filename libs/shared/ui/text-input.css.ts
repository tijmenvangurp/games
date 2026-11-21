import { style } from "@vanilla-extract/css";
import { componentsLayer, vars } from "./tokens.css";

export const textInput = style({
  "@layer": {
    [componentsLayer]: {
      minHeight: "2.75rem",
      width: "100%",
      minWidth: 0,
      borderRadius: vars.radius.md,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: vars.color.border,
      backgroundColor: vars.color.card,
      paddingInline: "0.75rem",
      fontFamily: vars.font.sans,
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: vars.color.foreground,
      boxShadow: `inset 0 1px 2px oklch(0.25 0.024 148 / 0.05)`,
      transitionProperty: "border-color, box-shadow, background-color",
      transitionDuration: vars.motion.fast,
      transitionTimingFunction: vars.motion.easeOut,
      ":focus-visible": {
        outline: "none",
        borderColor: vars.color.primary,
        boxShadow: `0 0 0 4px ${vars.color.focusRing}`,
      },
      "::placeholder": {
        color: vars.color.mutedForeground,
        fontWeight: 500,
      },
    },
  },
});
