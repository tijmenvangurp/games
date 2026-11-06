import { useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@shared/ui";

const STORAGE_KEY = "games.ganzenbord.calibration.v1";

interface Point {
  readonly x: number;
  readonly y: number;
}

function readPoints(): Point[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (point): point is Point =>
        typeof point === "object" &&
        point !== null &&
        typeof (point as Point).x === "number" &&
        typeof (point as Point).y === "number",
    );
  } catch {
    return [];
  }
}

function savePoints(points: readonly Point[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch {
    // De tool werkt ook zonder opslag; alleen een herlaadbeurt kost dan de klikken.
  }
}

export function CalibratePage() {
  const [points, setPoints] = useState<Point[]>(readPoints);
  const [copied, setCopied] = useState(false);

  const addPoint = (event: MouseEvent<HTMLDivElement>) => {
    if (points.length >= 63) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
    const next = [...points, point];
    setPoints(next);
    savePoints(next);
    setCopied(false);
  };

  const undo = () => {
    const next = points.slice(0, -1);
    setPoints(next);
    savePoints(next);
    setCopied(false);
  };

  const reset = () => {
    setPoints([]);
    savePoints([]);
    setCopied(false);
  };

  const json = JSON.stringify(
    points.map((point, index) => ({
      n: index + 1,
      x: Number(point.x.toFixed(3)),
      y: Number(point.y.toFixed(3)),
    })),
    null,
    1,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
    } catch {
      const textarea = document.querySelector<HTMLTextAreaElement>("#calibration-json");
      textarea?.focus();
      textarea?.select();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl">Bord kalibreren</h1>
          <p className="text-sm text-muted-foreground">
            Klik de vakjes 1 t/m 63 in volgorde aan. Klik steeds in het midden van het vakje.
          </p>
        </div>
        <Link className="text-sm font-bold underline" to="/ganzenbord">
          Terug naar Ganzenbord
        </Link>
      </div>

      <div
        className="relative w-full max-w-full touch-manipulation overflow-hidden rounded-lg border-4 border-[#7a4a24] bg-[#f4e7cf]"
        onClick={addPoint}
        role="button"
        tabIndex={0}
      >
        <img
          alt=""
          className="block h-auto w-full select-none"
          draggable={false}
          src="/ganzenbord/board.webp"
        />
        {points.map((point, index) => (
          <span
            key={`${index}-${point.x}-${point.y}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-black text-white shadow"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            {index + 1}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">
          {points.length < 63 ? `Volgende: vakje ${points.length + 1}` : "Klaar — alle 63 vakjes"}
        </span>
        <Button size="sm" variant="outline" onClick={undo}>
          Ongedaan maken
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          Alles wissen
        </Button>
        <Button size="sm" onClick={copy}>
          {copied ? "Gekopieerd" : "Kopieer JSON"}
        </Button>
      </div>

      <textarea
        id="calibration-json"
        className="h-40 w-full rounded-lg border border-border bg-card p-2 font-mono text-xs"
        readOnly
        value={json}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}
