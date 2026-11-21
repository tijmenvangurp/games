import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { MEMORY_LEVELS } from "@entities/memory";
import { cn, playHaptic, playSound } from "@shared/lib";
import { Button, Lightbulb, Panel, RotateCcw, Sparkles } from "@shared/ui";
import { useMemoryStore } from "../model/use-memory-store";
import { MemoryBoard } from "./memory-board";

interface HeaderCardProps {
  matchedPairs: number;
  pairs: number;
  mode: "auto" | "manual";
}

function HeaderCard({ matchedPairs, pairs, mode }: HeaderCardProps) {
  return (
    <Panel className="order-1 flex items-center justify-between gap-3" padding="md">
      <div>
        <p className="font-display text-lg leading-tight">Vind alle paren</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {matchedPairs} van {pairs} paren · {mode === "auto" ? "groeit mee" : "zelf gekozen"}
        </p>
      </div>
      <div className="text-right tabular-nums">
        <p className="text-3xl font-black leading-none">{pairs}</p>
        <p className="text-xs text-muted-foreground">paren</p>
      </div>
    </Panel>
  );
}

interface ActionButtonsProps {
  atTopLevel: boolean;
  disabled: boolean;
  suggestHint: boolean;
  onChallenge: () => void;
  onHint: () => void;
  onAgain: () => void;
}

function ActionButtons({
  atTopLevel,
  disabled,
  suggestHint,
  onChallenge,
  onHint,
  onAgain,
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        aria-label="Hint"
        className={cn(
          "min-h-12 gap-1.5 px-2 text-xs sm:px-3 sm:text-sm",
          suggestHint && "border-warning ring-2 ring-warning/35",
        )}
        disabled={disabled}
        variant="outline"
        onClick={onHint}
      >
        <Lightbulb aria-hidden="true" className="size-4 shrink-0 text-warning" />
        Hint
      </Button>
      <Button
        className="min-h-12 gap-1.5 px-2 text-xs sm:px-3 sm:text-sm"
        disabled={atTopLevel}
        variant="outline"
        onClick={onChallenge}
      >
        <Sparkles aria-hidden="true" className="size-4 shrink-0 text-warning" />
        Uitdaging
      </Button>
      <Button
        className="min-h-12 gap-1.5 px-2 text-xs sm:px-3 sm:text-sm"
        variant="outline"
        onClick={onAgain}
      >
        <RotateCcw aria-hidden="true" className="size-4 shrink-0" />
        Opnieuw
      </Button>
    </div>
  );
}

function statusFor(locked: boolean, found: boolean, hint: boolean): string {
  if (locked) {
    return "Nog niet. De kaarten draaien zo terug.";
  }
  if (found) {
    return "Alle Pokémon gevonden!";
  }
  if (hint) {
    return "Kijk naar de kaarten met de gele rand.";
  }
  return "Draai twee kaarten om en zoek hetzelfde Pokémon-paar.";
}

function StatusLine({ status, moves }: { status: string; moves: number }) {
  return (
    <>
      <p aria-live="polite" className="text-center text-xs text-muted-foreground">
        {status}
      </p>
      <p className="text-center text-xs tabular-nums text-muted-foreground">
        {moves > 0
          ? `Je deed ${moves} ${moves === 1 ? "poging" : "pogingen"}.`
          : "Zoek rustig verder."}
      </p>
    </>
  );
}

export function MemoryPlay() {
  const { scene, matched, moves, locked, found, hint, outcomes, settings } = useMemoryStore(
    useShallow((state) => ({
      scene: state.scene,
      matched: state.matched,
      moves: state.moves,
      locked: state.locked,
      found: state.found,
      hint: state.hint,
      outcomes: state.outcomes,
      settings: state.settings,
    })),
  );
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!locked) {
      return;
    }
    const timer = window.setTimeout(() => useMemoryStore.getState().resolveMismatch(), 1000);
    return () => window.clearTimeout(timer);
  }, [locked]);

  useEffect(() => {
    setIdle(false);
    if (!scene || locked || found) {
      return;
    }
    const timer = window.setTimeout(() => setIdle(true), 6000);
    return () => window.clearTimeout(timer);
  }, [scene, locked, found, moves, matched]);

  if (!scene) {
    return null;
  }

  const matchedPairs = matched.filter(Boolean).length / 2;
  const misses = outcomes.filter((ok) => !ok).length;
  const suggestHint = !found && !locked && !hint && (idle || misses >= 2);
  const status = statusFor(locked, found, Boolean(hint));

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:items-start lg:gap-4">
      <aside className="contents lg:order-2 lg:col-span-1 lg:block lg:space-y-3">
        <HeaderCard matchedPairs={matchedPairs} mode={settings.mode} pairs={scene.pairs} />
        <div className="order-3 space-y-2">
          <ActionButtons
            atTopLevel={scene.levelIndex >= MEMORY_LEVELS.length - 1}
            disabled={found || locked}
            suggestHint={suggestHint}
            onAgain={() => useMemoryStore.getState().newGame()}
            onChallenge={() => {
              playSound("tap");
              playHaptic("tap");
              useMemoryStore.getState().challenge();
            }}
            onHint={() => {
              playSound("hint");
              playHaptic("hint");
              useMemoryStore.getState().requestHint();
            }}
          />
          <StatusLine moves={moves} status={status} />
        </div>
      </aside>

      <div className="order-2 lg:order-1 lg:col-span-2">
        <MemoryBoard />
      </div>
    </div>
  );
}
