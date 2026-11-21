import type { Color } from "chess.js";
import {
  CHESS_AVATARS,
  COMPUTER_LEVELS,
  COMPUTER_LEVEL_INFO,
  type ChessMode,
} from "@entities/chess";
import { cn } from "@shared/lib";
import { Bot, Button, OptionPicker, Panel, Play, SetupPanel, TextInput, Users } from "@shared/ui";
import { SIDE_LABEL } from "../model/presentation";
import { MAX_NAME_LENGTH } from "../model/settings";
import { useChessGameStore } from "../model/use-chess-game-store";

const MODE_OPTIONS = [
  {
    value: "friend" as ChessMode,
    label: "Samen spelen",
    leading: <Users className="size-6" />,
  },
  {
    value: "computer" as ChessMode,
    label: "Computer",
    leading: <Bot className="size-6" />,
  },
] as const;

const LEVEL_OPTIONS = COMPUTER_LEVELS.map((level) => ({
  value: level,
  label: COMPUTER_LEVEL_INFO[level].label,
}));

const SIDE_OPTIONS = [
  {
    value: "w" as Color,
    label: "Wit",
    leading: (
      <span className="inline-block size-6 rounded-full border-2 border-foreground/40 bg-card shadow-xs" />
    ),
  },
  {
    value: "b" as Color,
    label: "Zwart",
    leading: (
      <span className="inline-block size-6 rounded-full border-2 border-foreground/20 bg-foreground shadow-xs" />
    ),
  },
] as const;

function PlayerSetup({ color }: { readonly color: Color }) {
  const mode = useChessGameStore((state) => state.mode);
  const humanColor = useChessGameStore((state) => state.humanColor);
  const player = useChessGameStore((state) => state.players[color]);
  const setPlayerName = useChessGameStore((state) => state.setPlayerName);
  const setPlayerAvatar = useChessGameStore((state) => state.setPlayerAvatar);
  const isComputer = mode === "computer" && color !== humanColor;
  const label = SIDE_LABEL[color];

  return (
    <Panel as="fieldset" padding="sm" surface="subtle">
      <legend className="px-1.5 text-sm font-bold text-foreground">
        {label}
        {isComputer ? " · computer" : ""}
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-card text-2xl"
        >
          {player.avatar}
        </span>
        {isComputer ? (
          <p className="flex min-h-11 flex-1 items-center font-bold text-foreground">Computer</p>
        ) : (
          <TextInput
            aria-label={`Naam voor ${label.toLowerCase()}`}
            className="w-32 flex-1"
            maxLength={MAX_NAME_LENGTH}
            placeholder={label}
            value={player.name}
            onChange={(event) => setPlayerName(color, event.target.value)}
          />
        )}
      </div>
      <div
        aria-label={`Kies een avatar voor ${label.toLowerCase()}`}
        className="mt-2.5 flex flex-wrap gap-1.5"
        role="group"
      >
        {CHESS_AVATARS.map((avatar) => (
          <button
            key={avatar}
            aria-label={`Avatar ${avatar}`}
            aria-pressed={player.avatar === avatar}
            className={cn(
              "grid size-11 place-items-center rounded-xl border text-xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
              player.avatar === avatar
                ? "border-primary bg-primary-soft ring-1 ring-primary/20"
                : "border-border bg-card hover:border-border-strong hover:bg-muted",
            )}
            type="button"
            onClick={() => setPlayerAvatar(color, avatar)}
          >
            <span aria-hidden="true">{avatar}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function ChessGameSetup() {
  const mode = useChessGameStore((state) => state.mode);
  const level = useChessGameStore((state) => state.level);
  const humanColor = useChessGameStore((state) => state.humanColor);
  const setMode = useChessGameStore((state) => state.setMode);
  const setLevel = useChessGameStore((state) => state.setLevel);
  const setHumanColor = useChessGameStore((state) => state.setHumanColor);
  const startGame = useChessGameStore((state) => state.startGame);
  const resumeGame = useChessGameStore((state) => state.resumeGame);
  const canResume = useChessGameStore((state) => state.canResume());
  const moveCount = useChessGameStore((state) => state.history.length);

  return (
    <SetupPanel
      className="mx-auto w-full max-w-xl"
      startLabel={canResume ? "Nieuwe partij" : "Spelen"}
      subtitle="Kies je tegenstander, een avatar en een naam. Daarna zie je meteen wie aan zet is."
      title="Nieuwe partij"
      onStart={startGame}
    >
      {canResume ? (
        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft p-3.5">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground">Je partij is bewaard</p>
            <p className="text-sm text-muted-foreground">
              {moveCount === 1
                ? "Er staat 1 zet op het bord."
                : `Er staan ${moveCount} zetten op het bord.`}
            </p>
          </div>
          <Button size="lg" variant="success" onClick={resumeGame}>
            <Play aria-hidden="true" className="size-5" />
            Doorgaan
          </Button>
        </section>
      ) : null}

      <OptionPicker
        columns={2}
        legend="Tegen wie?"
        options={MODE_OPTIONS}
        selected={mode}
        onSelect={setMode}
      />

      {mode === "computer" ? (
        <>
          <OptionPicker
            legend="Hoe sterk is de computer?"
            options={LEVEL_OPTIONS}
            selected={level}
            size="compact"
            onSelect={setLevel}
          />
          <OptionPicker
            columns={2}
            legend="Met welke kleur speel jij?"
            options={SIDE_OPTIONS}
            selected={humanColor}
            onSelect={setHumanColor}
          />
        </>
      ) : null}

      <div className="space-y-2.5">
        <PlayerSetup color="w" />
        <PlayerSetup color="b" />
      </div>
    </SetupPanel>
  );
}
