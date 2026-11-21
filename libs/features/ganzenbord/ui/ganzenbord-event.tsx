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
import { useTexts } from "@shared/i18n";
import { Button, Dialog } from "@shared/ui";
import { eventArt } from "../model/event-art";
import { eventMessage } from "../model/presentation";
import { ganzenbordUiTexts } from "../model/texts";
import { GooseMark } from "./goose-mark";

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
  const t = useTexts(ganzenbordUiTexts);
  const message = eventMessage(game, event);
  const art = eventArt(event);

  return (
    <Dialog
      className="p-4 sm:p-5"
      labelledBy="ganzenbord-event-title"
      size="md"
      tone="parchment"
      onClose={onContinue}
    >
      <div className="flex items-start gap-3">
        {art ? (
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-parchment-border bg-parchment-surface sm:size-24">
            <img alt="" className="size-full object-contain" src={art} />
          </span>
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-parchment-surface">
            <EventIcon kind={event.kind} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-xl tracking-tight" id="ganzenbord-event-title">
            {t.eventTitles[event.kind]}
          </h2>
          {message ? <p className="mt-1 text-sm leading-snug opacity-85">{message}</p> : null}
        </div>
      </div>
      <Button autoFocus className="mt-4 w-full" size="lg" variant="outline" onClick={onContinue}>
        {t.continue}
      </Button>
    </Dialog>
  );
}
