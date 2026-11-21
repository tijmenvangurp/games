import { Panel } from "@shared/ui";
import { useTexts } from "@shared/i18n";
import { frenchTexts } from "./texts";

interface FrenchQuizHeaderProps {
  index: number;
  total: number;
  correctCount: number;
  master: boolean;
}

export function FrenchQuizHeader({ index, total, correctCount, master }: FrenchQuizHeaderProps) {
  const t = useTexts(frenchTexts);
  return (
    <Panel className="flex items-center justify-between gap-3 px-4 py-3" padding="none">
      <div>
        <p className="text-xs font-semibold text-muted-foreground">
          {master ? t.masterLabel : t.quizLabel}
        </p>
        <p className="text-sm font-bold tabular-nums">{t.question(index + 1, total)}</p>
      </div>
      <div className="text-right tabular-nums">
        <p className="text-2xl font-black leading-none">{correctCount}</p>
        <p className="text-xs text-muted-foreground">{t.correctLabel}</p>
      </div>
    </Panel>
  );
}
