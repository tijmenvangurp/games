interface SudokuStatusProps {
  hintMessage: string | null;
  status: string;
  almostSolved: boolean;
}

export function SudokuStatus({ hintMessage, status, almostSolved }: SudokuStatusProps) {
  return (
    <div aria-live="polite" className="space-y-1 text-center text-xs text-muted-foreground">
      {hintMessage ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {hintMessage}
        </p>
      ) : null}
      <p>{status}</p>
      {almostSolved ? <p className="font-semibold text-sky-600">Nog één vakje!</p> : null}
    </div>
  );
}
