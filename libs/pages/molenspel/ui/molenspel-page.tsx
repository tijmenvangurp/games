import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CelebrationDialog } from "@shared/ui";
import type { MolenspelGame, MolenspelPlayer } from "@entities/molenspel";
import { MolenspelIntro, MolenspelPlay, useMolenspelStore } from "@features/molenspel";

interface MolenspelResultProps {
  game: MolenspelGame;
  onAgain: () => void;
  onChoose: () => void;
  onHome: () => void;
}

/** Het venster na afloop van het spel. */
function MolenspelResult({ game, onAgain, onChoose, onHome }: MolenspelResultProps) {
  const draw = game.draw;
  return (
    <CelebrationDialog
      confetti={!draw}
      description={
        draw
          ? "Beide spelers bleven met drie stenen zitten. Het is gelijkspel."
          : `${game.winner === "wit" ? "Wit" : "Zwart"} wint met het molenspel!`
      }
      onAgain={onAgain}
      onChoose={onChoose}
      onHome={onHome}
      title={draw ? "Gelijkspel" : "Gewonnen!"}
    />
  );
}

export function MolenspelPage() {
  const navigate = useNavigate();
  const game = useMolenspelStore((state) => state.game);
  const history = useMolenspelStore((state) => state.history);
  const started = useMolenspelStore((state) => state.started);
  const start = useMolenspelStore((state) => state.start);
  const tap = useMolenspelStore((state) => state.tap);
  const undo = useMolenspelStore((state) => state.undo);
  const restart = useMolenspelStore((state) => state.restart);
  const backToSetup = useMolenspelStore((state) => state.backToSetup);
  const [firstPlayer, setFirstPlayer] = useState<MolenspelPlayer>("wit");
  const [notice, setNotice] = useState<string | null>(null);

  // Een melding verdwijnt vanzelf, zodat het bord rustig blijft.
  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const goHome = () => navigate({ to: "/" });

  const handleTap = (point: number) => {
    const result = tap(point);
    setNotice(result === "ignored" ? "Dat kan nu niet. Kijk goed waar je mag tikken." : null);
  };

  if (!started) {
    return (
      <MolenspelIntro
        firstPlayer={firstPlayer}
        onBack={goHome}
        onSelectPlayer={setFirstPlayer}
        onStart={(player) => start(player)}
      />
    );
  }

  return (
    <>
      <MolenspelPlay
        canUndo={history.length > 0}
        game={game}
        notice={notice}
        onBack={backToSetup}
        onRestart={restart}
        onTap={handleTap}
        onUndo={() => {
          setNotice(null);
          undo();
        }}
      />
      {game.winner || game.draw ? (
        <MolenspelResult game={game} onAgain={restart} onChoose={backToSetup} onHome={goHome} />
      ) : null}
    </>
  );
}
