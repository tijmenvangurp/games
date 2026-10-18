import type { MazeLevel } from "@entities/arrow";
import { ArrowLeft, Button, Check, Lock, SoundToggle } from "@shared/ui";
import { cn } from "@shared/lib";
import { MAZE_DIFFICULTY_LABELS } from "../model/labels";

interface MazeLevelSelectProps {
  levels: readonly MazeLevel[];
  unlocked: number;
  current: number;
  onSelect: (index: number) => void;
  onBack: () => void;
}

export function MazeLevelSelect({
  levels,
  unlocked,
  current,
  onSelect,
  onBack,
}: MazeLevelSelectProps) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-4 px-4 pb-safe pt-safe">
      <header className="flex items-center gap-2">
        <Button aria-label="Terug" size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Button>
        <h1 className="flex-1 text-2xl font-black tracking-tight">Kies level</h1>
        <SoundToggle />
      </header>

      <div className="grid grid-cols-2 gap-2">
        {levels.map((level, index) => {
          const locked = index >= unlocked;
          const completed = index < unlocked - 1;
          return (
            <button
              key={level.id}
              aria-label={
                locked
                  ? `Level ${index + 1}, vergrendeld`
                  : `Level ${index + 1}, ${level.name}, ${MAZE_DIFFICULTY_LABELS[level.difficulty]}`
              }
              aria-disabled={locked}
              className={cn(
                "relative flex min-h-24 flex-col items-start justify-between rounded-lg border p-3 text-left transition active:scale-[0.99]",
                locked
                  ? "border-border bg-muted/40 text-muted-foreground"
                  : "border-border bg-card hover:bg-muted/60",
                index === current && !locked && "border-primary ring-1 ring-primary/20",
              )}
              disabled={locked}
              type="button"
              onClick={() => onSelect(index)}
            >
              <span className="text-sm font-black">Level {index + 1}</span>
              <span className="text-xs text-muted-foreground">
                {level.name} · {MAZE_DIFFICULTY_LABELS[level.difficulty]}
              </span>
              <span className="absolute right-2 top-2">
                {locked ? (
                  <Lock aria-hidden="true" className="size-4" />
                ) : completed ? (
                  <span className="grid size-5 place-items-center rounded-full bg-success text-white">
                    <Check aria-hidden="true" className="size-3" />
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {unlocked} van {levels.length} levels vrijgespeeld
      </p>
    </main>
  );
}
