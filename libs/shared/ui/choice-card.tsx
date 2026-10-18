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
        "flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 transition active:translate-y-0.5 active:scale-[0.98]",
        selected
          ? "border-foreground bg-primary/10 shadow-[0_3px_0_var(--border)] ring-2 ring-primary/25"
          : "border-foreground bg-card shadow-[0_3px_0_var(--border)] hover:bg-muted",
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
