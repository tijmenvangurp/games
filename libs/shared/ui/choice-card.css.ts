import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import { componentsLayer, vars } from "./tokens.css";

export const choiceCardRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.25rem",
        borderRadius: vars.radius.md,
        borderWidth: "1.5px",
        borderStyle: "solid",
        cursor: "pointer",
        textAlign: "center",
        transitionProperty: "background-color, border-color, color, box-shadow, transform",
        transitionDuration: vars.motion.fast,
        transitionTimingFunction: vars.motion.easeOut,
        ":focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 4px ${vars.color.focusRing}`,
        },
        ":active": {
          transform: "translateY(2px)",
          boxShadow: vars.shadow.none,
        },
      },
    },
  },
  variants: {
    selected: {
      true: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.primary,
            backgroundColor: vars.color.primarySoft,
            color: vars.color.primary,
            boxShadow: `inset 0 1px 3px color-mix(in oklab, ${vars.color.primary} 16%, transparent), 0 0 0 1px color-mix(in oklab, ${vars.color.primary} 18%, transparent)`,
          },
        },
      },
      false: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.border,
            backgroundColor: vars.color.card,
            color: vars.color.foreground,
            boxShadow: vars.shadow.tactile,
            ":hover": {
              borderColor: vars.color.borderStrong,
              backgroundColor: vars.color.backgroundSubtle,
            },
          },
        },
      },
    },
    size: {
      default: {
        "@layer": {
          [componentsLayer]: {
            minHeight: "5.5rem",
            padding: "0.75rem",
          },
        },
      },
      compact: {
        "@layer": {
          [componentsLayer]: {
            minHeight: "3.25rem",
            paddingBlock: "0.625rem",
            paddingInline: "0.75rem",
          },
        },
      },
    },
  },
  defaultVariants: {
    selected: false,
    size: "default",
  },
});

export type ChoiceCardVariants = NonNullable<RecipeVariants<typeof choiceCardRecipe>>;
