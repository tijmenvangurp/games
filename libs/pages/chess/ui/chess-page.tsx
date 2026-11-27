import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { GameShell } from "@widgets/game-shell";
import { useTexts } from "@shared/i18n";
import { GraduationCap, Panel, Play, Puzzle, Swords } from "@shared/ui";
import { chessPageTexts } from "./texts";

interface ChessHubCardProps {
  readonly to: "/schaken/les" | "/schaken/partij" | "/puzzels";
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
}

function ChessHubCard({ to, icon, title, description }: ChessHubCardProps) {
  const t = useTexts(chessPageTexts);

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
        <span className="mt-auto pt-4 text-sm font-bold text-primary">{t.play}</span>
      </Panel>
    </Link>
  );
}

export function ChessPage() {
  const t = useTexts(chessPageTexts);
  const navigate = useNavigate();

  return (
    <GameShell subtitle={t.hubSubtitle} title={t.hubTitle} onBack={() => navigate({ to: "/" })}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <p className="text-muted-foreground">{t.hubIntro}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <ChessHubCard
            description={t.lessonDescription}
            icon={<GraduationCap className="size-6" />}
            title={t.lessonTitle}
            to="/schaken/les"
          />
          <ChessHubCard
            description={t.gameDescription}
            icon={<Swords className="size-6" />}
            title={t.gameTitle}
            to="/schaken/partij"
          />
          <ChessHubCard
            description={t.puzzlesDescription}
            icon={<Puzzle className="size-6" />}
            title={t.puzzlesTitle}
            to="/puzzels"
          />
        </div>
      </div>
    </GameShell>
  );
}
