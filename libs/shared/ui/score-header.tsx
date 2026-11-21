import { Flame, Star } from "./icons";
import { Panel } from "./panel";

interface ScoreHeaderProps {
  /** Voortgangstekst links, bijvoorbeeld "Vraag 1 van 10" of "Som 2 van 10". */
  progress: string;
  stars: number;
  streak?: number;
}

export function ScoreHeader({ progress, stars, streak = 0 }: ScoreHeaderProps) {
  return (
    <Panel as="header" className="flex items-center justify-between px-3.5 py-2.5" padding="none">
      <p className="text-sm font-bold tabular-nums text-muted-foreground">{progress}</p>
      <div className="flex items-center gap-3 text-sm font-bold tabular-nums">
        <span aria-label={`${stars} sterren`} className="inline-flex items-center gap-1">
          <Star aria-hidden="true" className="size-4 fill-warning text-warning" />
          {stars}
        </span>
        {streak > 0 ? (
          <span aria-label={`${streak} op een rij`} className="inline-flex items-center gap-1">
            <Flame aria-hidden="true" className="size-4 text-warning" />
            {streak}
          </span>
        ) : null}
      </div>
    </Panel>
  );
}
