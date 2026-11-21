import {
  CONTROLLERS,
  MAX_PLAYER_NAME_LENGTH,
  PLAYER_COLORS,
  PLAYER_IDS,
  type Controller,
  type PlayerColor,
  type PlayerId,
} from "@entities/ganzenbord";
import { useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Button, OptionPicker, Panel, SetupPanel, TextInput } from "@shared/ui";
import { PLAYER_COUNTS, type GanzenbordSettings } from "../model/settings";
import { playerName, playerNumber } from "../model/presentation";
import { ganzenbordTexts, ganzenbordUiTexts } from "../model/texts";
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
  const t = useTexts(ganzenbordUiTexts);
  const names = useTexts(ganzenbordTexts);
  const players = PLAYER_IDS.slice(0, settings.playerCount);
  const countOptions = PLAYER_COUNTS.map((value) => ({ value, label: names.playerCount(value) }));

  return (
    <SetupPanel onStart={onStart}>
      <OptionPicker
        columns={3}
        legend={t.playerCountLegend}
        options={countOptions}
        selected={settings.playerCount}
        size="compact"
        onSelect={onPlayerCountChange}
      />

      <div className="space-y-2.5">
        <p className="text-sm font-semibold">{t.whoPlays}</p>
        {players.map((id) => {
          const controller = settings.controllers[id];
          const color = settings.colors[id];
          const number = playerNumber(id);

          return (
            <Panel key={id} padding="sm" surface="subtle">
              <div className="flex items-center gap-2">
                <PlayerToken color={color} className="size-5 shrink-0" />
                <TextInput
                  aria-label={t.nameOf(number)}
                  autoComplete="off"
                  className="flex-1 text-sm"
                  maxLength={MAX_PLAYER_NAME_LENGTH}
                  placeholder={playerName({ id, controller })}
                  spellCheck={false}
                  value={settings.names[id][controller]}
                  onChange={(event) => onNameChange(id, event.target.value)}
                />
                <div className="flex shrink-0 gap-0.5 rounded-xl border border-border bg-card p-0.5">
                  {CONTROLLERS.map((option) => (
                    <Button
                      key={option}
                      aria-label={t.controllerOf(number, names.controllers[option])}
                      aria-pressed={controller === option}
                      className="h-9 px-2.5"
                      size="sm"
                      variant={controller === option ? "default" : "ghost"}
                      onClick={() => onControllerChange(id, option)}
                    >
                      {names.controllers[option]}
                    </Button>
                  ))}
                </div>
              </div>
              <div
                aria-label={t.colorOf(number)}
                className="mt-1.5 flex flex-wrap gap-1"
                role="group"
              >
                {PLAYER_COLORS.map((option) => (
                  <button
                    key={option}
                    aria-label={names.colors[option]}
                    aria-pressed={color === option}
                    className={cn(
                      "grid size-11 place-items-center rounded-full border-2 transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                      color === option
                        ? "border-primary bg-primary-soft"
                        : "border-transparent hover:bg-muted",
                    )}
                    type="button"
                    onClick={() => onColorChange(id, option)}
                  >
                    <PlayerToken color={option} className="size-7" />
                  </button>
                ))}
              </div>
            </Panel>
          );
        })}
        <p className="text-xs text-muted-foreground">{t.setupHint}</p>
      </div>

      <GanzenbordRules />
    </SetupPanel>
  );
}
