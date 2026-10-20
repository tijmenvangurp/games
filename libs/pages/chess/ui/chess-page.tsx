import { Link, useNavigate } from "@tanstack/react-router";
import { GameShell } from "@widgets/game-shell";
import { cn } from "@shared/lib";
import { Play } from "@shared/ui";

interface ChessHubCardProps {
  readonly to: "/schaken/les" | "/schaken/partij" | "/puzzels";
  readonly emoji: string;
  readonly title: string;
  readonly description: string;
  readonly accentClassName: string;
}

function ChessHubCard({ to, emoji, title, description, accentClassName }: ChessHubCardProps) {
  return (
    <Link
      className={cn(
        "group flex min-h-40 flex-col rounded-3xl border bg-gradient-to-br p-5 shadow-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        accentClassName,
      )}
      to={to}
    >
      <div className="flex items-start justify-between">
        <span aria-hidden="true" className="text-4xl">
          {emoji}
        </span>
        <span className="grid size-9 place-items-center rounded-full bg-white/80 text-primary shadow-sm transition group-hover:bg-white">
          <Play aria-hidden="true" className="size-4" />
        </span>
      </div>
      <h2 className="mt-3 text-lg font-black">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <span className="mt-auto pt-4 text-sm font-bold text-primary">Spelen</span>
    </Link>
  );
}

export function ChessPage() {
  const navigate = useNavigate();

  return (
    <GameShell
      onBack={() => navigate({ to: "/" })}
      subtitle="Les, puzzels of een partij"
      title="Schaken"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <p className="text-muted-foreground">
          Leer de stukken, los een puzzel op of speel een partij tegen de computer of een vriend.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <ChessHubCard
            accentClassName="from-violet-100 via-violet-50 to-white"
            description="Leer stap voor stap alle stukken en zet je eerste schaakmat."
            emoji="♞"
            title="Schaakles"
            to="/schaken/les"
          />
          <ChessHubCard
            accentClassName="from-sky-100 via-sky-50 to-white"
            description="Speel tegen de computer of samen op dit scherm. Kies een avatar en zie meteen wie aan zet is."
            emoji="♟️"
            title="Schaakpartij"
            to="/schaken/partij"
          />
          <ChessHubCard
            accentClassName="from-teal-100 via-emerald-50 to-white"
            description="Los korte puzzels op: zet schaakmat of win een stuk."
            emoji="🧩"
            title="Schaakpuzzels"
            to="/puzzels"
          />
        </div>
      </div>
    </GameShell>
  );
}
