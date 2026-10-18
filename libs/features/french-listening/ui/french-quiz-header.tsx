interface FrenchQuizHeaderProps {
  index: number;
  total: number;
  correctCount: number;
  master: boolean;
}

export function FrenchQuizHeader({ index, total, correctCount, master }: FrenchQuizHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {master ? "Meester" : "Luister & kies"}
        </p>
        <p className="text-sm font-bold">
          Vraag {index + 1} van {total}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black leading-none">{correctCount}</p>
        <p className="text-xs text-muted-foreground">goed</p>
      </div>
    </div>
  );
}
