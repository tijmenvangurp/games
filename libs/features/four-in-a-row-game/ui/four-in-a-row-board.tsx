import { useState } from "react";
import { isFinished, isPlayable, landingRow, type FourInARowGame } from "@entities/four-in-a-row";
import { FourInARowColumn } from "./four-in-a-row-column";

interface FourInARowBoardProps {
  game: FourInARowGame;
  onDrop: (column: number) => void;
}

export function FourInARowBoard({ game, onDrop }: FourInARowBoardProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const finished = isFinished(game);
  const winning = new Set((game.line?.cells ?? []).map(({ column, row }) => `${column}:${row}`));
  const latest = game.last ? `${game.last.column}:${game.last.row}` : null;

  return (
    <div aria-label="Speelbord" className="game-panel w-full p-1.5 sm:p-3" role="group">
      <div className="flex gap-0.5 rounded-lg bg-muted p-1 sm:gap-1.5 sm:p-1.5">
        {game.board.map((cells, column) => {
          const row = hovered === column ? landingRow(game.board, column) : -1;

          return (
            <FourInARowColumn
              key={column}
              cells={cells}
              disabled={finished || !isPlayable(game.board, column)}
              ghost={game.current}
              index={column}
              latest={latest}
              previewRow={row < 0 ? null : row}
              winning={winning}
              onDrop={onDrop}
              onHover={setHovered}
            />
          );
        })}
      </div>
    </div>
  );
}
