import type { MazeLevel } from "@entities/arrow";
import { CelebrationDialog } from "@shared/ui";

interface MazeResultProps {
  level: MazeLevel;
  levelIndex: number;
  hasNext: boolean;
  onNext: () => void;
  onLevels: () => void;
  onHome: () => void;
}

export function MazeResult({
  level,
  levelIndex,
  hasNext,
  onNext,
  onLevels,
  onHome,
}: MazeResultProps) {
  return (
    <CelebrationDialog
      confetti
      againLabel={hasNext ? "Volgende level" : "Opnieuw spelen"}
      chooseLabel="Kies level"
      description={`Level ${levelIndex + 1} · ${level.name} is opgelost.`}
      homeLabel="Naar het menu"
      title="Gelukt!"
      onAgain={onNext}
      onChoose={onLevels}
      onHome={onHome}
    />
  );
}
