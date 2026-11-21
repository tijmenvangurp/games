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
import { useLanguage, useTexts } from "@shared/i18n";
import { levelText, type DriveResult, type Level, type TrayItem } from "@entities/gear";
import { chapterName, outputName } from "../model/labels";
import { statusMessage } from "../model/feedback";
import { useDraaiwerkStore, useSelectedTrayItem } from "../model/use-draaiwerk-store";
import { draaiwerkTexts } from "../model/texts";
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

type DraaiwerkTexts = (typeof draaiwerkTexts)["nl"];

function instructionFor(
  t: DraaiwerkTexts,
  item: TrayItem | null,
  pendingGearKey: string | null,
): string {
  if (!item) {
    return pendingGearKey ? t.instructionSecondGear : t.instructionChoose;
  }
  if (item.kind === "gear") {
    return t.instructionGear;
  }
  return t.instructionChain;
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
  const t = useTexts(draaiwerkTexts);
  const text = levelText(level, useLanguage());

  const total = level.tray.length;
  const placedCount = solving ? total : usedTrayIds.length;
  const allUsed = total > 0 && usedTrayIds.length >= total;
  const gauges = level.outputs
    .filter((output) => output.minSpeed !== undefined || output.maxSpeed !== undefined)
    .map((output) => ({
      output,
      pose: result.outputs.find((candidate) => candidate.id === output.id),
    }));

  const instruction = instructionFor(t, selectedItem, pendingGearKey);
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
            <span className="sm:hidden">{t.chapter(level.chapter)}</span>
            <span className="hidden sm:inline">
              {t.chapter(level.chapter)} · {chapterName(level.chapter)}
            </span>
          </p>
          <h2 className="font-display text-lg leading-tight tracking-tight sm:text-xl">
            Level {levelIndex + 1} · {text.name}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            aria-label={t.hint}
            disabled={solving}
            size="icon"
            variant="ghost"
            onClick={onHint}
          >
            <Lightbulb aria-hidden="true" className="size-5 text-warning" />
          </Button>
          <Button
            aria-label={t.undo}
            disabled={solving || placements.length === 0}
            size="icon"
            variant="ghost"
            onClick={onRemoveLast}
          >
            <Undo2 aria-hidden="true" className="size-5" />
          </Button>
          <Button aria-label={t.reset} size="icon" variant="ghost" onClick={onReset}>
            <RotateCcw aria-hidden="true" className="size-5" />
          </Button>
          <Button aria-label={t.chooseLevel} size="icon" variant="ghost" onClick={onLevels}>
            <LayoutGrid aria-hidden="true" className="size-5" />
          </Button>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug">
          <Badge className="mr-1.5 align-middle" size="sm" tone="primary">
            {t.newBadge}
          </Badge>
          {text.intro}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <ProgressBar
            className="w-20"
            label={t.partsPlaced(placedCount, total)}
            max={total}
            tone={solving ? "success" : "primary"}
            value={placedCount}
          />
          <span className="text-xs font-bold tabular-nums text-muted-foreground">
            {solving ? t.done : `${usedTrayIds.length}/${total}`}
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
              {hasNext ? t.nextLevel : t.playAgain}
            </Button>
          }
          className="mt-2 min-h-0 p-2"
          icon={<Trophy className="size-5" />}
          tone="success"
        >
          <Confetti pieces={celebrate ? 48 : 30} variant="shower" />
          <span className="text-sm font-bold">{hasNext ? t.success : t.allDone}</span>
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
