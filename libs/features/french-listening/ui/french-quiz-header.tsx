import { Panel } from "@shared/ui";

interface FrenchQuizHeaderProps {
  index: number;
  total: number;
  correctCount: number;
  master: boolean;
}

export function FrenchQuizHeader({ index, total, correctCount, master }: FrenchQuizHeaderProps) {
  return (
    <Panel className="flex items-center justify-between gap-3 px-4 py-3" padding="none">
      <div>
        <p className="text-xs font-semibold text-muted-foreground">
          {master ? "Meester" : "Luister & kies"}
        </p>
        <p className="text-sm font-bold tabular-nums">
          Vraag {index + 1} van {total}
        </p>
      </div>
      <div className="text-right tabular-nums">
        <p className="text-2xl font-black leading-none">{correctCount}</p>
        <p className="text-xs text-muted-foreground">goed</p>
      </div>
    </Panel>
  );
}
