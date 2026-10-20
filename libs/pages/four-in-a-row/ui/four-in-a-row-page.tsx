import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BOARD_SIZE_INFO,
  isFinished,
  PLAYER_INFO,
  winnerOf,
  type Player,
} from "@entities/four-in-a-row";
import { FourInARowPlay, FourInARowSetup, useFourInARowStore } from "@features/four-in-a-row-game";
import { useGameSetupNavigation } from "@shared/lib";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

/** Even wachten zodat de winnende rij te zien is voordat het venster opent. */
const WIN_FLASH_MS = 600;

/** Toont de uitslag pas als de winnende rij even in beeld is. */
function useResultVisible(finished: boolean): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!finished) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), WIN_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [finished]);

  return visible;
}

interface ResultDialogProps {
  winner: Player | null;
  draw: boolean;
  stand: string;
  onChoose: () => void;
}

function ResultDialog({ winner, draw, stand, onChoose }: ResultDialogProps) {
  const navigate = useNavigate();

  if (!winner && !draw) {
    return null;
  }

  return (
    <CelebrationDialog
      againLabel="Nog een potje"
      chooseLabel="Andere grootte"
      confetti={Boolean(winner)}
      description={
        winner
          ? `Vier op een rij! De stand is nu ${stand}.`
          : "Het bord is vol zonder vier op een rij."
      }
      title={winner ? `${PLAYER_INFO[winner].label} wint!` : "Gelijkspel!"}
      onAgain={() => useFourInARowStore.getState().start()}
      onChoose={onChoose}
      onHome={() => navigate({ to: "/" })}
    />
  );
}

export function FourInARowPage() {
  const game = useFourInARowStore((state) => state.game);
  const score = useFourInARowStore((state) => state.score);
  const settings = useFourInARowStore((state) => state.settings);
  const [showSetup, setShowSetup] = useState(false);

  const finished = game ? isFinished(game) : false;
  const winner = game ? winnerOf(game) : null;
  const resultVisible = useResultVisible(finished);
  const setupVisible = showSetup || !game;
  const gameSetup = useGameSetupNavigation({
    setupVisible,
    hasActiveGame: Boolean(game),
    backToGameLabel: "Terug naar je spel",
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });

  const size = BOARD_SIZE_INFO[settings.size];
  const stand = `${PLAYER_INFO.one.label} ${score.one} – ${PLAYER_INFO.two.label} ${score.two}`;

  const startGame = () => {
    useFourInARowStore.getState().start();
    setShowSetup(false);
  };

  return (
    <GameShell
      {...gameSetup}
      showSpeech={false}
      subtitle={`${size.label} ${size.size}`}
      title="Vier op een Rij"
    >
      {setupVisible ? (
        <div className="mx-auto my-auto w-full max-w-md">
          <FourInARowSetup
            game={game}
            score={score}
            settings={settings}
            onResetScore={() => useFourInARowStore.getState().resetScore()}
            onSizeChange={(nextSize) => useFourInARowStore.getState().chooseSize(nextSize)}
            onStart={startGame}
          />
        </div>
      ) : (
        <FourInARowPlay />
      )}

      {resultVisible && !setupVisible ? (
        <ResultDialog
          draw={Boolean(game?.draw)}
          stand={stand}
          winner={winner}
          onChoose={() => setShowSetup(true)}
        />
      ) : null}
    </GameShell>
  );
}
