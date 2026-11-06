import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  isFinished,
  type Dice,
  type GanzenbordGame,
  type PlayerState,
  type TurnEvent,
} from "@entities/ganzenbord";
import { Button, Play } from "@shared/ui";
import type { TurnAnimation } from "../model/animation";
import { eventMessage, playerName, statusHint, turnText } from "../model/presentation";
import { useGanzenbordStore } from "../model/use-ganzenbord-store";
import { GanzenbordBoard } from "./ganzenbord-board";
import { GanzenbordDice, type GanzenbordDiceHandle } from "./ganzenbord-dice";
import { GanzenbordEvent } from "./ganzenbord-event";
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
  const animating = useGanzenbordStore((state) => Boolean(state.animation));
  const current = game?.players.find((player) => player.id === game.current);

  useEffect(() => {
    if (
      !game ||
      game.status !== "playing" ||
      rolling ||
      animating ||
      current?.controller !== "computer"
    ) {
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
  }, [game, rolling, animating, current?.controller, diceRef]);

  return current;
}

function useRollHandlers(diceRef: RefObject<GanzenbordDiceHandle | null>) {
  const handleRoll = () => {
    const state = useGanzenbordStore.getState();
    if (!state.game || state.game.status !== "playing" || state.rolling || state.animation) {
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

function rollButtonLabel(
  finished: boolean,
  rolling: boolean,
  animating: boolean,
  computerTurn: boolean,
): string {
  if (finished) {
    return "Klaar";
  }
  if (animating) {
    return "Gaan…";
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
  primary: string;
  secondary: string;
}

function animationStatusText(game: GanzenbordGame, animation: TurnAnimation): string | null {
  const step = animation.steps[animation.index];
  if (!step) {
    return null;
  }

  if (step.event?.kind === "roll") {
    return turnText(game, [step.event]);
  }

  if (step.event) {
    const message = eventMessage(game, step.event);
    if (message) {
      return message;
    }
  }

  const mover = game.players.find((player) => player.id === animation.player);
  return `${mover ? playerName(mover) : "De gans"} gaat naar vak ${step.position}.`;
}

function diceStatusText(
  game: GanzenbordGame,
  events: readonly TurnEvent[],
  rolling: boolean,
  current: PlayerState | undefined,
  computerTurn: boolean,
  animation: TurnAnimation | null,
): DiceStatusProps {
  const primary = rolling
    ? "De dobbelstenen rollen…"
    : ((animation ? animationStatusText(game, animation) : null) ?? turnText(game, events));
  const secondary = rolling || animation ? "" : statusLine(game, current, computerTurn);
  return { primary, secondary };
}

function DiceStatus({ primary, secondary }: DiceStatusProps) {
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
  const animation = useGanzenbordStore((state) => state.animation);
  const diceRef = useRef<GanzenbordDiceHandle>(null);
  const current = useComputerRoll(diceRef);
  const { handleRoll, handleDiceDone } = useRollHandlers(diceRef);

  useEffect(() => () => useGanzenbordStore.getState().cancelRoll(), []);

  useEffect(() => {
    if (!animation) {
      return;
    }
    const step = animation.steps[animation.index];
    const timer = window.setTimeout(
      () => useGanzenbordStore.getState().advanceAnimation(),
      step?.delayMs ?? 300,
    );
    return () => window.clearTimeout(timer);
  }, [animation]);

  if (!game) {
    return null;
  }

  const finished = isFinished(game);
  const animating = Boolean(animation);
  const computerTurn = current?.controller === "computer" && !finished;

  return (
    <div className="game-panel flex flex-col gap-2 p-3">
      <GanzenbordDice ref={diceRef} onDone={handleDiceDone} />
      <Button
        aria-label="Gooi met de dobbelstenen"
        className="w-full"
        disabled={finished || rolling || animating || computerTurn}
        size="lg"
        variant="success"
        onClick={handleRoll}
      >
        <Play aria-hidden="true" className="size-5" />
        {rollButtonLabel(finished, rolling, animating, computerTurn)}
      </Button>
      <DiceStatus {...diceStatusText(game, events, rolling, current, computerTurn, animation)} />
    </div>
  );
}

export function GanzenbordPlay() {
  const game = useGanzenbordStore((state) => state.game);
  const wins = useGanzenbordStore((state) => state.wins);
  const animation = useGanzenbordStore((state) => state.animation);

  if (!game) {
    return null;
  }

  const step = animation?.steps[animation.index];
  const event =
    step?.event && step.event.kind !== "roll" && step.event.kind !== "move"
      ? step.event
      : undefined;
  const displayGame = animation
    ? {
        ...game,
        players: game.players.map((player) =>
          player.id === animation.player
            ? { ...player, position: step?.position ?? player.position }
            : player,
        ),
      }
    : game;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="relative order-1 lg:order-none lg:col-start-1 lg:row-start-1">
        <GanzenbordBoard game={displayGame} />
        {animation && event ? (
          <GanzenbordEvent
            event={event}
            game={game}
            onContinue={() => useGanzenbordStore.getState().advanceAnimation()}
          />
        ) : null}
      </div>

      <aside className="order-2 flex flex-col gap-3 lg:order-none lg:col-start-2 lg:row-span-2">
        <GanzenbordHud game={displayGame} wins={wins} />
        <DicePanel />
        <GanzenbordRules />
      </aside>
    </div>
  );
}
