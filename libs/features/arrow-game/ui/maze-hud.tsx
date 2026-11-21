import type { MazeLevel } from "@entities/arrow";
import {
  ArrowLeft,
  Button,
  Lightbulb,
  Panel,
  ProgressBar,
  RotateCcw,
  SoundToggle,
  Undo2,
} from "@shared/ui";

interface MazeHudProps {
  level: MazeLevel;
  levelIndex: number;
  removedCount: number;
  canUndo: boolean;
  playing: boolean;
  onBack: () => void;
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
}

export function MazeHud({
  level,
  levelIndex,
  removedCount,
  canUndo,
  playing,
  onBack,
  onUndo,
  onHint,
  onRestart,
}: MazeHudProps) {
  return (
    <Panel as="header" className="space-y-2" padding="sm">
      <div className="flex items-center gap-0.5">
        <Button aria-label="Terug" size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Button>
        <Button
          aria-label="Ongedaan maken"
          disabled={!canUndo || !playing}
          size="icon"
          variant="ghost"
          onClick={onUndo}
        >
          <Undo2 aria-hidden="true" className="size-5" />
        </Button>

        <div className="flex-1" />

        <SoundToggle />
      </div>

      <div className="flex items-center gap-2">
        <ProgressBar
          className="flex-1"
          label={`${removedCount} van ${level.arrows.length} pijlen weg`}
          max={level.arrows.length}
          value={removedCount}
        />
        <Button aria-label="Hint" disabled={!playing} size="icon" variant="ghost" onClick={onHint}>
          <Lightbulb aria-hidden="true" className="size-5 text-warning" />
        </Button>
        <Button aria-label="Opnieuw" size="icon" variant="ghost" onClick={onRestart}>
          <RotateCcw aria-hidden="true" className="size-5" />
        </Button>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold tabular-nums text-muted-foreground">
          Level {levelIndex + 1}
        </p>
        <p className="font-display text-base">{level.name}</p>
      </div>
    </Panel>
  );
}
