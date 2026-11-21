import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import { componentsLayer, vars } from "./tokens.css";

export const panelRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: vars.color.border,
        borderRadius: vars.radius.lg,
        backgroundColor: vars.color.card,
        boxShadow: vars.shadow.panel,
      },
    },
  },
  variants: {
    surface: {
      card: {},
      subtle: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.backgroundSubtle,
            boxShadow: vars.shadow.none,
          },
        },
      },
      elevated: {
        "@layer": {
          [componentsLayer]: {
            backgroundColor: vars.color.cardElevated,
            boxShadow: vars.shadow.dialog,
          },
        },
      },
      dashed: {
        "@layer": {
          [componentsLayer]: {
            borderStyle: "dashed",
            backgroundColor: `color-mix(in oklab, ${vars.color.card} 82%, transparent)`,
            boxShadow: vars.shadow.none,
          },
        },
      },
    },
    padding: {
      none: {},
      xs: {
        "@layer": {
          [componentsLayer]: {
            padding: vars.space.sm,
          },
        },
      },
      sm: {
        "@layer": {
          [componentsLayer]: {
            padding: vars.space.md,
          },
        },
      },
      md: {
        "@layer": {
          [componentsLayer]: {
            padding: vars.space.lg,
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            padding: vars.space.lg,
            "@media": {
              "(min-width: 640px)": {
                padding: vars.space.xl,
              },
            },
          },
        },
      },
    },
    interactive: {
      true: {
        "@layer": {
          [componentsLayer]: {
            transitionProperty: "transform, border-color, box-shadow",
            transitionDuration: vars.motion.normal,
            transitionTimingFunction: vars.motion.easeOut,
            ":hover": {
              transform: "translateY(-2px)",
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
          },
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    surface: "card",
    padding: "md",
    interactive: false,
  },
});

export type PanelVariants = NonNullable<RecipeVariants<typeof panelRecipe>>;
