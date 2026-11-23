import { useNavigate } from "@tanstack/react-router";
import { geheimeCodeTexts, type RoundResult } from "@entities/geheime-code";
import { GeheimeCodePlay, GeheimeCodeSetup, useGeheimeCodeStore } from "@features/geheime-code";
import { useTexts } from "@shared/i18n";
import { useGameSetupState } from "@shared/lib";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";
import { geheimeCodePageTexts } from "./texts";

type PageTexts = (typeof geheimeCodePageTexts)["nl"];

function resultText(t: PageTexts, result: RoundResult): string {
  return result.firstTry === result.total
    ? t.allFirstTry
    : t.firstTry(result.firstTry, result.total);
}

export function GeheimeCodePage() {
  const navigate = useNavigate();
  const t = useTexts(geheimeCodePageTexts);
  const names = useTexts(geheimeCodeTexts);
  const puzzle = useGeheimeCodeStore((state) => state.puzzle);
  const result = useGeheimeCodeStore((state) => state.result);
  const theme = useGeheimeCodeStore((state) => state.theme);
  const level = useGeheimeCodeStore((state) => state.level);
  const { setupVisible, setShowSetup, navigation } = useGameSetupState(Boolean(puzzle));

  const start = () => {
    useGeheimeCodeStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell
      {...navigation}
      showSpeech={false}
      subtitle={setupVisible ? undefined : `${names.themes[theme]} · ${names.levels[level]}`}
      title={t.title}
    >
      {setupVisible ? (
        <div className="mx-auto w-full max-w-xl">
          <GeheimeCodeSetup
            level={level}
            theme={theme}
            onLevel={(next) => useGeheimeCodeStore.getState().chooseLevel(next)}
            onStart={start}
            onTheme={(next) => useGeheimeCodeStore.getState().chooseTheme(next)}
          />
        </div>
      ) : (
        <GeheimeCodePlay />
      )}

      {result && !setupVisible ? (
        <CelebrationDialog
          confetti={result.firstTry === result.total}
          description={resultText(t, result)}
          title={t.cracked}
          againLabel={t.again}
          chooseLabel={t.choose}
          onAgain={() => useGeheimeCodeStore.getState().restart()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
