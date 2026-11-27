import { symbolName, type Puzzle } from "@entities/geheime-code";
import { useTexts } from "@shared/i18n";
import { Panel } from "@shared/ui";
import { CodeToken } from "./code-token";
import { geheimeCodePlayTexts } from "./texts";

interface CodeTableProps {
  puzzle: Puzzle;
  hintLetter: string | null;
}

export function CodeTable({ puzzle, hintLetter }: CodeTableProps) {
  const t = useTexts(geheimeCodePlayTexts);
  return (
    <Panel as="section" aria-label={t.code} padding="sm">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {t.code}
      </p>
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-7">
        {puzzle.table.map((cell) => {
          return (
            <li key={cell.letter} className="min-w-0">
              <CodeToken
                hint={hintLetter === cell.letter}
                label={`${symbolName(cell.symbolId)}: ${t.letter(cell.letter)}`}
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
