import { useEffect } from "react";
import type confetti from "canvas-confetti";

const COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#0ea5e9", "#a855f7", "#ec4899"];

type Fire = (options: confetti.Options) => unknown;

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

function canUseCanvas(): boolean {
  try {
    return (
      typeof document !== "undefined" && document.createElement("canvas").getContext("2d") !== null
    );
  } catch {
    return false;
  }
}

// The library creates its own canvas on document.body. zIndex 60 keeps the
// confetti above the z-50 dialog overlay and its dim layer.
const BASE = {
  colors: COLORS,
  disableForReducedMotion: true,
  gravity: 0.9,
  scalar: 0.9,
  spread: 70,
  startVelocity: 38,
  ticks: 160,
  zIndex: 60,
};

function fireBursts(
  fire: Fire,
  variant: "burst" | "shower",
  pieces: number,
  cancelled: () => boolean,
): void {
  fire({ ...BASE, particleCount: pieces, origin: { x: 0.5, y: 0.55 } });

  if (variant !== "shower") {
    return;
  }

  window.setTimeout(() => {
    if (cancelled()) {
      return;
    }
    const sideCount = Math.max(8, Math.round(pieces / 2));
    fire({ ...BASE, angle: 60, particleCount: sideCount, origin: { x: 0, y: 0.7 } });
    fire({ ...BASE, angle: 120, particleCount: sideCount, origin: { x: 1, y: 0.7 } });
  }, 120);
}

/**
 * A short confetti burst. The library is loaded on demand and manages its own
 * canvas on document.body, so it always paints above dialog overlays. All
 * drawing stays local: no fetches, images or CSP changes.
 */
export function Confetti({ pieces = 18, variant = "burst" }: ConfettiProps) {
  useEffect(() => {
    if (prefersReducedMotion() || !canUseCanvas()) {
      return;
    }

    let cancelled = false;
    let reset: (() => void) | null = null;

    void import("canvas-confetti").then(({ default: confettiModule }) => {
      if (cancelled) {
        return;
      }
      reset = confettiModule.reset;
      fireBursts(confettiModule, variant, pieces, () => cancelled);
    });

    return () => {
      cancelled = true;
      reset?.();
    };
  }, [pieces, variant]);

  return <span aria-hidden="true" data-confetti="true" />;
}
