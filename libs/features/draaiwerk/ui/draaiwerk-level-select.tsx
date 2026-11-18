import { useMemo } from "react";
import { Check, Lock } from "@shared/ui";
import { cn } from "@shared/lib";
import type { Level } from "@entities/gear";
import { chapterName, introducesLabel } from "../model/labels";

interface DraaiwerkLevelSelectProps {
  levels: readonly Level[];
  unlocked: number;
  current: number;
  finished: boolean;
  onSelect: (index: number) => void;
}

interface ChapterEntry {
  level: Level;
  index: number;
}

interface ChapterGroup {
  chapter: number;
  entries: ChapterEntry[];
}

export function DraaiwerkLevelSelect({
  levels,
  unlocked,
  current,
  finished,
  onSelect,
}: DraaiwerkLevelSelectProps) {
  const chapters = useMemo(() => {
    const groups = new Map<number, ChapterEntry[]>();
    levels.forEach((level, index) => {
      const group = groups.get(level.chapter);
      if (group) {
        group.push({ level, index });
      } else {
        groups.set(level.chapter, [{ level, index }]);
      }
    });
    return [...groups.entries()].map(([chapter, entries]): ChapterGroup => ({ chapter, entries }));
  }, [levels]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
      <p className="px-1 text-xs leading-snug text-muted-foreground sm:text-sm">
        Elk level voegt iets nieuws toe. Kies een level en bouw de beweging van de motor naar het
        doel.
      </p>

      {chapters.map(({ chapter, entries }) => {
        const first = (entries[0]?.index ?? 0) + 1;
        const last = (entries[entries.length - 1]?.index ?? 0) + 1;
        const done = entries.filter(
          (entry) => entry.index < unlocked - 1 || (finished && entry.index === levels.length - 1),
        ).length;

        return (
          <section className="game-panel p-2.5 sm:p-3" key={chapter}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-display text-base leading-tight sm:text-lg">
                  {chapterName(chapter)}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Hoofdstuk {chapter} · level {first}–{last}
                </p>
              </div>
              <p className="shrink-0 text-[10px] font-bold text-muted-foreground">
                {done}/{entries.length} gehaald
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {entries.map(({ level, index }) => {
                const locked = index >= unlocked;
                const completed = index < unlocked - 1 || (finished && index === levels.length - 1);
                const active = index === current && !locked;

                return (
                  <button
                    key={level.id}
                    aria-label={`Level ${index + 1}, ${level.name}${
                      locked ? ", vergrendeld" : completed ? ", gehaald" : ""
                    }`}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "relative flex min-h-16 flex-col items-start justify-between gap-0.5 rounded-lg border p-2 text-left transition active:scale-[0.99]",
                      locked
                        ? "border-border bg-muted/30 text-muted-foreground"
                        : "border-border bg-card hover:bg-muted/50",
                      active && "border-primary ring-2 ring-primary/20",
                      completed && "bg-card",
                    )}
                    data-level-id={level.id}
                    data-state={
                      locked ? "locked" : completed ? "completed" : active ? "current" : "open"
                    }
                    disabled={locked}
                    type="button"
                    onClick={() => onSelect(index)}
                  >
                    <span className="pr-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Level {index + 1}
                    </span>
                    <span className="text-sm font-black leading-tight">{level.name}</span>
                    <span className="text-[10px] leading-tight text-muted-foreground">
                      {introducesLabel(level.introduces)}
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
          </section>
        );
      })}

      <p className="text-center text-xs text-muted-foreground">
        {finished
          ? `${levels.length} van ${levels.length} levels gehaald`
          : `${Math.min(unlocked, levels.length)} van ${levels.length} levels vrijgespeeld`}
      </p>
    </div>
  );
}
