import { useEffect, useRef } from "react";
import type { Cell, PersonId, Puzzle } from "@entities/murdoku";
import type { MurdokuText } from "../lib/text";
import { suspectColor } from "../lib/palette";
import { withRoomOutline } from "../lib/reveal";
import { avatarDataUri } from "../lib/vendored/avatar";
import { drawBoard, type RevealInfo } from "../lib/vendored/boardRender";
import type { HelpMarks } from "../lib/vendored/helpMarks";
import { onArtReady } from "../lib/vendored/objectArt";

interface MurdokuCanvasOptions {
  puzzle: Puzzle;
  cell: number;
  text: MurdokuText;
  placed: ReadonlyMap<PersonId, Cell>;
  crosses: ReadonlySet<Cell>;
  highlight: ReadonlySet<Cell> | null;
  highlightColor?: { wash: string; ring: string };
  helpMarks: HelpMarks | null;
  /** Omlijnt deze kamer, bijvoorbeeld die van het slachtoffer bij de afloop. */
  outlineRoomId: string | null;
  /** De onthulling na een goede controle; `null` zolang de zaak loopt. */
  reveal: RevealInfo | null;
  /** Het geladen icoon van de buit; `null` zolang het nog niet klaar is. */
  lootIcon: HTMLImageElement | null;
}

/**
 * Tekent de zaak op één canvas en hertekent zodra de maat, de plaatsingen, de
 * kruisjes of de portretten veranderen. De portretten zijn lokale
 * SVG-data-URI's; er gaat geen netwerkrequest aan te pas.
 */
export function useMurdokuCanvas({
  puzzle,
  cell,
  text,
  placed,
  crosses,
  highlight,
  highlightColor,
  helpMarks,
  outlineRoomId,
  reveal,
  lootIcon,
}: MurdokuCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarsRef = useRef<Map<PersonId, HTMLImageElement>>(new Map());
  const drawRef = useRef<() => void>(() => {});
  const width = puzzle.board.width;
  const height = puzzle.board.height;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const boardWidth = width * cell;
    const boardHeight = height * cell;
    const marks = withRoomOutline(helpMarks, outlineRoomId);

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
        suspectIndex: new Map(puzzle.suspects.map((suspect, index) => [suspect.id, index])),
        placements: new Map(placed),
        marks: new Map(),
        crosses: new Set(crosses),
        highlight: highlight ? new Set(highlight) : null,
        highlightColor,
        helpMarks: marks,
        reveal,
        avatars: avatarsRef.current,
        victimIcon: lootIcon,
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
    placed,
    highlight,
    highlightColor,
    crosses,
    helpMarks,
    outlineRoomId,
    reveal,
    lootIcon,
    text,
  ]);

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

  return canvasRef;
}
