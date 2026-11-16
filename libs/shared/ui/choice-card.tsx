import type { ReactNode } from "react";
import { cn } from "../lib";

interface ChoiceCardProps {
  selected: boolean;
  label: ReactNode;
  /** Korte toelichting onder het label; bijvoorbeeld een maat of uitleg. */
  description?: ReactNode;
  leading?: ReactNode;
  /** Toegankelijke naam als het label alleen visueel klopt. */
  ariaLabel?: string;
  /** Extra klassen voor de kaart zelf, bijvoorbeeld uitlijning of breedte. */
  className?: string;
  onClick: () => void;
}

export function ChoiceCard({
  selected,
  label,
  description,
  leading,
  ariaLabel,
  className,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border p-3 transition active:scale-[0.99]",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:bg-muted/60",
        className,
      )}
      onClick={onClick}
    >
      {leading ? (
        <span aria-hidden="true" className="text-primary">
          {leading}
        </span>
      ) : null}
      <span className="text-sm font-bold">{label}</span>
      {description ? (
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      ) : null}
    </button>
  );
}
