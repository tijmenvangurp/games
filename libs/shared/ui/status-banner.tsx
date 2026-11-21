import type { ComponentProps, ReactNode } from "react";
import { cn } from "@shared/lib";
import { statusBannerRecipe, type StatusBannerVariants } from "./status-banner.css";

export type StatusTone = NonNullable<StatusBannerVariants["tone"]>;

interface StatusBannerProps extends Omit<ComponentProps<"div">, "children"> {
  tone?: StatusTone;
  align?: StatusBannerVariants["align"];
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function StatusBanner({
  tone = "neutral",
  align = "left",
  icon,
  action,
  className,
  children,
  ...props
}: StatusBannerProps) {
  return (
    <div
      aria-live="polite"
      className={cn(statusBannerRecipe({ tone, align }), className)}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      ) : null}
      <div className={cn("min-w-0", align === "left" && "flex-1")}>{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
