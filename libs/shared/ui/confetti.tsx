import type { CSSProperties } from "react";

interface ConfettiStyle extends CSSProperties {
  "--confetti-x": string;
  "--confetti-y": string;
  "--confetti-delay": string;
  "--confetti-rotate": string;
  "--confetti-color": string;
}

const COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#0ea5e9", "#a855f7", "#ec4899"];
const PIECES = 28;

const PIECE_STYLES: ConfettiStyle[] = Array.from({ length: PIECES }, (_, index) => {
  const angle = (index / PIECES) * Math.PI * 2;
  const distance = 80 + (index % 5) * 24;
  return {
    "--confetti-x": `${(Math.cos(angle) * distance).toFixed(1)}px`,
    "--confetti-y": `${(Math.sin(angle) * distance - 32).toFixed(1)}px`,
    "--confetti-delay": `${(index % 4) * 25}ms`,
    "--confetti-rotate": `${180 + (index % 6) * 60}deg`,
    "--confetti-color": COLORS[index % COLORS.length] ?? "#f59e0b",
  };
});

interface ConfettiProps {
  pieces?: number;
}

/** A short, dependency-free confetti burst that respects reduced motion. */
export function Confetti({ pieces = 18 }: ConfettiProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      data-confetti="true"
    >
      {PIECE_STYLES.slice(0, pieces).map((style, index) => (
        <span key={index} className="confetti-piece" style={style} />
      ))}
    </div>
  );
}
