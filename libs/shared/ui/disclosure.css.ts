import { style } from "@vanilla-extract/css";
import { componentsLayer, vars } from "./tokens.css";

export const disclosureRoot = style({
  "@layer": {
    [componentsLayer]: {
      borderRadius: vars.radius.lg,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: vars.color.border,
      backgroundColor: vars.color.card,
      boxShadow: vars.shadow.panel,
    },
  },
});

export const disclosureSummary = style({
  "@layer": {
    [componentsLayer]: {
      display: "flex",
      minHeight: "2.75rem",
      cursor: "pointer",
      listStyle: "none",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem",
      borderRadius: vars.radius.lg,
      paddingBlock: "0.625rem",
      paddingInline: "0.875rem",
      fontSize: "0.875rem",
      fontWeight: 700,
      color: vars.color.foreground,
      transitionProperty: "background-color",
      transitionDuration: vars.motion.fast,
      ":hover": {
        backgroundColor: vars.color.backgroundSubtle,
      },
      ":focus-visible": {
        outline: "none",
        boxShadow: `0 0 0 4px ${vars.color.focusRing}`,
      },
      selectors: {
        "&::-webkit-details-marker": {
          display: "none",
        },
      },
    },
  },
});

export const disclosureBody = style({
  "@layer": {
    [componentsLayer]: {
      paddingInline: "0.875rem",
      paddingBottom: "0.875rem",
    },
  },
});
