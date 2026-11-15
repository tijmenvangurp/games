import { useEffect, useRef, useState } from "react";

/** Fallbackbreedte als de wrapper nog niet is gemeten (SSR, verborgen tab, test). */
const FALLBACK_WIDTH = 320;
/** Ruimte links voor de rijlabels; de rest van de breedte is bord. */
export const LABEL_SIZE = 22;
/** Onder 44 px wordt een vakje op een telefoon te lastig te raken. */
const MIN_CELL = 44;

/** Meet de beschikbare bordbreedte en houdt de vakjes op minimaal 44 px. */
export function useBoardCellSize(width: number, maxCellSize: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(48);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const available = (wrap.clientWidth || FALLBACK_WIDTH) - LABEL_SIZE;
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

  return { wrapRef, cell };
}
