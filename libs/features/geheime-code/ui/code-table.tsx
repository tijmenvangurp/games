import { SYMBOL_BY_ID, type Puzzle } from "@entities/geheime-code";
import { Panel } from "@shared/ui";
import { CodeToken } from "./code-token";

interface CodeTableProps {
  puzzle: Puzzle;
  hintLetter: string | null;
}

export function CodeTable({ puzzle, hintLetter }: CodeTableProps) {
  return (
    <Panel as="section" aria-label="Code" padding="sm">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Code
      </p>
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-7">
        {puzzle.table.map((cell) => {
          const symbol = SYMBOL_BY_ID[cell.symbolId];
          return (
            <li key={cell.letter} className="min-w-0">
              <CodeToken
                hint={hintLetter === cell.letter}
                label={`${symbol?.name ?? "symbool"}: letter ${cell.letter}`}
                letter={cell.letter}
                symbolId={cell.symbolId}
              />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
