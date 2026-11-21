import { Badge } from "./badge";
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
    <Panel as="header" className="flex items-center justify-between px-3.5 py-2" padding="none">
      <p className="text-sm font-bold tabular-nums text-muted-foreground">{progress}</p>
      <div className="flex items-center gap-1.5">
        <Badge aria-label={`${stars} sterren`} tone="warning">
          <Star aria-hidden="true" className="size-3.5 fill-warning text-warning" />
          {stars}
        </Badge>
        {streak > 0 ? (
          <Badge aria-label={`${streak} op een rij`} tone="primary">
            <Flame aria-hidden="true" className="size-3.5" />
            {streak}
          </Badge>
        ) : null}
      </div>
    </Panel>
  );
}
