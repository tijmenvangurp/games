import { Button, Confetti, LayoutGrid, Lightbulb, RotateCcw, Trophy, Undo2 } from "@shared/ui";
import { cn } from "@shared/lib";
import type { DriveResult, Level, TrayItem } from "@entities/gear";
import { chapterName, outputName } from "../model/labels";
import { statusMessage } from "../model/feedback";
import { useDraaiwerkStore, useSelectedTrayItem } from "../model/use-draaiwerk-store";
import { SpeedGauge } from "./speed-gauge";

interface DraaiwerkHudProps {
  level: Level;
  result: DriveResult;
  celebrate: boolean;
  hasNext: boolean;
  onHint: () => void;
  onReset: () => void;
  onRemoveLast: () => void;
  onLevels: () => void;
  onNext: () => void;
}

function instructionFor(item: TrayItem | null, pendingGearKey: string | null): string {
  if (!item) {
    return pendingGearKey
      ? "Tik nu een tweede tandwiel voor de riem."
      : "Kies een onderdeel of sleep een geplaatst onderdeel naar de la.";
  }
  if (item.kind === "gear") {
    return "Tik op een leeg gat voor het tandwiel.";
  }
  if (item.kind === "worm") {
    return "Tik op een leeg gat; de wormas zoekt zelf de tweede plek.";
  }
  return "Tik op een tandwiel om de riem eromheen te hangen.";
}

export function DraaiwerkHud({
  level,
  result,
  celebrate,
  hasNext,
  onHint,
  onReset,
  onRemoveLast,
  onLevels,
  onNext,
}: DraaiwerkHudProps) {
  const levelIndex = useDraaiwerkStore((state) => state.levelIndex);
  const status = useDraaiwerkStore((state) => state.status);
  const placements = useDraaiwerkStore((state) => state.placements);
  const usedTrayIds = useDraaiwerkStore((state) => state.usedTrayIds);
  const selectedItem = useSelectedTrayItem();
  const pendingGearKey = useDraaiwerkStore((state) => state.pendingGearKey);
  const feedback = useDraaiwerkStore((state) => state.feedback);
  const feedbackTone = useDraaiwerkStore((state) => state.feedbackTone);
  const solving = status === "solved";

  const total = level.tray.length;
  const placedCount = solving ? total : usedTrayIds.length;
  const progress = total === 0 ? 0 : placedCount / total;
  const allUsed = total > 0 && usedTrayIds.length >= total;
  const gauges = level.outputs
    .filter((output) => output.minSpeed !== undefined || output.maxSpeed !== undefined)
    .map((output) => ({
      output,
      pose: result.outputs.find((candidate) => candidate.id === output.id),
    }));

  const instruction = instructionFor(selectedItem, pendingGearKey);
  const statusText = statusMessage(level, result, feedback, instruction, allUsed);

  const tone = result.solved
    ? "text-success"
    : result.jammed || feedbackTone === "warn"
      ? "text-warning"
      : "text-muted-foreground";

  return (
    <header className="game-panel px-3 py-2.5 sm:px-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span className="sm:hidden">Hoofdstuk {level.chapter}</span>
            <span className="hidden sm:inline">
              Hoofdstuk {level.chapter} · {chapterName(level.chapter)}
            </span>
          </p>
          <h2 className="text-base font-black leading-tight tracking-tight sm:text-lg">
            Level {levelIndex + 1} · {level.name}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button aria-label="Hint" disabled={solving} size="icon" variant="ghost" onClick={onHint}>
            <Lightbulb aria-hidden="true" className="size-5 text-warning" />
          </Button>
          <Button
            aria-label="Ongedaan maken"
            disabled={solving || placements.length === 0}
            size="icon"
            variant="ghost"
            onClick={onRemoveLast}
          >
            <Undo2 aria-hidden="true" className="size-5" />
          </Button>
          <Button aria-label="Opnieuw" size="icon" variant="ghost" onClick={onReset}>
            <RotateCcw aria-hidden="true" className="size-5" />
          </Button>
          <Button aria-label="Kies level" size="icon" variant="ghost" onClick={onLevels}>
            <LayoutGrid aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug">
          <span className="mr-1.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 align-middle text-[10px] font-black uppercase tracking-wider text-primary">
            Nieuw:
          </span>
          {level.intro}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <div
            aria-label={`${placedCount} van ${total} onderdelen geplaatst`}
            aria-valuemax={total}
            aria-valuemin={0}
            aria-valuenow={placedCount}
            className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            {solving ? "klaar" : `${usedTrayIds.length}/${total}`}
          </span>
        </div>
      </div>

      {gauges.length > 0 ? (
        <div className="mt-2 flex items-end gap-4 border-t border-border pt-2">
          {gauges.map(({ output, pose }) => (
            <SpeedGauge
              key={output.id}
              label={outputName(output.kind)}
              maxSpeed={output.maxSpeed}
              minSpeed={output.minSpeed}
              satisfied={pose?.satisfied ?? false}
              speed={pose?.speed ?? 0}
            />
          ))}
        </div>
      ) : null}

      {result.solved ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-2">
          <Confetti pieces={celebrate ? 48 : 30} variant="shower" />
          <Trophy aria-hidden="true" className="size-5 text-success" />
          <p className="min-w-0 flex-1 text-sm font-bold text-success">
            {hasNext ? "Gelukt!" : "Alle levels gehaald!"}
          </p>
          <Button size="sm" variant="success" onClick={onNext}>
            {hasNext ? "Volgende level" : "Opnieuw spelen"}
          </Button>
        </div>
      ) : null}

      <p
        aria-live="polite"
        className={cn(
          "mt-1.5 min-h-4 text-xs font-semibold leading-snug",
          tone,
          result.solved && "sr-only",
        )}
        data-status-text={statusText}
      >
        {statusText}
      </p>
    </header>
  );
}
