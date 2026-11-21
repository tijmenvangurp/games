import { style } from "@vanilla-extract/css";
import { recipe, type RecipeVariants } from "@vanilla-extract/recipes";
import { componentsLayer, vars } from "./tokens.css";

export const dialogBackdrop = style({
  "@layer": {
    [componentsLayer]: {
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: vars.space.lg,
      backgroundColor: vars.color.backdrop,
      backdropFilter: "blur(4px)",
    },
  },
});

export const dialogPanelRecipe = recipe({
  base: {
    "@layer": {
      [componentsLayer]: {
        position: "relative",
        zIndex: 50,
        width: "100%",
        maxHeight: "88svh",
        overflowY: "auto",
        borderRadius: vars.radius.xl,
        borderWidth: "1px",
        borderStyle: "solid",
        boxShadow: vars.shadow.dialog,
        padding: vars.space.xl,
      },
    },
  },
  variants: {
    size: {
      xs: {
        "@layer": {
          [componentsLayer]: {
            maxWidth: "20rem",
          },
        },
      },
      sm: {
        "@layer": {
          [componentsLayer]: {
            maxWidth: "24rem",
          },
        },
      },
      md: {
        "@layer": {
          [componentsLayer]: {
            maxWidth: "28rem",
          },
        },
      },
      lg: {
        "@layer": {
          [componentsLayer]: {
            maxWidth: "42rem",
          },
        },
      },
    },
    tone: {
      default: {
        "@layer": {
          [componentsLayer]: {
            borderColor: vars.color.border,
            backgroundColor: vars.color.cardElevated,
            color: vars.color.foreground,
          },
        },
      },
      parchment: {
        "@layer": {
          [componentsLayer]: {
            borderWidth: "2px",
            borderColor: vars.color.parchmentBorder,
            backgroundColor: vars.color.parchmentBg,
            color: vars.color.parchmentInk,
          },
        },
      },
    },
  },
  defaultVariants: {
    size: "sm",
    tone: "default",
  },
});

export type DialogPanelVariants = NonNullable<RecipeVariants<typeof dialogPanelRecipe>>;
