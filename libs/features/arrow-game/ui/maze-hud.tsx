import { MAX_HEARTS, type MazeDifficulty, type MazeLevel } from "@entities/arrow";
import { ArrowLeft, Button, Heart, Lightbulb, RotateCcw, SoundToggle, Undo2 } from "@shared/ui";
import { cn } from "@shared/lib";

const DIFFICULTY_LABELS: Record<MazeDifficulty, string> = {
  makkelijk: "Makkelijk",
  gemiddeld: "Gemiddeld",
  moeilijk: "Moeilijk",
  "super-hard": "Super hard",
};

interface MazeHudProps {
  level: MazeLevel;
  levelIndex: number;
  hearts: number;
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
  hearts,
  removedCount,
  canUndo,
  playing,
  onBack,
  onUndo,
  onHint,
  onRestart,
}: MazeHudProps) {
  const progress = level.arrows.length === 0 ? 0 : removedCount / level.arrows.length;

  return (
    <header className="space-y-2">
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

        <div
          aria-label={`${hearts} van ${MAX_HEARTS} harten`}
          className="flex flex-1 items-center justify-center gap-1 text-rose-500"
          role="img"
        >
          {Array.from({ length: MAX_HEARTS }, (_, index) => (
            <Heart
              key={index}
              aria-hidden="true"
              className={cn("size-5", index >= hearts && "text-rose-200")}
              fill="currentColor"
            />
          ))}
        </div>

        <SoundToggle />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {DIFFICULTY_LABELS[level.difficulty]}
        </span>
        <div
          aria-label={`${removedCount} van ${level.arrows.length} pijlen weg`}
          aria-valuemax={level.arrows.length}
          aria-valuemin={0}
          aria-valuenow={removedCount}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <Button aria-label="Hint" disabled={!playing} size="icon" variant="ghost" onClick={onHint}>
          <Lightbulb aria-hidden="true" className="size-5 text-amber-500" />
        </Button>
        <Button aria-label="Opnieuw" size="icon" variant="ghost" onClick={onRestart}>
          <RotateCcw aria-hidden="true" className="size-5" />
        </Button>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Level {levelIndex + 1}
        </p>
        <p className="text-sm font-black">{level.name}</p>
      </div>
    </header>
  );
}
