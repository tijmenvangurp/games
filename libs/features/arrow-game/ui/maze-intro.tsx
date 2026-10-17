import type { MazeLevel } from "@entities/arrow";
import { ArrowUp, Button, Home, LayoutGrid, Play, SoundToggle } from "@shared/ui";
import { MAZE_DIFFICULTY_LABELS } from "../model/labels";

interface MazeIntroProps {
  level: MazeLevel;
  levelIndex: number;
  levelCount: number;
  unlocked: number;
  onPlay: () => void;
  onLevels: () => void;
  onHome: () => void;
}

export function MazeIntro({
  level,
  levelIndex,
  levelCount,
  unlocked,
  onPlay,
  onLevels,
  onHome,
}: MazeIntroProps) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 pb-safe pt-safe">
      <div className="flex justify-end">
        <SoundToggle />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2">
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <ArrowUp aria-hidden="true" className="size-7 stroke-2" />
          </span>
          <span className="text-4xl font-black tracking-tight">Pijlen</span>
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Level {levelIndex + 1} van {levelCount}
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{level.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {MAZE_DIFFICULTY_LABELS[level.difficulty]} · {level.arrows.length} pijlen
        </p>

        <Button className="mt-8 w-full max-w-xs" size="lg" variant="success" onClick={onPlay}>
          <Play aria-hidden="true" className="size-5" />
          Spelen
        </Button>

        <div className="mt-3 flex w-full max-w-xs gap-2">
          <Button className="flex-1" variant="outline" onClick={onLevels}>
            <LayoutGrid aria-hidden="true" className="size-4" />
            Levels
          </Button>
          <Button className="flex-1" variant="ghost" onClick={onHome}>
            <Home aria-hidden="true" className="size-4" />
            Menu
          </Button>
        </div>
      </div>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        {unlocked} van {levelCount} levels vrijgespeeld
      </p>
    </main>
  );
}
