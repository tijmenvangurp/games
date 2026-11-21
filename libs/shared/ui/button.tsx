import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@shared/lib";
import { buttonRecipe, type ButtonVariants } from "./button.css";

export type ButtonProps = ComponentProps<"button"> &
  ButtonVariants & {
    asChild?: boolean;
  };

export function Button({ asChild = false, className, variant, size, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(buttonRecipe({ variant, size }), className)}
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    />
  );
}
