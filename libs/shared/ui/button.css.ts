import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import { componentsLayer, vars } from "./tokens.css";

export const buttonRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        display: "inline-flex",
        userSelect: "none",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        whiteSpace: "nowrap",
        borderRadius: vars.radius.md,
        borderWidth: "1px",
        borderStyle: "solid",
        fontFamily: vars.font.sans,
        fontWeight: 600,
        lineHeight: 1.2,
        cursor: "pointer",
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
        ":disabled": {
          pointerEvents: "none",
          opacity: 0.48,
          boxShadow: vars.shadow.none,
        },
      },
    },
  },
  variants: {
    variant: {
      default: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.primary,
            backgroundColor: vars.color.primary,
            color: vars.color.primaryForeground,
            boxShadow: vars.shadow.tactilePrimary,
            ":hover": {
              borderColor: vars.color.primaryHover,
              backgroundColor: vars.color.primaryHover,
            },
          },
        },
      },
      outline: {
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
      soft: {
        "@layer": {
          [componentsLayer]: {
            borderColor: "transparent",
            backgroundColor: vars.color.primarySoft,
            color: vars.color.primary,
            ":hover": {
              borderColor: vars.color.primary,
            },
          },
        },
      },
      ghost: {
        "@layer": {
          [componentsLayer]: {
            borderColor: "transparent",
            backgroundColor: "transparent",
            color: vars.color.foreground,
            ":hover": {
              backgroundColor: vars.color.muted,
            },
          },
        },
      },
      success: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.success,
            backgroundColor: vars.color.success,
            color: vars.color.successForeground,
            boxShadow: vars.shadow.tactileSuccess,
            ":hover": {
              borderColor: vars.color.successHover,
              backgroundColor: vars.color.successHover,
            },
          },
        },
      },
      danger: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.danger,
            backgroundColor: vars.color.danger,
            color: vars.color.dangerForeground,
            boxShadow: vars.shadow.tactile,
            ":hover": {
              borderColor: vars.color.dangerHover,
              backgroundColor: vars.color.dangerHover,
            },
          },
        },
      },
    },
    size: {
      default: {
        "@layer": {
          [componentsLayer]: {
            height: "2.75rem",
            paddingInline: "1rem",
            fontSize: "0.875rem",
          },
        },
      },
      sm: {
        "@layer": {
          [componentsLayer]: {
            height: "2.375rem",
            paddingInline: "0.75rem",
            fontSize: "0.875rem",
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            height: "3.5rem",
            paddingInline: "1.5rem",
            fontSize: "1rem",
            fontWeight: 700,
          },
        },
      },
      icon: {
        "@layer": {
          [componentsLayer]: {
            height: "2.75rem",
            width: "2.75rem",
            padding: 0,
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonVariants = NonNullable<RecipeVariants<typeof buttonRecipe>>;
