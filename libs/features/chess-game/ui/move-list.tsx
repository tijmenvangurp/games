import type { ChessMoveRecord } from "@entities/chess";
import { Disclosure } from "@shared/ui";

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
    <Disclosure summary={`Zetten (${history.length})`}>
      <ol className="grid grid-cols-[2rem_1fr_1fr] gap-x-2 gap-y-1 text-sm font-semibold tabular-nums text-foreground">
        {rows.map((row) => (
          <li className="contents" key={row.number}>
            <span className="text-right text-muted-foreground">{row.number}.</span>
            <span>{row.white ?? ""}</span>
            <span>{row.black ?? ""}</span>
          </li>
        ))}
      </ol>
    </Disclosure>
  );
}
