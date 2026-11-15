import type { ComponentType } from "react";
import { m, useReducedMotion } from "motion/react";
import {
  Bed,
  Bridge,
  Drop,
  Handshake,
  Hourglass,
  Lock,
  LockKeyOpen,
  Path,
  Skull,
  Trophy,
} from "@phosphor-icons/react";
import type { GanzenbordGame, TurnEvent, TurnEventKind } from "@entities/ganzenbord";
import { Button } from "@shared/ui";
import { eventArt } from "../model/event-art";
import { eventMessage } from "../model/presentation";
import { GooseMark } from "./goose-mark";

const TITLES: Readonly<Record<TurnEventKind, string>> = {
  roll: "Worp",
  move: "Verplaatsen",
  "first-throw": "Eerste worp 9",
  goose: "Gans!",
  bounce: "Te ver!",
  bridge: "De brug",
  inn: "De herberg",
  well: "In de put",
  prison: "De gevangenis",
  maze: "Het doolhof",
  death: "De dood",
  free: "Weer vrij!",
  skip: "Beurt overslaan",
  win: "Finish!",
  draw: "Gelijkspel",
};

interface IconProps {
  readonly className?: string;
}

const ICONS: Readonly<Record<TurnEventKind, ComponentType<IconProps>>> = {
  roll: Path,
  move: Path,
  "first-throw": Path,
  goose: GooseMark,
  bounce: Path,
  bridge: Bridge,
  inn: Bed,
  well: Drop,
  prison: Lock,
  maze: Path,
  death: Skull,
  free: LockKeyOpen,
  skip: Hourglass,
  win: Trophy,
  draw: Handshake,
};

function EventIcon({ kind }: { kind: TurnEventKind }) {
  const Icon = ICONS[kind];
  return <Icon className="size-6" />;
}

interface GanzenbordEventProps {
  game: GanzenbordGame;
  event: TurnEvent;
  onContinue: () => void;
}

export function GanzenbordEvent({ game, event, onContinue }: GanzenbordEventProps) {
  const message = eventMessage(game, event);
  const art = eventArt(event);
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-labelledby="ganzenbord-event-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-xs"
      role="dialog"
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === "Escape") {
          keyboardEvent.preventDefault();
          onContinue();
        }
      }}
    >
      <m.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#c9a45c] bg-[#fff8e7] p-4 text-[#3f2a18] shadow-2xl"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }}
        transition={{ damping: 26, stiffness: 360, type: "spring" }}
      >
        <div className="flex items-start gap-3">
          {art ? (
            <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-[#c9a45c] bg-[#f0dfb8] sm:size-24">
              <img alt="" className="size-full object-contain" src={art} />
            </span>
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f0dfb8]">
              <EventIcon kind={event.kind} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-black" id="ganzenbord-event-title">
              {TITLES[event.kind]}
            </h2>
            {message ? <p className="text-sm leading-snug opacity-80">{message}</p> : null}
          </div>
        </div>
        <Button autoFocus className="mt-3 w-full" size="lg" variant="outline" onClick={onContinue}>
          Verder
        </Button>
      </m.div>
    </div>
  );
}
