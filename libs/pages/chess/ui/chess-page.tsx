import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { GameShell } from "@widgets/game-shell";
import { GraduationCap, Panel, Play, Puzzle, Swords } from "@shared/ui";

interface ChessHubCardProps {
  readonly to: "/schaken/les" | "/schaken/partij" | "/puzzels";
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
}

function ChessHubCard({ to, icon, title, description }: ChessHubCardProps) {
  return (
    <Link className="group flex focus-visible:outline-none" to={to}>
      <Panel
        className="flex h-full min-h-44 w-full flex-col group-focus-visible:ring-4 group-focus-visible:ring-primary/25"
        interactive
        padding="lg"
      >
        <div className="flex items-start justify-between">
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"
          >
            {icon}
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-muted text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Play aria-hidden="true" className="size-4" />
          </span>
        </div>
        <h2 className="mt-4 font-display text-xl leading-snug tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-auto pt-4 text-sm font-bold text-primary">Spelen</span>
      </Panel>
    </Link>
  );
}

export function ChessPage() {
  const navigate = useNavigate();

  return (
    <GameShell
      subtitle="Les, puzzels of een partij"
      title="Schaken"
      onBack={() => navigate({ to: "/" })}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <p className="text-muted-foreground">
          Leer de stukken, los een puzzel op of speel een partij tegen de computer of een vriend.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <ChessHubCard
            description="Leer stap voor stap alle stukken en zet je eerste schaakmat."
            icon={<GraduationCap className="size-6" />}
            title="Schaakles"
            to="/schaken/les"
          />
          <ChessHubCard
            description="Speel tegen de computer of samen op dit scherm. Kies een avatar en zie meteen wie aan zet is."
            icon={<Swords className="size-6" />}
            title="Schaakpartij"
            to="/schaken/partij"
          />
          <ChessHubCard
            description="Los korte puzzels op: zet schaakmat of win een stuk."
            icon={<Puzzle className="size-6" />}
            title="Schaakpuzzels"
            to="/puzzels"
          />
        </div>
      </div>
    </GameShell>
  );
}
