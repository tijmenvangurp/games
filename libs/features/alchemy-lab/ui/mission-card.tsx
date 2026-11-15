import { MISSIONS, completedMissionCount, isMissionDone, missionById } from "@entities/alchemy";
import { Button, Check } from "@shared/ui";
import { useAlchemyStore } from "../model/use-alchemy-store";

export function AlchemyMissionCard() {
  const discovered = useAlchemyStore((state) => state.discovered);
  const missionId = useAlchemyStore((state) => state.missionId);
  const nextMission = useAlchemyStore((state) => state.nextMission);
  const mission = missionById(missionId);
  const done = mission ? isMissionDone(discovered, mission) : false;
  const completed = completedMissionCount(discovered);

  return (
    <section
      aria-label="Opdracht"
      className="flex min-w-0 items-center gap-2 rounded-2xl border bg-card px-3 py-2 shadow-sm"
      data-testid="alchemy-mission"
    >
      <div aria-live="polite" className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Opdracht {completed}/{MISSIONS.length}
        </p>
        <p className="truncate text-sm font-black" title={mission?.title}>
          {mission ? mission.title : "Alle opdrachten gedaan!"}
        </p>
      </div>

      {done ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
          <Check aria-hidden="true" className="size-3.5" />
          Gelukt!
        </span>
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
    </section>
  );
}
