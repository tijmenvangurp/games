import { Link, useNavigate } from "@tanstack/react-router";
import { isFinished } from "@entities/ganzenbord";
import {
  GanzenbordPlay,
  GanzenbordSetup,
  useGanzenbordStore,
  winnerDescription,
  winnerTitle,
} from "@features/ganzenbord";
import { useDelayedVisible, useGameSetupState } from "@shared/lib";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

/** Even wachten zodat de laatste zet en de finish zichtbaar blijven. */
const WIN_FLASH_MS = 600;

export function GanzenbordPage() {
  const game = useGanzenbordStore((state) => state.game);
  const settings = useGanzenbordStore((state) => state.settings);
  const finished = game ? isFinished(game) : false;
  const resultVisible = useDelayedVisible(finished, WIN_FLASH_MS);
  const { setShowSetup, setupVisible, navigation: gameSetup } = useGameSetupState(Boolean(game));

  const navigate = useNavigate();
  const playerCount = game?.players.length ?? settings.playerCount;

  return (
    <GameShell
      {...gameSetup}
      showSpeech={false}
      subtitle={`${playerCount} spelers`}
      title="Ganzenbord"
      wide
    >
      {setupVisible ? (
        <div className="mx-auto my-auto w-full max-w-md">
          <GanzenbordSetup
            settings={settings}
            onControllerChange={(id, controller) =>
              useGanzenbordStore.getState().setController(id, controller)
            }
            onPlayerCountChange={(count) => useGanzenbordStore.getState().setPlayerCount(count)}
            onStart={() => {
              useGanzenbordStore.getState().start();
              setShowSetup(false);
            }}
          />
        </div>
      ) : (
        <GanzenbordPlay />
      )}

      {setupVisible ? (
        <p className="text-center text-xs">
          <Link className="underline" to="/kalibreren">
            Bord kalibreren (tijdelijk)
          </Link>
        </p>
      ) : null}

      {resultVisible && game && !setupVisible ? (
        <CelebrationDialog
          againLabel="Nog een potje"
          chooseLabel="Andere spelers"
          confetti={Boolean(game.winner)}
          description={winnerDescription(game)}
          title={game.status === "draw" ? "Gelijkspel!" : winnerTitle(game)}
          onAgain={() => useGanzenbordStore.getState().start()}
          onChoose={() => setShowSetup(true)}
          onHome={() => navigate({ to: "/" })}
        />
      ) : null}
    </GameShell>
  );
}
