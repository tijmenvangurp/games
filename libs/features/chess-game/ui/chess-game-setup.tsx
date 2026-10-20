import type { Color } from "chess.js";
import {
  CHESS_AVATARS,
  COMPUTER_LEVELS,
  COMPUTER_LEVEL_INFO,
  type ChessMode,
} from "@entities/chess";
import { cn } from "@shared/lib";
import { Button, OptionPicker, Play } from "@shared/ui";
import { SIDE_LABEL } from "../model/presentation";
import { MAX_NAME_LENGTH } from "../model/settings";
import { useChessGameStore } from "../model/use-chess-game-store";

const MODE_OPTIONS = [
  {
    value: "friend" as ChessMode,
    label: "Samen spelen",
    hint: "Om de beurt op dit scherm",
    emoji: "👫",
  },
  {
    value: "computer" as ChessMode,
    label: "Computer",
    hint: "Speel tegen Stockfish",
    emoji: "🤖",
  },
] as const;

const LEVEL_OPTIONS = COMPUTER_LEVELS.map((level) => ({
  value: level,
  label: COMPUTER_LEVEL_INFO[level].label,
  hint: COMPUTER_LEVEL_INFO[level].hint,
  emoji: COMPUTER_LEVEL_INFO[level].emoji,
}));

const SIDE_OPTIONS = [
  { value: "w" as Color, label: "Wit", hint: "Jij begint", emoji: "⚪" },
  { value: "b" as Color, label: "Zwart", hint: "Computer begint", emoji: "⚫" },
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
    <fieldset className="rounded-2xl border border-slate-200 bg-white/80 p-3">
      <legend className="px-1 text-sm font-black text-slate-700">
        {label}
        {isComputer ? " · computer" : ""}
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-muted text-2xl"
        >
          {player.avatar}
        </span>
        {isComputer ? (
          <p className="min-h-11 flex flex-1 items-center font-black text-slate-800">Computer</p>
        ) : (
          <input
            aria-label={`Naam voor ${label.toLowerCase()}`}
            className="min-h-11 w-32 flex-1 rounded-xl border-2 border-border bg-card px-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            maxLength={MAX_NAME_LENGTH}
            placeholder={label}
            type="text"
            value={player.name}
            onChange={(event) => setPlayerName(color, event.target.value)}
          />
        )}
      </div>
      <div
        aria-label={`Kies een avatar voor ${label.toLowerCase()}`}
        className="mt-2 flex flex-wrap gap-1.5"
        role="group"
      >
        {CHESS_AVATARS.map((avatar) => (
          <button
            key={avatar}
            aria-label={`Avatar ${avatar}`}
            aria-pressed={player.avatar === avatar}
            className={cn(
              "grid size-11 place-items-center rounded-xl border-2 text-xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
              player.avatar === avatar
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted",
            )}
            type="button"
            onClick={() => setPlayerAvatar(color, avatar)}
          >
            <span aria-hidden="true">{avatar}</span>
          </button>
        ))}
      </div>
    </fieldset>
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
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-black">Nieuwe partij</h2>
        <p className="text-sm text-muted-foreground">
          Kies je tegenstander, een avatar en een naam. Daarna zie je meteen wie aan zet is.
        </p>
      </div>

      {canResume ? (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-3">
          <div className="min-w-0 flex-1">
            <p className="font-black">Je partij is bewaard</p>
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

      <div className="space-y-2">
        <PlayerSetup color="w" />
        <PlayerSetup color="b" />
      </div>

      <Button className="w-full" size="lg" variant="success" onClick={startGame}>
        <Play aria-hidden="true" className="size-5" />
        {canResume ? "Nieuwe partij" : "Spelen"}
      </Button>
    </section>
  );
}
