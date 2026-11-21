import type { Color } from "chess.js";
import { CHESS_AVATARS, COMPUTER_LEVELS, type ChessMode } from "@entities/chess";
import { useTexts } from "@shared/i18n";
import { cn } from "@shared/lib";
import { Bot, Button, OptionPicker, Panel, Play, SetupPanel, TextInput, Users } from "@shared/ui";
import { localName, sideLabel } from "../model/presentation";
import { MAX_NAME_LENGTH } from "../model/settings";
import { useChessGameStore } from "../model/use-chess-game-store";
import { chessGameTexts } from "./texts";

type ChessGameTexts = (typeof chessGameTexts)["nl"];

function modeOptions(t: ChessGameTexts) {
  return [
    {
      value: "friend" as ChessMode,
      label: t.modes.friend,
      leading: <Users className="size-6" />,
    },
    {
      value: "computer" as ChessMode,
      label: t.modes.computer,
      leading: <Bot className="size-6" />,
    },
  ] as const;
}

function levelOptions(t: ChessGameTexts) {
  return COMPUTER_LEVELS.map((level) => ({
    value: level,
    label: t.levels[level],
  }));
}

function sideOptions() {
  return [
    {
      value: "w" as Color,
      label: sideLabel("w"),
      leading: (
        <span className="inline-block size-6 rounded-full border-2 border-foreground/40 bg-card shadow-xs" />
      ),
    },
    {
      value: "b" as Color,
      label: sideLabel("b"),
      leading: (
        <span className="inline-block size-6 rounded-full border-2 border-foreground/20 bg-foreground shadow-xs" />
      ),
    },
  ] as const;
}

function PlayerSetup({ color }: { readonly color: Color }) {
  const t = useTexts(chessGameTexts);
  const mode = useChessGameStore((state) => state.mode);
  const humanColor = useChessGameStore((state) => state.humanColor);
  const player = useChessGameStore((state) => state.players[color]);
  const setPlayerName = useChessGameStore((state) => state.setPlayerName);
  const setPlayerAvatar = useChessGameStore((state) => state.setPlayerAvatar);
  const isComputer = mode === "computer" && color !== humanColor;
  const label = sideLabel(color);

  return (
    <Panel as="fieldset" padding="sm" surface="subtle">
      <legend className="px-1.5 text-sm font-bold text-foreground">
        {label}
        {isComputer ? t.computerSuffix : ""}
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-card text-2xl"
        >
          {player.avatar}
        </span>
        {isComputer ? (
          <p className="flex min-h-11 flex-1 items-center font-bold text-foreground">
            {t.computer}
          </p>
        ) : (
          <TextInput
            aria-label={t.nameFor(label.toLowerCase())}
            className="w-32 flex-1"
            maxLength={MAX_NAME_LENGTH}
            placeholder={label}
            value={localName(player.name)}
            onChange={(event) => setPlayerName(color, event.target.value)}
          />
        )}
      </div>
      <div
        aria-label={t.avatarFor(label.toLowerCase())}
        className="mt-2.5 flex flex-wrap gap-1.5"
        role="group"
      >
        {CHESS_AVATARS.map((avatar) => (
          <button
            key={avatar}
            aria-label={t.avatar(avatar)}
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
  const t = useTexts(chessGameTexts);
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
      startLabel={canResume ? t.newGame : t.play}
      subtitle={t.setupSubtitle}
      title={t.newGame}
      onStart={startGame}
    >
      {canResume ? (
        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft p-3.5">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground">{t.saved}</p>
            <p className="text-sm text-muted-foreground">{t.movesOnBoard(moveCount)}</p>
          </div>
          <Button size="lg" variant="success" onClick={resumeGame}>
            <Play aria-hidden="true" className="size-5" />
            {t.resume}
          </Button>
        </section>
      ) : null}

      <OptionPicker
        columns={2}
        legend={t.opponentLegend}
        options={modeOptions(t)}
        selected={mode}
        onSelect={setMode}
      />

      {mode === "computer" ? (
        <>
          <OptionPicker
            legend={t.levelLegend}
            options={levelOptions(t)}
            selected={level}
            size="compact"
            onSelect={setLevel}
          />
          <OptionPicker
            columns={2}
            legend={t.sideLegend}
            options={sideOptions()}
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
