import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import { componentsLayer, vars } from "./tokens.css";

export const answerOptionRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        borderRadius: vars.radius.md,
        borderWidth: "1.5px",
        borderStyle: "solid",
        fontWeight: 700,
        cursor: "pointer",
        transitionProperty: "background-color, border-color, color, opacity, transform, box-shadow",
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
        ":disabled": {
          cursor: "default",
        },
      },
    },
  },
  variants: {
    state: {
      default: {
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
      correct: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.success,
            backgroundColor: vars.color.successSoft,
            color: vars.color.successInk,
            boxShadow: vars.shadow.none,
          },
        },
      },
      wrong: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.danger,
            backgroundColor: vars.color.dangerSoft,
            color: vars.color.dangerInk,
            boxShadow: vars.shadow.none,
          },
        },
      },
      warn: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.warning,
            backgroundColor: vars.color.warningSoft,
            color: vars.color.warningInk,
            boxShadow: vars.shadow.none,
          },
        },
      },
      muted: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.border,
            backgroundColor: vars.color.muted,
            color: vars.color.mutedForeground,
            opacity: 0.55,
            boxShadow: vars.shadow.none,
          },
        },
      },
    },
    size: {
      sm: {
        "@layer": {
          [componentsLayer]: {
            minHeight: "3rem",
            paddingInline: "0.5rem",
            fontSize: "0.875rem",
          },
        },
      },
      md: {
        "@layer": {
          [componentsLayer]: {
            minHeight: "3.5rem",
            paddingInline: "0.875rem",
            fontSize: "1rem",
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            minHeight: "3.75rem",
            paddingInline: "1rem",
            fontSize: "1.5rem",
            fontWeight: 900,
          },
        },
      },
    },
  },
  defaultVariants: {
    state: "default",
    size: "md",
  },
});

export type AnswerOptionVariants = NonNullable<RecipeVariants<typeof answerOptionRecipe>>;
