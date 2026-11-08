import { PLAYER_IDS, type Controller, type PlayerId } from "@entities/ganzenbord";
import { cn } from "@shared/lib";
import { Button, OptionPicker, SetupActions } from "@shared/ui";
import {
  CONTROLLER_OPTIONS,
  PLAYER_COUNT_OPTIONS,
  type GanzenbordSettings,
} from "../model/settings";
import { playerColorClass, playerNumber } from "../model/presentation";
import { GanzenbordRules } from "./ganzenbord-rules";

interface GanzenbordSetupProps {
  settings: GanzenbordSettings;
  onStart: () => void;
  onPlayerCountChange: (count: number) => void;
  onControllerChange: (id: PlayerId, controller: Controller) => void;
}

export function GanzenbordSetup({
  settings,
  onStart,
  onPlayerCountChange,
  onControllerChange,
}: GanzenbordSetupProps) {
  const players = PLAYER_IDS.slice(0, settings.playerCount);

  return (
    <section className="game-panel animate-rise p-4 sm:p-6">
      <h2 className="mb-5 text-xl font-black">Nieuw spel</h2>

      <OptionPicker
        columns={3}
        legend="Aantal spelers"
        options={PLAYER_COUNT_OPTIONS}
        selected={settings.playerCount}
        onSelect={onPlayerCountChange}
      />

      <div className="mt-5 space-y-2">
        <p className="text-sm font-semibold">Wie spelen er mee?</p>
        {players.map((id) => {
          const controller = settings.controllers[id];
          const number = playerNumber(id);

          return (
            <div
              key={id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2"
            >
              <span
                aria-hidden="true"
                className={cn("size-3.5 shrink-0 rounded-full", playerColorClass(id))}
              />
              <span className="truncate text-sm font-bold">Speler {number}</span>
              <div className="ml-auto flex shrink-0 gap-0.5 rounded-lg border border-border p-0.5">
                {CONTROLLER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    aria-label={`Speler ${number}: ${option.label.toLowerCase()}`}
                    aria-pressed={controller === option.value}
                    className="h-8 px-2.5"
                    size="sm"
                    variant={controller === option.value ? "default" : "ghost"}
                    onClick={() => onControllerChange(id, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          Kies per speler of die door een mens of door de computer wordt gespeeld. Speler 1 begint.
        </p>
      </div>

      <div className="mt-5">
        <GanzenbordRules />
      </div>

      <SetupActions onStart={onStart} />
    </section>
  );
}
