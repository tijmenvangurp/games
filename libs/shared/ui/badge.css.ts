import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import { componentsLayer, vars } from "./tokens.css";

export const badgeRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        borderRadius: vars.radius.pill,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
      },
    },
  },
  variants: {
    tone: {
      neutral: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.muted,
            color: vars.color.mutedForeground,
          },
        },
      },
      primary: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.primarySoft,
            color: vars.color.primary,
          },
        },
      },
      primarySolid: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.primary,
            color: vars.color.primaryForeground,
          },
        },
      },
      success: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.successSoft,
            color: vars.color.successInk,
          },
        },
      },
      warning: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.warningSoft,
            color: vars.color.warningInk,
          },
        },
      },
    },
    size: {
      sm: {
        "@layer": {
          [componentsLayer]: {
            paddingBlock: "0.1875rem",
            paddingInline: "0.5rem",
            fontSize: "0.6875rem",
          },
        },
      },
      md: {
        "@layer": {
          [componentsLayer]: {
            paddingBlock: "0.25rem",
            paddingInline: "0.625rem",
            fontSize: "0.75rem",
          },
        },
      },
    },
  },
  defaultVariants: {
    tone: "neutral",
    size: "md",
  },
});

export type BadgeVariants = NonNullable<RecipeVariants<typeof badgeRecipe>>;
