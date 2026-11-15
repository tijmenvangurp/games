import { useMemo } from "react";
import { loadMurdokuLevel } from "@entities/murdoku";
import { MURDOKU_PREVIEW_LEVEL, MURDOKU_PREVIEW_PLACEMENTS } from "../lib/preview-level";
import { helpMarks } from "../lib/vendored/helpMarks";
import { MurdokuBoard } from "./murdoku-board";

/**
 * TIJDELIJKE previewpagina voor ticket #119: laat de bordrenderer op 390 px en
 * 1024 px zien. De echte pagina, met kaarten en bediening, komt in #120/#121 —
 * verwijder deze component en de route `/murdoku-voorbeeld` daarna.
 */
export function MurdokuPreview() {
  const puzzle = useMemo(() => loadMurdokuLevel(MURDOKU_PREVIEW_LEVEL), []);
  const marks = useMemo(() => helpMarks(puzzle.suspects[0]?.clues ?? [], puzzle.board), [puzzle]);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-4 pb-safe pt-safe">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">
          Tijdelijke bordpreview · ticket #119
        </p>
        <h1 className="font-display text-3xl text-foreground">{MURDOKU_PREVIEW_LEVEL.title}</h1>
        <p className="text-muted-foreground">
          Vier kamers, meubels, vloeren, een raam en drie portretten op één canvas.
        </p>
      </header>

      <section className="game-panel mx-auto w-full max-w-2xl p-3 sm:p-5">
        <MurdokuBoard
          helpMarks={marks}
          maxCellSize={120}
          placements={MURDOKU_PREVIEW_PLACEMENTS}
          puzzle={puzzle}
          title={MURDOKU_PREVIEW_LEVEL.title ?? "de zaak"}
        />
      </section>

      <p className="text-sm text-muted-foreground">
        Deze pagina verdwijnt zodra de echte spellijn in #120 staat. Het bord is nog niet
        bedienbaar.
      </p>
    </main>
  );
}
