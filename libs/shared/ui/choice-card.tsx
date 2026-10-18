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
        "flex min-h-24 flex-col items-center justify-center gap-1 rounded-xl border p-2 transition active:scale-[0.98]",
        selected
          ? "border-primary/70 bg-primary/10 shadow-[0_0_24px_-10px_var(--primary)] ring-2 ring-primary/30"
          : "border-white/15 bg-white/5 hover:border-primary/40 hover:bg-white/10",
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
