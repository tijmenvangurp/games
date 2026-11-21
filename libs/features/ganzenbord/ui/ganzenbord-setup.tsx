import {
  MAX_PLAYER_NAME_LENGTH,
  PLAYER_IDS,
  type Controller,
  type PlayerColor,
  type PlayerId,
} from "@entities/ganzenbord";
import { cn } from "@shared/lib";
import { Button, OptionPicker, Panel, SetupPanel, TextInput } from "@shared/ui";
import {
  CONTROLLER_OPTIONS,
  PLAYER_COUNT_OPTIONS,
  type GanzenbordSettings,
} from "../model/settings";
import { PLAYER_COLOR_OPTIONS, playerName, playerNumber } from "../model/presentation";
import { GanzenbordRules } from "./ganzenbord-rules";
import { PlayerToken } from "./player-token";

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
    <SetupPanel onStart={onStart}>
      <OptionPicker
        columns={3}
        legend="Aantal spelers"
        options={PLAYER_COUNT_OPTIONS}
        selected={settings.playerCount}
        size="compact"
        onSelect={onPlayerCountChange}
      />

      <div className="space-y-2.5">
        <p className="text-sm font-semibold">Wie spelen er mee?</p>
        {players.map((id) => {
          const controller = settings.controllers[id];
          const color = settings.colors[id];
          const number = playerNumber(id);

          return (
            <Panel key={id} padding="sm" surface="subtle">
              <div className="flex items-center gap-2">
                <PlayerToken color={color} className="size-5 shrink-0" />
                <TextInput
                  aria-label={`Naam van speler ${number}`}
                  autoComplete="off"
                  className="flex-1 text-sm"
                  maxLength={MAX_PLAYER_NAME_LENGTH}
                  placeholder={playerName({ id, controller })}
                  spellCheck={false}
                  value={settings.names[id][controller]}
                  onChange={(event) => onNameChange(id, event.target.value)}
                />
                <div className="flex shrink-0 gap-0.5 rounded-xl border border-border bg-card p-0.5">
                  {CONTROLLER_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      aria-label={`Speler ${number}: ${option.label.toLowerCase()}`}
                      aria-pressed={controller === option.value}
                      className="h-9 px-2.5"
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
                className="mt-1.5 flex flex-wrap gap-1"
                role="group"
              >
                {PLAYER_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    aria-label={option.label}
                    aria-pressed={color === option.value}
                    className={cn(
                      "grid size-11 place-items-center rounded-full border-2 transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                      color === option.value
                        ? "border-primary bg-primary-soft"
                        : "border-transparent hover:bg-muted",
                    )}
                    type="button"
                    onClick={() => onColorChange(id, option.value)}
                  >
                    <PlayerToken color={option.value} className="size-7" />
                  </button>
                ))}
              </div>
            </Panel>
          );
        })}
        <p className="text-xs text-muted-foreground">
          Kies per speler of die door een mens of door de computer wordt gespeeld. Speler 1 begint.
          Een eigen naam en kleur zijn optioneel.
        </p>
      </div>

      <GanzenbordRules />
    </SetupPanel>
  );
}
