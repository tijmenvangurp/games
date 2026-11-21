import {
  Badge,
  Button,
  Confetti,
  LayoutGrid,
  Lightbulb,
  Panel,
  ProgressBar,
  RotateCcw,
  StatusBanner,
  Trophy,
  Undo2,
} from "@shared/ui";
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
      ? "Tik nu een tweede tandwiel voor de ketting."
      : "Kies een onderdeel of sleep een geplaatst onderdeel naar de la.";
  }
  if (item.kind === "gear") {
    return "Tik op een leeg gat voor het tandwiel.";
  }
  return "Tik op een tandwiel om de ketting eromheen te hangen.";
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
    ? "text-success-ink"
    : result.jammed || feedbackTone === "warn"
      ? "text-warning-ink"
      : "text-muted-foreground";

  return (
    <Panel as="header" className="px-3.5 py-2.5 sm:px-4" padding="none">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">
            <span className="sm:hidden">Hoofdstuk {level.chapter}</span>
            <span className="hidden sm:inline">
              Hoofdstuk {level.chapter} · {chapterName(level.chapter)}
            </span>
          </p>
          <h2 className="font-display text-lg leading-tight tracking-tight sm:text-xl">
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
          <Badge className="mr-1.5 align-middle" size="sm" tone="primary">
            Nieuw
          </Badge>
          {level.intro}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <ProgressBar
            className="w-20"
            label={`${placedCount} van ${total} onderdelen geplaatst`}
            max={total}
            tone={solving ? "success" : "primary"}
            value={placedCount}
          />
          <span className="text-xs font-bold tabular-nums text-muted-foreground">
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
        <StatusBanner
          action={
            <Button size="sm" variant="success" onClick={onNext}>
              {hasNext ? "Volgende level" : "Opnieuw spelen"}
            </Button>
          }
          className="mt-2 min-h-0 p-2"
          icon={<Trophy className="size-5" />}
          tone="success"
        >
          <Confetti pieces={celebrate ? 48 : 30} variant="shower" />
          <span className="text-sm font-bold">{hasNext ? "Gelukt!" : "Alle levels gehaald!"}</span>
        </StatusBanner>
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
    </Panel>
  );
}
