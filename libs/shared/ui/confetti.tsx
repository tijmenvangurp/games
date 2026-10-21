import { useEffect, useRef } from "react";

const COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#0ea5e9", "#a855f7", "#ec4899"];

interface ConfettiProps {
  /** Number of particles in the first burst. */
  pieces?: number;
  /** A single pop, or a wider shower with two extra side bursts. */
  variant?: "burst" | "shower";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function hasCanvasSupport(canvas: HTMLCanvasElement): boolean {
  try {
    return canvas.getContext("2d") !== null;
  } catch {
    return false;
  }
}

/**
 * A short, dependency-light confetti burst on a dedicated canvas. The library
 * is loaded on demand so the first screen stays small, and all drawing stays
 * local: no fetches, images or CSP changes.
 */
export function Confetti({ pieces = 18, variant = "burst" }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !hasCanvasSupport(canvas)) {
      return;
    }

    let cancelled = false;
    let reset: (() => void) | null = null;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled || !canvasRef.current) {
        return;
      }

      const fire = confetti.create(canvas, { resize: true, useWorker: false });
      reset = fire.reset;

      const base = {
        colors: COLORS,
        disableForReducedMotion: true,
        gravity: 0.9,
        scalar: 0.9,
        spread: 70,
        startVelocity: 38,
        ticks: 160,
      };

      fire({ ...base, particleCount: pieces, origin: { x: 0.5, y: 0.55 } });

      if (variant === "shower") {
        window.setTimeout(() => {
          if (cancelled) {
            return;
          }
          const sideCount = Math.max(8, Math.round(pieces / 2));
          fire({
            ...base,
            angle: 60,
            particleCount: sideCount,
            origin: { x: 0, y: 0.7 },
          });
          fire({
            ...base,
            angle: 120,
            particleCount: sideCount,
            origin: { x: 1, y: 0.7 },
          });
        }, 120);
      }
    });

    return () => {
      cancelled = true;
      reset?.();
    };
  }, [pieces, variant]);

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 size-full"
      data-confetti="true"
      ref={canvasRef}
    />
  );
}
