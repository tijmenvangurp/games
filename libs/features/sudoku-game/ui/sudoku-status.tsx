import { Confetti, StatusBanner } from "@shared/ui";

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
    <div aria-live="polite" className="space-y-1.5 text-center text-xs text-muted-foreground">
      {celebration ? <Confetti key={celebration} /> : null}
      {celebration ? (
        <StatusBanner align="center" className="animate-rise min-h-0 py-2 text-sm" tone="success">
          {celebration}
        </StatusBanner>
      ) : null}
      {hintMessage ? (
        <StatusBanner align="center" className="min-h-0 py-2 text-sm" tone="warning">
          {hintMessage}
        </StatusBanner>
      ) : null}
      <p className="tabular-nums">{status}</p>
      {almostSolved ? <p className="font-semibold text-primary">Nog één vakje!</p> : null}
    </div>
  );
}
