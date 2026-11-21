import type { ReactNode } from "react";
import { useTranslation } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Panel } from "./panel";
import { SetupActions } from "./setup-actions";

interface SetupPanelProps {
  title?: string;
  subtitle?: ReactNode;
  headerAddon?: ReactNode;
  /** Rustige score- of statusregel vlak boven de startknop. */
  note?: ReactNode;
  onStart?: () => void;
  startLabel?: string;
  loading?: boolean;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function SetupPanel({
  title,
  subtitle,
  headerAddon,
  note,
  onStart,
  startLabel,
  loading,
  footer,
  className,
  children,
}: SetupPanelProps) {
  const { t } = useTranslation();
  return (
    <Panel as="section" className={cn("animate-rise", className)} padding="lg">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="font-display text-2xl tracking-tight">{title ?? t("setup.title")}</h2>
          {subtitle ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {headerAddon ? <div className="shrink-0">{headerAddon}</div> : null}
      </div>

      <div className="space-y-5">{children}</div>

      {note ? (
        <p className="mt-5 rounded-xl bg-muted px-3 py-2 text-center text-sm font-semibold tabular-nums text-muted-foreground">
          {note}
        </p>
      ) : null}

      {onStart ? (
        <SetupActions loading={loading} startLabel={startLabel} onStart={onStart} />
      ) : null}

      {footer}
    </Panel>
  );
}
