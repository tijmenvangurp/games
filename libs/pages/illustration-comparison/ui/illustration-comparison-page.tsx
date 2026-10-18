import { useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Abacus,
  BowAndArrow,
  Bullseye,
  ChessPawn,
  HighVoltage,
  InputLatinLetters,
  InputLatinUppercase,
  MagnifyingGlassTiltedRight,
  PuzzlePiece as FluentPuzzlePiece,
  RedQuestionMark,
  SpeechBalloon,
} from "@fluentui-emoji/react/flat";
import {
  Calculator,
  Crosshair,
  Crown,
  GridFour,
  Lightning,
  MagnifyingGlass,
  PuzzlePiece as PhosphorPuzzlePiece,
  Question,
  Target,
  TextAa,
  Translate,
} from "@phosphor-icons/react";
import { gameCatalog } from "@entities/game";
import { cn } from "@shared/lib";

interface PhosphorIconProps {
  size?: number;
  weight?: "duotone" | "fill";
  className?: string;
}

type PhosphorIcon = ComponentType<PhosphorIconProps>;

interface Artwork {
  fluent: ReactNode;
  phosphor: PhosphorIcon;
}

const ART: Record<string, Artwork> = {
  sudoku: {
    fluent: <FluentPuzzlePiece height={40} width={40} />,
    phosphor: PhosphorPuzzlePiece,
  },
  "math-trainer": {
    fluent: <Abacus height={40} width={40} />,
    phosphor: Calculator,
  },
  arrows: {
    fluent: <BowAndArrow height={40} width={40} />,
    phosphor: Crosshair,
  },
  seek: {
    fluent: <MagnifyingGlassTiltedRight height={40} width={40} />,
    phosphor: MagnifyingGlass,
  },
  "word-search": {
    fluent: <InputLatinLetters height={40} width={40} />,
    phosphor: TextAa,
  },
  memory: {
    fluent: <HighVoltage height={40} width={40} />,
    phosphor: Lightning,
  },
  "pokemon-quiz": {
    fluent: <RedQuestionMark height={40} width={40} />,
    phosphor: Question,
  },
  crossword: {
    fluent: <InputLatinUppercase height={40} width={40} />,
    phosphor: GridFour,
  },
  "chess-tutorial": {
    fluent: <ChessPawn height={40} width={40} />,
    phosphor: Crown,
  },
  "chess-puzzles": {
    fluent: <Bullseye height={40} width={40} />,
    phosphor: Target,
  },
  "french-listening": {
    fluent: <SpeechBalloon height={40} width={40} />,
    phosphor: Translate,
  },
};

const SETS = [
  { id: "fluent", name: "Fluent Emoji Flat", note: "Microsoft · MIT · kleur" },
  { id: "duotone", name: "Phosphor Duotone", note: "MIT · twee tinten" },
  { id: "fill", name: "Phosphor Fill", note: "MIT · gevuld" },
] as const;

const FALLBACK_ARTWORK: Artwork = {
  fluent: <FluentPuzzlePiece height={40} width={40} />,
  phosphor: PhosphorPuzzlePiece,
};

export function IllustrationComparisonPage() {
  const [dark, setDark] = useState(false);

  return (
    <main
      className={cn(
        "min-h-svh px-4 pb-12 pt-safe sm:px-8",
        dark ? "bg-[#0b1026] text-white" : "bg-[#f5f1e7] text-[#1f2937]",
      )}
    >
      <div className="mx-auto max-w-6xl">
        <header
          className={cn(
            "flex flex-wrap items-end justify-between gap-4 border-b pb-5",
            dark ? "border-white/15" : "border-black/10",
          )}
        >
          <div>
            <Link
              className={cn(
                "text-sm font-semibold underline-offset-4 hover:underline",
                dark ? "text-cyan-300" : "text-[#a4513a]",
              )}
              to="/"
            >
              ← Terug naar de app
            </Link>
            <p
              className={cn(
                "mt-4 text-xs font-bold uppercase tracking-[0.25em]",
                dark ? "text-cyan-300" : "text-[#a4513a]",
              )}
            >
              Illustratievergelijking
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">
              Welke set past bij de spellen?
            </h1>
            <p
              className={cn(
                "mt-2 max-w-2xl text-sm leading-relaxed sm:text-base",
                dark ? "text-slate-300" : "text-gray-600",
              )}
            >
              Dezelfde tien spellen, drie illustratiestijlen. Op de echte spelkaarten staan ze op 56
              px; hier zie je ze op 40 px.
            </p>
          </div>

          <button
            aria-pressed={dark}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-bold transition",
              dark
                ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                : "border-black/15 bg-white text-gray-800 hover:bg-black/5",
            )}
            type="button"
            onClick={() => setDark((value) => !value)}
          >
            {dark ? "Lichte achtergrond" : "Donkere achtergrond"}
          </button>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {SETS.map((set) => (
            <section
              key={set.id}
              className={cn(
                "rounded-2xl border p-4 sm:p-5",
                dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white",
              )}
            >
              <header className={cn("border-b pb-3", dark ? "border-white/10" : "border-black/10")}>
                <h2 className="font-serif text-xl">{set.name}</h2>
                <p className={cn("mt-0.5 text-xs", dark ? "text-slate-400" : "text-gray-500")}>
                  {set.note}
                </p>
              </header>

              <ul className={cn("divide-y", dark ? "divide-white/10" : "divide-black/10")}>
                {gameCatalog.map((game) => {
                  const art = ART[game.id] ?? FALLBACK_ARTWORK;
                  const Icon = art.phosphor;

                  return (
                    <li key={game.id} className="flex items-center gap-3 py-3">
                      <span
                        className={cn(
                          "grid size-14 shrink-0 place-items-center rounded-xl",
                          dark ? "bg-white/10" : "bg-[#f4f0e6]",
                        )}
                      >
                        {set.id === "fluent" ? (
                          art.fluent
                        ) : (
                          <Icon
                            className={dark ? "text-cyan-200" : "text-[#a4513a]"}
                            size={34}
                            weight={set.id === "duotone" ? "duotone" : "fill"}
                          />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">{game.name}</p>
                        <p
                          className={cn(
                            "mt-0.5 text-xs leading-snug",
                            dark ? "text-slate-400" : "text-gray-500",
                          )}
                        >
                          {game.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <p className={cn("mt-8 text-xs", dark ? "text-slate-400" : "text-gray-500")}>
          Alle drie de sets zijn MIT-gelicenseerd. De illustraties worden lokaal gebundeld, dus er
          gaat geen request naar een externe dienst.
        </p>
      </div>
    </main>
  );
}
