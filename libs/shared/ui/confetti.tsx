import { useEffect } from "react";
import type confetti from "canvas-confetti";

const COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#0ea5e9", "#a855f7", "#ec4899"];
const STAR_COLORS = ["#fbbf24", "#f59e0b", "#fde68a", "#c084fc", "#a855f7", "#ffffff"];
const STAR_SHAPES: ("star" | "circle")[] = ["star", "circle"];

type ConfettiVariant = "burst" | "shower" | "stars";
type Fire = (options: confetti.Options) => unknown;

interface ConfettiProps {
  /** Number of particles in the first burst. */
  pieces?: number;
  /** A single pop, a wider shower with side bursts, or magical stars. */
  variant?: ConfettiVariant;
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

interface BurstStyle {
  colors: string[];
  gravity: number;
  scalar: number;
  spread: number;
  startVelocity: number;
  ticks: number;
}

const PARTY_STYLE: BurstStyle = {
  colors: COLORS,
  gravity: 0.9,
  scalar: 0.9,
  spread: 70,
  startVelocity: 38,
  ticks: 160,
};

const BURST_STYLES: Record<ConfettiVariant, BurstStyle> = {
  burst: PARTY_STYLE,
  shower: PARTY_STYLE,
  stars: {
    colors: STAR_COLORS,
    gravity: 0.8,
    scalar: 1.05,
    spread: 100,
    startVelocity: 34,
    ticks: 180,
  },
};

function burstOptions(variant: ConfettiVariant) {
  // The library creates its own canvas on document.body. zIndex 60 keeps the
  // confetti above the z-50 dialog overlay and its dim layer.
  return { disableForReducedMotion: true, zIndex: 60, ...BURST_STYLES[variant] };
}

function fireStars(fire: Fire, pieces: number, cancelled: () => boolean): void {
  const base = burstOptions("stars");
  fire({
    ...base,
    particleCount: pieces,
    origin: { x: 0.5, y: 0.55 },
    shapes: STAR_SHAPES,
  });

  window.setTimeout(() => {
    if (cancelled()) {
      return;
    }
    fire({
      ...base,
      particleCount: Math.max(6, Math.round(pieces / 3)),
      origin: { x: 0.5, y: 0.45 },
      shapes: STAR_SHAPES,
    });
  }, 140);
}

function fireShower(fire: Fire, pieces: number, cancelled: () => boolean): void {
  const base = burstOptions("shower");
  fire({ ...base, particleCount: pieces, origin: { x: 0.5, y: 0.55 } });

  window.setTimeout(() => {
    if (cancelled()) {
      return;
    }
    const sideCount = Math.max(8, Math.round(pieces / 2));
    fire({ ...base, angle: 60, particleCount: sideCount, origin: { x: 0, y: 0.7 } });
    fire({ ...base, angle: 120, particleCount: sideCount, origin: { x: 1, y: 0.7 } });
  }, 120);
}

function fireBursts(
  fire: Fire,
  variant: ConfettiVariant,
  pieces: number,
  cancelled: () => boolean,
): void {
  if (variant === "stars") {
    fireStars(fire, pieces, cancelled);
    return;
  }
  if (variant === "shower") {
    fireShower(fire, pieces, cancelled);
    return;
  }
  fire({
    ...burstOptions("burst"),
    particleCount: pieces,
    origin: { x: 0.5, y: 0.55 },
  });
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
