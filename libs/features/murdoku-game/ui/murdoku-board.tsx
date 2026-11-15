import { useEffect, useMemo, useRef, useState } from "react";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import { cn } from "@shared/lib";
import { suspectColor } from "../lib/palette";
import { createMurdokuText } from "../lib/text";
import { avatarDataUri } from "../lib/vendored/avatar";
import { drawBoard } from "../lib/vendored/boardRender";
import type { HelpMarks } from "../lib/vendored/helpMarks";
import { onArtReady } from "../lib/vendored/objectArt";

interface MurdokuBoardProps {
  puzzle: Puzzle;
  /** Werktitel van de zaak; gebruikt voor het toegankelijke label. */
  title: string;
  /** Geplaatste personen. Zonder plaatsingen toont het bord alleen de plattegrond. */
  placements?: ReadonlyMap<PersonId, Cell>;
  /** Kandidaatvakjes van de gekozen persoon (primaire hintwash). */
  highlight?: ReadonlySet<Cell> | null;
  highlightColor?: { wash: string; ring: string };
  /** Weggekruiste vakjes. */
  crosses?: ReadonlySet<Cell>;
  /** Rustige referentiemarkeringen van de aanwijzingen (kameromtrek, objectring). */
  helpMarks?: HelpMarks | null;
  /** Maximale grootte van één vakje in CSS-px (tablet). */
  maxCellSize?: number;
  className?: string;
}

/** Fallbackbreedte als de wrapper nog niet is gemeten (SSR, verborgen tab, test). */
const FALLBACK_WIDTH = 320;
const MIN_CELL = 24;
const NO_CELLS: ReadonlySet<Cell> = new Set();

/**
 * Eén canvas met de plattegrond van een zaak: kamers, vloeren, meubels, ramen,
 * kamernamen en de geplaatste portretten.
 *
 * Het bord schaalt met zijn wrapper (ResizeObserver) en tekent op
 * device-pixel-ratio, zodat lijnen op een telefoon en tablet scherp blijven. Er
 * zit nog geen interactie in; die komt in #121. Het canvas is één afbeelding voor
 * hulptechnologie; de toegankelijke bediening komt als overlay bovenop het bord.
 */
export function MurdokuBoard({
  puzzle,
  title,
  placements,
  highlight = null,
  highlightColor,
  crosses = NO_CELLS,
  helpMarks = null,
  maxCellSize = 128,
  className,
}: MurdokuBoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarsRef = useRef<Map<PersonId, HTMLImageElement>>(new Map());
  const [cell, setCell] = useState(48);

  const width = puzzle.board.width;
  const height = puzzle.board.height;
  const text = useMemo(() => createMurdokuText(puzzle), [puzzle]);
  const suspectIndex = useMemo(
    () => new Map(puzzle.suspects.map((suspect, index) => [suspect.id, index])),
    [puzzle],
  );

  // Bewaar de laatste tekenfunctie zodat een async beeld-load het bord opnieuw
  // kan tekenen zonder een verouderde closure te gebruiken.
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const available = wrap.clientWidth || FALLBACK_WIDTH;
      const next = Math.max(MIN_CELL, Math.min(maxCellSize, Math.floor(available / width)));
      setCell(next);
    };

    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [width, maxCellSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const boardWidth = width * cell;
    const boardHeight = height * cell;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(boardWidth * dpr));
      canvas.height = Math.max(1, Math.round(boardHeight * dpr));
      canvas.style.width = `${boardWidth}px`;
      canvas.style.height = `${boardHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, boardWidth, boardHeight);
      drawBoard(ctx, {
        puzzle,
        cell,
        origin: { x: 0, y: 0 },
        roomName: (nameKey) => text.roomName(nameKey),
        suspectIndex,
        placements: new Map(placements ?? []),
        marks: new Map(),
        crosses: new Set(crosses),
        highlight: highlight ? new Set(highlight) : null,
        highlightColor,
        helpMarks,
        reveal: null,
        avatars: avatarsRef.current,
      });
    };

    drawRef.current = draw;
    draw();

    return onArtReady(draw);
  }, [
    puzzle,
    cell,
    width,
    height,
    placements,
    highlight,
    highlightColor,
    crosses,
    helpMarks,
    text,
    suspectIndex,
  ]);

  // Portretten zijn lokale SVG-data-URI's; zodra ze geladen zijn tekent het bord
  // opnieuw. Er gaat geen netwerkrequest aan te pas.
  useEffect(() => {
    const map = new Map<PersonId, HTMLImageElement>();
    puzzle.suspects.forEach((suspect, index) => {
      const image = new Image();
      image.onload = () => drawRef.current();
      image.src = avatarDataUri(suspect.attributes, suspectColor(index), suspect.id);
      map.set(suspect.id, image);
    });
    avatarsRef.current = map;
    drawRef.current();
  }, [puzzle]);

  const label = `Plattegrond van ${title}, ${width} bij ${height}`;

  return (
    <div ref={wrapRef} className={cn("flex w-full justify-center", className)}>
      <canvas ref={canvasRef} aria-label={label} className="block rounded-sm" role="img" />
    </div>
  );
}
