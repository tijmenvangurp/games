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
  hidden?: boolean;
  active?: boolean;
  hint?: boolean;
  wrong?: boolean;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function CodeToken({
  symbolId,
  letter,
  hidden = false,
  active = false,
  hint = false,
  wrong = false,
  label,
  onClick,
  className,
}: CodeTokenProps) {
  const classes = cn(
    "code-token flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition",
    hidden && "is-hidden",
    wrong && "is-wrong",
    active && "ring-2 ring-primary",
    hint && "ring-2 ring-warning",
    onClick && "cursor-pointer active:scale-95",
    className,
  );
  const content = (
    <>
      <SymbolIcon id={symbolId} className="size-6 sm:size-7" />
      <span
        className={cn(
          "font-display text-lg leading-none",
          hidden ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {letter}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        aria-label={label}
        className={classes}
        style={toneStyle(symbolId)}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div aria-label={label} className={classes} role="img" style={toneStyle(symbolId)}>
      {content}
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
