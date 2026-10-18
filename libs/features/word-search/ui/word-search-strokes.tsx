import type { Cell, WordSearchPlacement } from "@entities/word-search";

function center(cell: Cell): { x: number; y: number } {
  return { x: cell.col + 0.5, y: cell.row + 0.5 };
}

function bendFor(word: string): number {
  let hash = 0;
  for (const letter of word) {
    hash = (hash * 31 + letter.charCodeAt(0)) % 11;
  }
  return (hash % 2 === 0 ? 1 : -1) * (0.07 + (hash % 3) * 0.02);
}

function strokePath(placement: WordSearchPlacement): string {
  const first = placement.cells[0];
  const last = placement.cells.at(-1);
  if (!first || !last) {
    return "";
  }

  const startCenter = center(first);
  const endCenter = center(last);
  const dx = endCenter.x - startCenter.x;
  const dy = endCenter.y - startCenter.y;
  const length = Math.hypot(dx, dy) || 1;
  const unitX = dx / length;
  const unitY = dy / length;
  const overshoot = 0.16;
  const start = {
    x: startCenter.x - unitX * overshoot,
    y: startCenter.y - unitY * overshoot,
  };
  const end = {
    x: endCenter.x + unitX * overshoot,
    y: endCenter.y + unitY * overshoot,
  };
  const bend = bendFor(placement.word);
  const controlX = (start.x + end.x) / 2 - unitY * bend;
  const controlY = (start.y + end.y) / 2 + unitX * bend;

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}

interface WordSearchStrokesProps {
  placements: readonly WordSearchPlacement[];
  size: number;
}

export function WordSearchStrokes({ placements, size }: WordSearchStrokesProps) {
  if (placements.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      preserveAspectRatio="none"
      viewBox={`0 0 ${size} ${size}`}
    >
      {placements.map((placement) => {
        const path = strokePath(placement);

        return (
          <g key={placement.word} data-word={placement.word}>
            <path
              className="word-search-stroke"
              d={path}
              fill="none"
              opacity={0.12}
              pathLength={1}
              stroke="#93c5fd"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={0.13}
            />
            <path
              className="word-search-stroke"
              d={path}
              fill="none"
              pathLength={1}
              stroke="#3b82f6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={0.06}
              style={{ animationDelay: "70ms", opacity: 0.42 }}
            />
          </g>
        );
      })}
    </svg>
  );
}
