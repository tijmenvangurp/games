import { Confetti } from "@shared/ui";

interface SudokuStatusProps {
  hintMessage: string | null;
  status: string;
  almostSolved: boolean;
  celebration: string | null;
}

export function SudokuStatus({
  hintMessage,
  status,
  almostSolved,
  celebration,
}: SudokuStatusProps) {
  return (
    <div aria-live="polite" className="space-y-1 text-center text-xs text-muted-foreground">
      {celebration ? <Confetti key={celebration} /> : null}
      {celebration ? (
        <p className="animate-rise rounded-lg bg-success/10 px-3 py-2 text-sm font-bold text-success">
          {celebration}
        </p>
      ) : null}
      {hintMessage ? (
        <p className="rounded-lg bg-warning/15 px-3 py-2 text-sm font-semibold text-warning">
          {hintMessage}
        </p>
      ) : null}
      <p>{status}</p>
      {almostSolved ? <p className="font-semibold text-primary">Nog één vakje!</p> : null}
    </div>
  );
}
