import { levelName, type MazeLevel } from "@entities/arrow";
import { useLanguage, useTexts } from "@shared/i18n";
import { CelebrationDialog } from "@shared/ui";
import { arrowTexts } from "../model/texts";

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
  const t = useTexts(arrowTexts);
  const language = useLanguage();
  return (
    <CelebrationDialog
      confetti
      againLabel={hasNext ? t.nextLevel : t.playAgain}
      chooseLabel={t.chooseLevel}
      description={t.solved(levelIndex + 1, levelName(level, language))}
      homeLabel={t.toMenu}
      title={t.success}
      onAgain={onNext}
      onChoose={onLevels}
      onHome={onHome}
    />
  );
}
