import { cn } from "../lib";

interface ChoiceCardProps {
  selected: boolean;
  emoji: string;
  label: string;
  hint?: string;
  onClick: () => void;
}

export function ChoiceCard({ selected, emoji, label, hint, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border p-3 transition active:scale-[0.99]",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:bg-muted/60",
      )}
      onClick={onClick}
    >
      <span aria-hidden="true" className="text-2xl">
        {emoji}
      </span>
      <span className="text-sm font-bold">{label}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </button>
  );
}
