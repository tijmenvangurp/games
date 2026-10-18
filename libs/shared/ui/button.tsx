import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@shared/lib";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/45 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "border-primary/60 bg-gradient-to-r from-cyan-300 to-sky-400 text-primary-foreground shadow-[0_0_26px_-9px_var(--primary)] hover:brightness-110",
        outline: "border-primary/35 bg-white/5 text-foreground backdrop-blur-sm hover:bg-white/10",
        ghost: "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground",
        success:
          "border-lime-300/60 bg-gradient-to-r from-lime-300 to-emerald-400 text-primary-foreground shadow-[0_0_26px_-9px_var(--success)] hover:brightness-110",
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
