import type { ChessMoveRecord } from "@entities/chess";

interface MoveListProps {
  readonly history: readonly ChessMoveRecord[];
}

export function MoveList({ history }: MoveListProps) {
  if (history.length === 0) {
    return null;
  }

  const rows: { number: number; white?: string; black?: string }[] = [];
  for (let index = 0; index < history.length; index += 2) {
    const white = history[index]?.san;
    const black = history[index + 1]?.san;
    rows.push({
      number: index / 2 + 1,
      ...(white ? { white } : {}),
      ...(black ? { black } : {}),
    });
  }

  return (
    <details className="rounded-2xl border border-slate-200 bg-white/80">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 [&::-webkit-details-marker]:hidden">
        Zetten ({history.length})
      </summary>
      <ol className="grid grid-cols-[2rem_1fr_1fr] gap-x-2 gap-y-1 px-4 pb-4 text-sm font-semibold text-slate-700">
        {rows.map((row) => (
          <li className="contents" key={row.number}>
            <span className="text-right text-slate-400">{row.number}.</span>
            <span>{row.white ?? ""}</span>
            <span>{row.black ?? ""}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
