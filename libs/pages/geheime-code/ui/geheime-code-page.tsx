import { useNavigate } from "@tanstack/react-router";
import { LEVEL_LABEL, THEME_LABEL } from "@entities/geheime-code";
import { GeheimeCodePlay, GeheimeCodeSetup, useGeheimeCodeStore } from "@features/geheime-code";
import { useGameSetupState } from "@shared/lib";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

export function GeheimeCodePage() {
  const navigate = useNavigate();
  const puzzle = useGeheimeCodeStore((state) => state.puzzle);
  const result = useGeheimeCodeStore((state) => state.result);
  const theme = useGeheimeCodeStore((state) => state.theme);
  const level = useGeheimeCodeStore((state) => state.level);
  const { setupVisible, setShowSetup, navigation } = useGameSetupState(Boolean(puzzle));

  const start = () => {
    useGeheimeCodeStore.getState().start();
    setShowSetup(false);
  };

  const description =
    result && result.firstTry === result.total
      ? "Alles in één keer goed."
      : result
        ? `${result.firstTry} van ${result.total} woorden in één keer.`
        : "";

  return (
    <GameShell
      {...navigation}
      showSpeech={false}
      subtitle={setupVisible ? undefined : `${THEME_LABEL[theme]} · ${LEVEL_LABEL[level]}`}
      title="Geheime Code"
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
          description={description}
          title="Code gekraakt!"
          againLabel="Nog een code"
          chooseLabel="Ander niveau"
          onAgain={() => useGeheimeCodeStore.getState().restart()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
