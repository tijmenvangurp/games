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
      {celebration ? (
        <p className="animate-rise rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900">
          🎉 {celebration}
        </p>
      ) : null}
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
