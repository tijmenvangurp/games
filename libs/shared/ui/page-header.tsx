import type { ReactNode } from "react";
import { useTranslation } from "@shared/i18n";
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
  backLabel,
  actions,
  titleClassName,
}: PageHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="flex w-full min-w-0 flex-1 items-center gap-2">
      {onBack ? (
        <Button
          aria-label={backLabel ?? t("shell.back")}
          size="icon"
          variant="outline"
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Button>
      ) : (
        <span aria-hidden="true" className="size-11 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            "truncate font-display text-xl font-normal leading-tight tracking-tight sm:text-2xl",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  );
}
