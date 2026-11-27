import {
  MISSIONS,
  completedMissionCount,
  isMissionDone,
  missionById,
  missionTitle,
} from "@entities/alchemy";
import { useLanguage, useTexts } from "@shared/i18n";
import { Badge, Button, Check, Panel } from "@shared/ui";
import { useAlchemyStore } from "../model/use-alchemy-store";
import { alchemyTexts } from "./texts";

export function AlchemyMissionCard() {
  const discovered = useAlchemyStore((state) => state.discovered);
  const missionId = useAlchemyStore((state) => state.missionId);
  const nextMission = useAlchemyStore((state) => state.nextMission);
  const mission = missionById(missionId);
  const done = mission ? isMissionDone(discovered, mission) : false;
  const completed = completedMissionCount(discovered);
  const language = useLanguage();
  const t = useTexts(alchemyTexts);
  const title = mission ? missionTitle(mission, language) : undefined;

  return (
    <Panel
      as="section"
      aria-label={t.mission}
      className="flex min-w-0 items-center gap-2.5 px-3.5 py-2.5"
      data-testid="alchemy-mission"
      padding="none"
    >
      <div aria-live="polite" className="min-w-0 flex-1">
        <p className="text-xs font-semibold tabular-nums text-muted-foreground">
          {t.missionProgress(completed, MISSIONS.length)}
        </p>
        <p className="truncate text-sm font-bold" title={title}>
          {title ?? t.allMissionsDone}
        </p>
      </div>

      {mission ? <MissionActions done={done} onNext={nextMission} /> : null}
    </Panel>
  );
}

/** Het vinkje bij een gelukte opdracht en de knop naar de volgende of een andere opdracht. */
function MissionActions({ done, onNext }: { done: boolean; onNext: () => void }) {
  const t = useTexts(alchemyTexts);

  return (
    <>
      {done ? (
        <Badge tone="success">
          <Check aria-hidden="true" className="size-3.5" />
          {t.missionDone}
        </Badge>
      ) : null}

      <Button
        aria-label={done ? t.nextMissionLabel : t.otherMissionLabel}
        className="h-11 shrink-0"
        size="sm"
        variant={done ? "success" : "outline"}
        onClick={onNext}
      >
        {done ? t.nextMission : t.otherMission}
      </Button>
    </>
  );
}
