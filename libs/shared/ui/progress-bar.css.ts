import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import { componentsLayer, vars } from "./tokens.css";

export const progressTrackRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        width: "100%",
        overflow: "hidden",
        borderRadius: vars.radius.pill,
        backgroundColor: vars.color.muted,
      },
    },
  },
  variants: {
    size: {
      sm: {
        "@layer": {
          [componentsLayer]: {
            height: "0.375rem",
          },
        },
      },
      md: {
        "@layer": {
          [componentsLayer]: {
            height: "0.5rem",
          },
        },
      },
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

export const progressFillRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        height: "100%",
        borderRadius: vars.radius.pill,
        transitionProperty: "width",
        transitionDuration: vars.motion.slow,
        transitionTimingFunction: vars.motion.easeOut,
      },
    },
  },
  variants: {
    tone: {
      primary: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.primary,
          },
        },
      },
      success: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.success,
          },
        },
      },
    },
  },
  defaultVariants: {
    tone: "primary",
  },
});

export type ProgressTrackVariants = NonNullable<RecipeVariants<typeof progressTrackRecipe>>;
export type ProgressFillVariants = NonNullable<RecipeVariants<typeof progressFillRecipe>>;
