import type { ReactNode } from "react";
import { ArrowLeft, Button } from "@shared/ui";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, onBack, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-2">
      {onBack ? (
        <Button aria-label="Terug naar het menu" size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Button>
      ) : (
        <span aria-hidden="true" className="size-11" />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-black tracking-tight">{title}</h1>
        {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions}
    </header>
  );
}
