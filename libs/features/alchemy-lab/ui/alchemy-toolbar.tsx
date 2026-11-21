import { ELEMENTS } from "@entities/alchemy";
import { Button, LayoutGrid, Lightbulb, Panel, RotateCcw } from "@shared/ui";

interface AlchemyToolbarProps {
  discoveredCount: number;
  boardEmpty: boolean;
  onHint: () => void;
  onOpenLabBook: () => void;
  onClear: () => void;
}

export function AlchemyToolbar({
  discoveredCount,
  boardEmpty,
  onHint,
  onOpenLabBook,
  onClear,
}: AlchemyToolbarProps) {
  return (
    <Panel
      className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
      padding="none"
    >
      <p className="text-sm font-bold tabular-nums" data-testid="alchemy-progress">
        <span className="text-lg font-black">{discoveredCount}</span>{" "}
        <span className="text-muted-foreground">/ {ELEMENTS.length} ontdekt</span>
      </p>

      <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:items-center">
        <Button
          className="h-11 justify-center px-2 text-xs sm:px-4 sm:text-sm"
          variant="outline"
          onClick={onHint}
        >
          <Lightbulb aria-hidden="true" className="size-4 text-warning" />
          Hint
        </Button>
        <Button
          className="h-11 justify-center px-2 text-xs sm:px-4 sm:text-sm"
          variant="outline"
          onClick={onOpenLabBook}
        >
          <LayoutGrid aria-hidden="true" className="size-4" />
          Labboek
        </Button>
        <Button
          className="h-11 justify-center px-2 text-xs sm:px-4 sm:text-sm"
          disabled={boardEmpty}
          variant="outline"
          onClick={onClear}
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Opruimen
        </Button>
      </div>
    </Panel>
  );
}
