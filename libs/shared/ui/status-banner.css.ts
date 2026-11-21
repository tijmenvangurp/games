import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import { componentsLayer, vars } from "./tokens.css";

export const statusBannerRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "flex",
        minHeight: "3rem",
        alignItems: "center",
        gap: "0.75rem",
        borderRadius: vars.radius.md,
        borderWidth: "1px",
        borderStyle: "solid",
        paddingBlock: "0.625rem",
        paddingInline: "1rem",
        fontSize: "0.9375rem",
        fontWeight: 700,
        lineHeight: 1.35,
      },
    },
  },
  variants: {
    tone: {
      neutral: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.border,
            backgroundColor: vars.color.muted,
            color: vars.color.foreground,
          },
        },
      },
      primary: {
        "@layer": {
          [componentsLayer]: {
            borderColor: `color-mix(in oklab, ${vars.color.primary} 28%, transparent)`,
            backgroundColor: vars.color.primarySoft,
            color: vars.color.primary,
          },
        },
      },
      success: {
        "@layer": {
          [componentsLayer]: {
            borderColor: `color-mix(in oklab, ${vars.color.success} 30%, transparent)`,
            backgroundColor: vars.color.successSoft,
            color: vars.color.successInk,
          },
        },
      },
      warning: {
        "@layer": {
          [componentsLayer]: {
            borderColor: `color-mix(in oklab, ${vars.color.warning} 34%, transparent)`,
            backgroundColor: vars.color.warningSoft,
            color: vars.color.warningInk,
          },
        },
      },
      danger: {
        "@layer": {
          [componentsLayer]: {
            borderColor: `color-mix(in oklab, ${vars.color.danger} 32%, transparent)`,
            backgroundColor: vars.color.dangerSoft,
            color: vars.color.dangerInk,
          },
        },
      },
    },
    align: {
      left: {
        "@layer": {
          [componentsLayer]: {
            justifyContent: "flex-start",
            textAlign: "left",
          },
        },
      },
      center: {
        "@layer": {
          [componentsLayer]: {
            justifyContent: "center",
            textAlign: "center",
          },
        },
      },
    },
  },
  defaultVariants: {
    tone: "neutral",
    align: "left",
  },
});

export type StatusBannerVariants = NonNullable<RecipeVariants<typeof statusBannerRecipe>>;
