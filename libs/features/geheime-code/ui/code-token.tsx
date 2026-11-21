import type { CSSProperties, ReactNode } from "react";
import { SYMBOL_BY_ID, type ToneId } from "@entities/geheime-code";
import { cn } from "@shared/lib";
import { SymbolIcon } from "./symbol-icon";

const TONE_VAR: Readonly<Record<ToneId, string>> = {
  indigo: "var(--primary)",
  green: "var(--pawn-green)",
  orange: "var(--pawn-orange)",
  pink: "var(--pawn-pink)",
  violet: "var(--pawn-violet)",
  blue: "var(--pawn-blue)",
};

function toneStyle(symbolId: string): CSSProperties {
  const symbol = SYMBOL_BY_ID[symbolId];
  return { "--code-tint": symbol ? TONE_VAR[symbol.tone] : "var(--primary)" } as CSSProperties;
}

interface CodeTokenProps {
  symbolId: string;
  letter: ReactNode;
  hint?: boolean;
  label: string;
  className?: string;
}

export function CodeToken({ symbolId, letter, hint = false, label, className }: CodeTokenProps) {
  return (
    <div
      aria-label={label}
      className={cn(
        "code-token flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5",
        hint && "ring-2 ring-warning",
        className,
      )}
      role="img"
      style={toneStyle(symbolId)}
    >
      <SymbolIcon id={symbolId} className="size-6 sm:size-7" />
      <span className="font-display text-lg leading-none text-foreground">{letter}</span>
    </div>
  );
}

export function SymbolTile({ symbolId, className }: { symbolId: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "code-token flex size-12 items-center justify-center rounded-xl sm:size-14",
        className,
      )}
      style={toneStyle(symbolId)}
    >
      <SymbolIcon id={symbolId} className="size-6 sm:size-7" />
    </span>
  );
}
