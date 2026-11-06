import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  isFinished,
  type Dice,
  type GanzenbordGame,
  type PlayerState,
  type TurnEvent,
} from "@entities/ganzenbord";
import { Button, Play } from "@shared/ui";
import { playerName, statusHint, turnText } from "../model/presentation";
import { useGanzenbordStore } from "../model/use-ganzenbord-store";
import { GanzenbordBoard } from "./ganzenbord-board";
import { GanzenbordDice, type GanzenbordDiceHandle } from "./ganzenbord-dice";
import { GanzenbordHud } from "./ganzenbord-hud";
import { GanzenbordRules } from "./ganzenbord-rules";

/** Even wachten zodat de computer niet meteen na de vorige beurt gooit. */
const COMPUTER_THINK_MS = 750;

function asDice(values: readonly number[]): Dice | null {
  if (values.length !== 2) {
    return null;
  }
  const [first, second] = values;
  if (
    !Number.isInteger(first) ||
    !Number.isInteger(second) ||
    first < 1 ||
    first > 6 ||
    second < 1 ||
    second > 6
  ) {
    return null;
  }
  return [first, second];
}

function useComputerRoll(diceRef: RefObject<GanzenbordDiceHandle | null>) {
  const game = useGanzenbordStore((state) => state.game);
  const rolling = useGanzenbordStore((state) => state.rolling);
  const current = game?.players.find((player) => player.id === game.current);

  useEffect(() => {
    if (!game || game.status !== "playing" || rolling || current?.controller !== "computer") {
      return;
    }

    const timer = window.setTimeout(() => {
      const state = useGanzenbordStore.getState();
      const values = state.beginRoll();
      if (!values) {
        return;
      }
      if (diceRef.current) {
        diceRef.current.roll(values);
      } else {
        state.commitRoll(values);
      }
    }, COMPUTER_THINK_MS);

    return () => window.clearTimeout(timer);
  }, [game, rolling, current?.controller, diceRef]);

  return current;
}

function useRollHandlers(diceRef: RefObject<GanzenbordDiceHandle | null>) {
  const handleRoll = () => {
    const state = useGanzenbordStore.getState();
    if (!state.game || state.game.status !== "playing" || state.rolling) {
      return;
    }
    const current = state.game.players.find((player) => player.id === state.game?.current);
    if (current?.controller !== "human") {
      return;
    }

    const values = state.beginRoll();
    if (!values) {
      return;
    }
    if (diceRef.current) {
      diceRef.current.roll(values);
    } else {
      state.commitRoll(values);
    }
  };

  const handleDiceDone = useCallback((values: number[]) => {
    const state = useGanzenbordStore.getState();
    // De dobbelsteen roept `rollDone` ook bij de eerste render aan. Alleen een
    // echte worp mag de beurt afronden.
    if (!state.rolling) {
      return;
    }
    state.commitRoll(asDice(values) ?? undefined);
  }, []);

  return { handleRoll, handleDiceDone };
}

function rollButtonLabel(finished: boolean, rolling: boolean, computerTurn: boolean): string {
  if (finished) {
    return "Klaar";
  }
  if (rolling) {
    return "Gooien…";
  }
  return computerTurn ? "Computer gooit…" : "Gooi!";
}

function statusLine(
  game: GanzenbordGame,
  current: PlayerState | undefined,
  computerTurn: boolean,
): string {
  if (game.status === "draw") {
    return "Iedereen zit vast.";
  }
  if (game.status === "finished") {
    return "De partij is klaar.";
  }
  if (computerTurn && current) {
    return `${playerName(current)} denkt na…`;
  }
  return statusHint(game);
}

interface DiceStatusProps {
  game: GanzenbordGame;
  events: readonly TurnEvent[];
  rolling: boolean;
  current: PlayerState | undefined;
  computerTurn: boolean;
}

function DiceStatus({ game, events, rolling, current, computerTurn }: DiceStatusProps) {
  const primary = rolling ? "De dobbelstenen rollen…" : turnText(game, events);
  const secondary = rolling ? "" : statusLine(game, current, computerTurn);

  return (
    <>
      <p aria-live="polite" className="min-h-10 text-sm font-semibold leading-snug">
        {primary}
      </p>
      {secondary && secondary !== primary ? (
        <p className="text-xs leading-snug text-muted-foreground">{secondary}</p>
      ) : null}
    </>
  );
}

function DicePanel() {
  const game = useGanzenbordStore((state) => state.game);
  const events = useGanzenbordStore((state) => state.events);
  const rolling = useGanzenbordStore((state) => state.rolling);
  const diceRef = useRef<GanzenbordDiceHandle>(null);
  const current = useComputerRoll(diceRef);
  const { handleRoll, handleDiceDone } = useRollHandlers(diceRef);

  useEffect(() => () => useGanzenbordStore.getState().cancelRoll(), []);

  if (!game) {
    return null;
  }

  const finished = isFinished(game);
  const computerTurn = current?.controller === "computer" && !finished;

  return (
    <div className="game-panel flex flex-col gap-2 p-3">
      <GanzenbordDice ref={diceRef} onDone={handleDiceDone} />
      <Button
        aria-label="Gooi met de dobbelstenen"
        className="w-full"
        disabled={finished || rolling || computerTurn}
        size="lg"
        variant="success"
        onClick={handleRoll}
      >
        <Play aria-hidden="true" className="size-5" />
        {rollButtonLabel(finished, rolling, computerTurn)}
      </Button>
      <DiceStatus
        computerTurn={computerTurn}
        current={current}
        events={events}
        game={game}
        rolling={rolling}
      />
    </div>
  );
}

export function GanzenbordPlay() {
  const game = useGanzenbordStore((state) => state.game);
  const wins = useGanzenbordStore((state) => state.wins);

  if (!game) {
    return null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="order-1 lg:order-none lg:col-start-1 lg:row-start-1">
        <GanzenbordBoard game={game} />
      </div>

      <aside className="order-2 flex flex-col gap-3 lg:order-none lg:col-start-2 lg:row-span-2">
        <GanzenbordHud game={game} wins={wins} />
        <DicePanel />
        <GanzenbordRules />
      </aside>
    </div>
  );
}
