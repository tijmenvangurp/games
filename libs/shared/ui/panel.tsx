import type { ComponentProps, ElementType } from "react";
import { cn } from "@shared/lib";
import { panelRecipe, type PanelVariants } from "./panel.css";

type PanelElement = "div" | "section" | "header" | "aside" | "article" | "fieldset" | "li";

export type PanelProps<T extends PanelElement = "div"> = {
  as?: T;
} & PanelVariants &
  Omit<ComponentProps<T>, "as">;

export function Panel<T extends PanelElement = "div">({
  as,
  surface,
  padding,
  interactive,
  className,
  ...props
}: PanelProps<T>) {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      className={cn(panelRecipe({ surface, padding, interactive }), className)}
      {...props}
    />
  );
}
