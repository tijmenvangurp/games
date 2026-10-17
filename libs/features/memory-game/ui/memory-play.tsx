import { useEffect } from "react";
import { Button, RotateCcw } from "@shared/ui";
import { useMemoryStore } from "../model/use-memory-store";
import { MemoryBoard } from "./memory-board";

export function MemoryPlay() {
  const scene = useMemoryStore((state) => state.scene);
  const matched = useMemoryStore((state) => state.matched);
  const moves = useMemoryStore((state) => state.moves);
  const locked = useMemoryStore((state) => state.locked);
  const found = useMemoryStore((state) => state.found);

  useEffect(() => {
    if (!locked) {
      return;
    }
    const timer = window.setTimeout(() => useMemoryStore.getState().resolveMismatch(), 1000);
    return () => window.clearTimeout(timer);
  }, [locked]);

  if (!scene) {
    return null;
  }

  const matchedPairs = matched.filter(Boolean).length / 2;
  const status = locked
    ? "Bijna… twee kaarten omgedraaid."
    : found
      ? "Alle Pokémon gevonden!"
      : "Draai twee kaarten om en zoek hetzelfde Pokémon-paar.";

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:items-start lg:gap-4">
      <aside className="contents lg:order-2 lg:col-span-1 lg:block lg:space-y-3">
        <div className="order-1 flex items-center justify-between gap-3 rounded-3xl border bg-card p-4 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pokémon Memory
            </p>
            <p className="text-base font-black leading-tight">Vind alle paren</p>
            <p className="text-xs text-muted-foreground">
              {matchedPairs} van {scene.pairs} paren
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black leading-none">{moves}</p>
            <p className="text-xs text-muted-foreground">zetten</p>
          </div>
        </div>

        <div className="order-3 space-y-3">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => useMemoryStore.getState().newGame()}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Opnieuw
          </Button>
          <p aria-live="polite" className="text-center text-xs text-muted-foreground">
            {status}
          </p>
        </div>
      </aside>

      <div className="order-2 lg:order-1 lg:col-span-2">
        <MemoryBoard />
      </div>
    </div>
  );
}
