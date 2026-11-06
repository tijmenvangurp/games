import { useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  CELL_POINTS,
  clearCellPoints,
  loadCellPoints,
  saveCellPoints,
  type BoardPoint,
} from "@features/ganzenbord";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Button,
  Copy,
  RotateCcw,
  Save,
} from "@shared/ui";

const SQUARES = Array.from({ length: 63 }, (_, index) => index + 1);
const NUDGE = 0.2;

type Points = Record<number, BoardPoint>;

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function withPoint(points: Points, square: number, x: number, y: number): Points {
  return {
    ...points,
    [square]: {
      x: round(Math.min(100, Math.max(0, x))),
      y: round(Math.min(100, Math.max(0, y))),
    },
  };
}

function editorJson(points: Points): string {
  return JSON.stringify(
    SQUARES.map((square) => {
      const point = points[square] ?? CELL_POINTS[square];
      return { n: square, x: round(point.x), y: round(point.y) };
    }),
    null,
    1,
  );
}

export function BoardEditorPage() {
  const [points, setPoints] = useState<Points>(() => ({ ...loadCellPoints() }));
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const choose = (square: number | null) => {
    setSelected(square);
    setCopied(false);
  };

  const place = (event: MouseEvent<HTMLDivElement>) => {
    if (selected === null) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPoints((current) => withPoint(current, selected, x, y));
    setSaved(false);
  };

  const nudge = (dx: number, dy: number) => {
    if (selected === null) {
      return;
    }
    setPoints((current) => {
      const point = current[selected] ?? CELL_POINTS[selected];
      return withPoint(current, selected, point.x + dx, point.y + dy);
    });
    setSaved(false);
  };

  const reset = () => {
    clearCellPoints();
    setPoints({ ...CELL_POINTS });
    setSaved(false);
    setCopied(false);
  };

  const save = () => {
    saveCellPoints(points);
    setSaved(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(editorJson(points));
      setCopied(true);
    } catch {
      const textarea = document.querySelector<HTMLTextAreaElement>("#board-editor-json");
      textarea?.focus();
      textarea?.select();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl">Bord bijstellen</h1>
          <p className="text-sm text-muted-foreground">
            Tik een nummer aan en daarna op de juiste plek in dat vak. Met de pijltjes stel je fijn
            bij. Opslaan bewaart de stand op dit toestel.
          </p>
        </div>
        <Link className="text-sm font-bold underline" to="/ganzenbord">
          Terug naar Ganzenbord
        </Link>
      </div>

      <div
        className="relative w-full max-w-full touch-manipulation overflow-hidden rounded-lg"
        onClick={place}
      >
        <img
          alt=""
          className="block h-auto w-full select-none"
          draggable={false}
          src="/ganzenbord/board.webp"
        />
        {SQUARES.map((square) => {
          const point = points[square] ?? CELL_POINTS[square];
          const active = square === selected;
          return (
            <button
              key={square}
              aria-label={`Vak ${square}`}
              aria-pressed={active}
              className={
                active
                  ? "absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-danger text-xs font-black text-white shadow"
                  : "absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#7a4a24] bg-white/80 text-xs font-black text-[#3f2a18] shadow-sm"
              }
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                choose(active ? null : square);
              }}
            >
              {square}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">
          {selected === null ? "Kies eerst een vak" : `Vak ${selected} geselecteerd`}
        </span>
        <Button
          aria-label="Vak naar links"
          disabled={selected === null}
          size="sm"
          variant="outline"
          onClick={() => nudge(-NUDGE, 0)}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </Button>
        <Button
          aria-label="Vak naar rechts"
          disabled={selected === null}
          size="sm"
          variant="outline"
          onClick={() => nudge(NUDGE, 0)}
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
        <Button
          aria-label="Vak omhoog"
          disabled={selected === null}
          size="sm"
          variant="outline"
          onClick={() => nudge(0, -NUDGE)}
        >
          <ArrowUp aria-hidden="true" className="size-4" />
        </Button>
        <Button
          aria-label="Vak omlaag"
          disabled={selected === null}
          size="sm"
          variant="outline"
          onClick={() => nudge(0, NUDGE)}
        >
          <ArrowDown aria-hidden="true" className="size-4" />
        </Button>
        <Button
          disabled={selected === null}
          size="sm"
          variant="outline"
          onClick={() => choose(selected === null ? 1 : (selected % 63) + 1)}
        >
          Volgend vak
        </Button>
        <span className="flex-1" />
        <Button size="sm" onClick={save}>
          <Save aria-hidden="true" className="mr-1 size-4" />
          {saved ? "Opgeslagen" : "Opslaan"}
        </Button>
        <Button size="sm" variant="outline" onClick={copy}>
          <Copy aria-hidden="true" className="mr-1 size-4" />
          {copied ? "Gekopieerd" : "Kopieer JSON"}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw aria-hidden="true" className="mr-1 size-4" />
          Herstel
        </Button>
      </div>

      <textarea
        id="board-editor-json"
        aria-label="JSON van de bordposities"
        className="h-40 w-full rounded-lg border border-border bg-card p-2 font-mono text-xs"
        readOnly
        value={editorJson(points)}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}
