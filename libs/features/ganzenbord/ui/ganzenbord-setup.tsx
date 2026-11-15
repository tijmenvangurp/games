import {
  MAX_PLAYER_NAME_LENGTH,
  PLAYER_IDS,
  type Controller,
  type PlayerColor,
  type PlayerId,
} from "@entities/ganzenbord";
import { cn } from "@shared/lib";
import { Button, OptionPicker, SetupActions } from "@shared/ui";
import {
  CONTROLLER_OPTIONS,
  PLAYER_COUNT_OPTIONS,
  type GanzenbordSettings,
} from "../model/settings";
import {
  PLAYER_COLOR_OPTIONS,
  playerColorClass,
  playerName,
  playerNumber,
} from "../model/presentation";
import { GanzenbordRules } from "./ganzenbord-rules";

interface GanzenbordSetupProps {
  settings: GanzenbordSettings;
  onStart: () => void;
  onPlayerCountChange: (count: number) => void;
  onControllerChange: (id: PlayerId, controller: Controller) => void;
  onNameChange: (id: PlayerId, name: string) => void;
  onColorChange: (id: PlayerId, color: PlayerColor) => void;
}

export function GanzenbordSetup({
  settings,
  onStart,
  onPlayerCountChange,
  onControllerChange,
  onNameChange,
  onColorChange,
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
          const color = settings.colors[id];
          const number = playerNumber(id);

          return (
            <div key={id} className="rounded-lg border border-border bg-card px-2.5 py-2">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn("size-3.5 shrink-0 rounded-full", playerColorClass(color))}
                />
                <input
                  aria-label={`Naam van speler ${number}`}
                  autoComplete="off"
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                  maxLength={MAX_PLAYER_NAME_LENGTH}
                  placeholder={playerName({ id, controller })}
                  spellCheck={false}
                  type="text"
                  value={settings.names[id]}
                  onChange={(event) => onNameChange(id, event.target.value)}
                />
                <div className="flex shrink-0 gap-0.5 rounded-lg border border-border p-0.5">
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
              <div
                aria-label={`Kleur van speler ${number}`}
                className="mt-1 flex flex-wrap gap-1"
                role="group"
              >
                {PLAYER_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    aria-label={option.label}
                    aria-pressed={color === option.value}
                    className={cn(
                      "grid size-11 place-items-center rounded-full border-2 transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                      color === option.value
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-muted",
                    )}
                    type="button"
                    onClick={() => onColorChange(id, option.value)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-6 rounded-full", playerColorClass(option.value))}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          Kies per speler of die door een mens of door de computer wordt gespeeld. Speler 1 begint.
          Een eigen naam en kleur zijn optioneel.
        </p>
      </div>

      <div className="mt-5">
        <GanzenbordRules />
      </div>

      <SetupActions onStart={onStart} />
    </section>
  );
}
