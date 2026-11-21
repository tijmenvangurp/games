import { MISSIONS, completedMissionCount, isMissionDone, missionById } from "@entities/alchemy";
import { Badge, Button, Check, Panel } from "@shared/ui";
import { useAlchemyStore } from "../model/use-alchemy-store";

export function AlchemyMissionCard() {
  const discovered = useAlchemyStore((state) => state.discovered);
  const missionId = useAlchemyStore((state) => state.missionId);
  const nextMission = useAlchemyStore((state) => state.nextMission);
  const mission = missionById(missionId);
  const done = mission ? isMissionDone(discovered, mission) : false;
  const completed = completedMissionCount(discovered);

  return (
    <Panel
      as="section"
      aria-label="Opdracht"
      className="flex min-w-0 items-center gap-2.5 px-3.5 py-2.5"
      data-testid="alchemy-mission"
      padding="none"
    >
      <div aria-live="polite" className="min-w-0 flex-1">
        <p className="text-xs font-semibold tabular-nums text-muted-foreground">
          Opdracht {completed}/{MISSIONS.length}
        </p>
        <p className="truncate text-sm font-bold" title={mission?.title}>
          {mission ? mission.title : "Alle opdrachten gedaan!"}
        </p>
      </div>

      {done ? (
        <Badge tone="success">
          <Check aria-hidden="true" className="size-3.5" />
          Gelukt!
        </Badge>
      ) : null}

      {mission ? (
        <Button
          aria-label={done ? "Volgende opdracht" : "Andere opdracht"}
          className="h-11 shrink-0"
          size="sm"
          variant={done ? "success" : "outline"}
          onClick={nextMission}
        >
          {done ? "Volgende" : "Andere"}
        </Button>
      ) : null}
    </Panel>
  );
}
