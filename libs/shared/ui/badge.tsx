import type { ComponentProps } from "react";
import { cn } from "@shared/lib";
import { badgeRecipe, type BadgeVariants } from "./badge.css";

export type BadgeProps = ComponentProps<"span"> & BadgeVariants;

export function Badge({ tone, size, className, ...props }: BadgeProps) {
  return <span className={cn(badgeRecipe({ tone, size }), className)} {...props} />;
}
