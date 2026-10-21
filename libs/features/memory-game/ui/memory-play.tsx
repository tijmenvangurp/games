import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { MEMORY_LEVELS } from "@entities/memory";
import { playHaptic, playSound } from "@shared/lib";
import { Button, Lightbulb, RotateCcw, Sparkles } from "@shared/ui";
import { useMemoryStore } from "../model/use-memory-store";
import { MemoryBoard } from "./memory-board";

interface HeaderCardProps {
  matchedPairs: number;
  pairs: number;
  mode: "auto" | "manual";
}

function HeaderCard({ matchedPairs, pairs, mode }: HeaderCardProps) {
  return (
    <div className="game-panel order-1 flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Pokémon Memory
        </p>
        <p className="text-base font-black leading-tight">Vind alle paren</p>
        <p className="text-xs text-muted-foreground">
          {matchedPairs} van {pairs} paren · {mode === "auto" ? "groeit mee" : "zelf gekozen"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-3xl font-black leading-none">{pairs}</p>
        <p className="text-xs text-muted-foreground">paren</p>
      </div>
    </div>
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
        className={suggestHint ? "min-h-12 ring-2 ring-amber-300" : "min-h-12"}
        disabled={disabled}
        variant="outline"
        onClick={onHint}
      >
        <Lightbulb aria-hidden="true" className="size-4 text-amber-500" />
        Hint
      </Button>
      <Button className="min-h-12" disabled={atTopLevel} variant="outline" onClick={onChallenge}>
        <Sparkles aria-hidden="true" className="size-4 text-amber-500" />
        Uitdaging
      </Button>
      <Button className="min-h-12" variant="outline" onClick={onAgain}>
        <RotateCcw aria-hidden="true" className="size-4" />
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
      <p className="text-center text-xs text-muted-foreground">
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
