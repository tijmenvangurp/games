import type { ReactNode } from "react";
import { cn } from "@shared/lib";
import { Button } from "./button";
import { ArrowLeft } from "./icons";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  titleClassName?: string;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Terug naar het menu",
  actions,
  titleClassName,
}: PageHeaderProps) {
  return (
    <header className="flex min-w-0 items-center gap-2">
      {onBack ? (
        <Button aria-label={backLabel} size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Button>
      ) : (
        <span aria-hidden="true" className="size-11" />
      )}
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            "truncate font-display text-2xl font-normal tracking-tight",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
    </header>
  );
}
