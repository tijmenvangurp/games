import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BOARD_SIZE_INFO,
  isFinished,
  winnerOf,
  type FourInARowGame,
  type FourInARowMode,
  type Player,
} from "@entities/four-in-a-row";
import {
  FourInARowPlay,
  FourInARowSetup,
  standText,
  useFourInARowStore,
  winTitle,
  type FourInARowSettings,
} from "@features/four-in-a-row-game";
import { useGameSetupNavigation } from "@shared/lib";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

/** Even wachten zodat de winnende rij te zien is voordat het venster opent. */
const WIN_FLASH_MS = 600;

/** De computer doet alsof hij nadenkt; zo blijft de beurtwissel leesbaar. */
const COMPUTER_THINK_MS = 650;

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

/** Laat de computer zetten zodra het zijn beurt is. */
function useComputerTurn(): void {
  const mode = useFourInARowStore((state) => state.match?.mode);
  const game = useFourInARowStore((state) => state.game);
  const waiting = mode === "computer" && game?.current === "two" && !isFinished(game);

  useEffect(() => {
    if (!waiting) {
      return;
    }

    const timer = window.setTimeout(
      () => useFourInARowStore.getState().playComputer(),
      COMPUTER_THINK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [waiting, game]);
}

function SetupPane({
  settings,
  score,
  game,
  onStart,
}: {
  settings: FourInARowSettings;
  score: Record<Player, number>;
  game: FourInARowGame | null;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto my-auto w-full max-w-md">
      <FourInARowSetup
        game={game}
        score={score}
        settings={settings}
        onLevelChange={(level) => useFourInARowStore.getState().chooseLevel(level)}
        onModeChange={(mode) => useFourInARowStore.getState().chooseMode(mode)}
        onResetScore={() => useFourInARowStore.getState().resetScore()}
        onSizeChange={(size) => useFourInARowStore.getState().chooseSize(size)}
        onStart={onStart}
      />
    </div>
  );
}

interface ResultDialogProps {
  visible: boolean;
  draw: boolean;
  winner: Player | null;
  mode: FourInARowMode;
  stand: string;
  onChoose: () => void;
}

function ResultDialog({ visible, draw, winner, mode, stand, onChoose }: ResultDialogProps) {
  const navigate = useNavigate();

  if (!visible || (!winner && !draw)) {
    return null;
  }

  return (
    <CelebrationDialog
      againLabel="Nog een potje"
      chooseLabel={mode === "computer" ? "Andere instellingen" : "Andere grootte"}
      confetti={Boolean(winner)}
      description={
        winner
          ? `Vier op een rij! De stand is nu ${stand}.`
          : "Het bord is vol zonder vier op een rij."
      }
      title={winner ? winTitle(winner, mode) : "Gelijkspel!"}
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
  const mode = useFourInARowStore((state) => state.match?.mode ?? settings.mode);
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

  useComputerTurn();

  const size = BOARD_SIZE_INFO[settings.size];
  const stand = standText(score, mode);

  return (
    <GameShell
      {...gameSetup}
      showSpeech={false}
      subtitle={`${size.label} ${size.size}`}
      title="Vier op een Rij"
    >
      {setupVisible ? (
        <SetupPane
          game={game}
          score={score}
          settings={settings}
          onStart={() => {
            useFourInARowStore.getState().start();
            setShowSetup(false);
          }}
        />
      ) : (
        <FourInARowPlay />
      )}

      <ResultDialog
        draw={Boolean(game?.draw)}
        mode={mode}
        stand={stand}
        visible={resultVisible && !setupVisible}
        winner={winner}
        onChoose={() => setShowSetup(true)}
      />
    </GameShell>
  );
}
