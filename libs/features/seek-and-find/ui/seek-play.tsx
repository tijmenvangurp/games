import { useEffect } from "react";
import { findTarget } from "@entities/hidden-object";
import { playHaptic, playSound } from "@shared/lib";
import { Button, RotateCcw, Search } from "@shared/ui";
import { useSeekStore } from "../model/use-seek-store";
import { CreatureGlyph } from "./creature-glyph";
import { SeekScene } from "./seek-scene";

export function SeekPlay() {
  const scene = useSeekStore((state) => state.scene);
  const found = useSeekStore((state) => state.found);
  const wrongId = useSeekStore((state) => state.wrongId);
  const hintVisible = useSeekStore((state) => state.hintVisible);

  useEffect(() => {
    if (wrongId === null) {
      return;
    }
    const timer = window.setTimeout(() => useSeekStore.getState().clearWrong(), 900);
    return () => window.clearTimeout(timer);
  }, [wrongId]);

  useEffect(() => {
    if (!hintVisible) {
      return;
    }
    const timer = window.setTimeout(() => useSeekStore.getState().hideHint(), 2400);
    return () => window.clearTimeout(timer);
  }, [hintVisible]);

  if (!scene) {
    return null;
  }

  const target = findTarget(scene);
  const status = found
    ? "Gevonden!"
    : wrongId !== null
      ? "Nog niet — kijk goed naar de ster."
      : null;

  const handleTap = (id: number) => {
    const wasFound = useSeekStore.getState().found;
    useSeekStore.getState().tap(id);
    const next = useSeekStore.getState();
    if (wasFound) {
      return;
    }
    if (next.found) {
      playHaptic("win");
    } else if (next.wrongId === id) {
      playSound("wrong");
      playHaptic("wrong");
    }
  };

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:items-start lg:gap-4">
      <aside className="contents lg:order-2 lg:col-span-1 lg:block lg:space-y-3">
        <div className="order-1 game-panel flex items-center gap-3 p-3">
          <svg
            aria-label="Doel: de Wobbel met een ster op de hoed"
            className="size-16 shrink-0"
            role="img"
            viewBox="-55 -55 110 110"
          >
            <circle cx="0" cy="0" fill="#fef3c7" r="52" />
            <CreatureGlyph creature={target} />
          </svg>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Zoek deze
            </p>
            <p className="text-base font-black leading-tight">Wobbel met de ster</p>
          </div>
        </div>

        <div className="order-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={found}
              variant="outline"
              onClick={() => {
                playSound("hint");
                playHaptic("hint");
                useSeekStore.getState().showHint();
              }}
            >
              <Search aria-hidden="true" className="size-4 text-warning" />
              Hint
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                playSound("tap");
                playHaptic("tap");
                useSeekStore.getState().newScene();
              }}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Nieuw zoekveld
            </Button>
          </div>

          {status ? (
            <p aria-live="polite" className="text-center text-xs text-muted-foreground">
              {status}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="order-2 lg:order-1 lg:col-span-2">
        <SeekScene
          found={found}
          hintVisible={hintVisible}
          scene={scene}
          wrongId={wrongId}
          onTap={handleTap}
        />
      </div>
    </div>
  );
}
