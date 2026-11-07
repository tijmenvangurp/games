import type { ComponentType } from "react";
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

  return (
    <div
      aria-live="polite"
      className="mx-auto mt-2 w-full max-w-md rounded-xl border-2 border-[#c9a45c] bg-[#fff8e7] p-3 text-[#3f2a18] shadow-[0_10px_30px_-10px_rgba(40,25,10,0.8)]"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f0dfb8]">
          <EventIcon kind={event.kind} />
        </span>
        <div className="min-w-0">
          <p className="font-black">{TITLES[event.kind]}</p>
          {message ? <p className="text-sm leading-snug opacity-80">{message}</p> : null}
        </div>
      </div>
      <Button className="mt-2 w-full" size="sm" variant="outline" onClick={onContinue}>
        Verder
      </Button>
    </div>
  );
}
