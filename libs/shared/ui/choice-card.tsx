import type { ReactNode } from "react";
import { cn } from "@shared/lib";
import { choiceCardRecipe, type ChoiceCardVariants } from "./choice-card.css";

interface ChoiceCardProps {
  selected: boolean;
  label: ReactNode;
  /** Korte toelichting onder het label; bijvoorbeeld een maat of uitleg. */
  description?: ReactNode;
  leading?: ReactNode;
  /** Compacte hoogte voor eenvoudige teksten zonder symbool. */
  size?: ChoiceCardVariants["size"];
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
  size = "default",
  ariaLabel,
  className,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={cn(choiceCardRecipe({ selected, size }), className)}
      onClick={onClick}
    >
      {leading ? (
        <span aria-hidden="true" className={selected ? "text-primary" : "text-muted-foreground"}>
          {leading}
        </span>
      ) : null}
      <span className="text-sm font-bold leading-snug">{label}</span>
      {description ? (
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      ) : null}
    </button>
  );
}
