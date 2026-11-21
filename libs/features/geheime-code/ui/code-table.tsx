import { SYMBOL_BY_ID, type Puzzle } from "@entities/geheime-code";
import { cn } from "@shared/lib";
import { Panel } from "@shared/ui";
import { CodeToken } from "./code-token";

interface CodeTableProps {
  puzzle: Puzzle;
  revealed: readonly string[];
  tableTarget: string | null;
  tableWrong: boolean;
  hintLetter: string | null;
  onSelect: (letter: string) => void;
}

export function CodeTable({
  puzzle,
  revealed,
  tableTarget,
  tableWrong,
  hintLetter,
  onSelect,
}: CodeTableProps) {
  return (
    <Panel as="section" aria-label="Code" padding="sm">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Code
      </p>
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-7">
        {puzzle.table.map((cell) => {
          const symbol = SYMBOL_BY_ID[cell.symbolId];
          const hidden = cell.hidden && !revealed.includes(cell.letter);
          const active = tableTarget === cell.letter;
          const hint = hintLetter === cell.letter;
          const wrong = tableWrong && active;
          const label = `${symbol?.name ?? "symbool"}: ${
            hidden ? "letter onbekend" : `letter ${cell.letter}`
          }`;

          return (
            <li key={cell.letter} className={cn("min-w-0", active && "rounded-xl")}>
              <CodeToken
                active={active}
                className={cn(wrong && "code-shake")}
                hidden={hidden}
                hint={hint}
                label={label}
                letter={hidden ? "?" : cell.letter}
                symbolId={cell.symbolId}
                wrong={wrong}
                onClick={hidden ? () => onSelect(cell.letter) : undefined}
              />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
