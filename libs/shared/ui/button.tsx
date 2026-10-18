import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@shared/lib";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 font-bold transition-all active:translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-primary text-primary-foreground shadow-[0_4px_0_var(--border)] hover:brightness-105 active:shadow-[0_2px_0_var(--border)]",
        outline:
          "border-foreground bg-card text-foreground shadow-[0_4px_0_var(--border)] hover:bg-muted active:shadow-[0_2px_0_var(--border)]",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
        success:
          "border-foreground bg-success text-white shadow-[0_4px_0_var(--border)] hover:brightness-105 active:shadow-[0_2px_0_var(--border)]",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-9 px-3 text-sm",
        lg: "h-14 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild = false, className, variant, size, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    />
  );
}
