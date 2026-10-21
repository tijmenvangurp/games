import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LEVEL_COUNT, MAZE_LEVELS } from "@entities/arrow";
import {
  MazeIntro,
  MazeLevelSelect,
  MazePlay,
  MazeResult,
  useArrowsStore,
} from "@features/arrow-game";

type MazeScreen = "intro" | "play" | "levels";

interface MazeOverlaysProps {
  showResult: boolean;
  onNext: () => void;
  onLevels: () => void;
  onHome: () => void;
}

function MazeOverlays({ showResult, onNext, onLevels, onHome }: MazeOverlaysProps) {
  const level = useArrowsStore((state) => state.level);
  const levelIndex = useArrowsStore((state) => state.levelIndex);
  const status = useArrowsStore((state) => state.status);

  if (status === "won" && showResult) {
    return (
      <MazeResult
        hasNext={levelIndex + 1 < LEVEL_COUNT}
        level={level}
        levelIndex={levelIndex}
        onHome={onHome}
        onLevels={onLevels}
        onNext={onNext}
      />
    );
  }

  return null;
}

export function ArrowsPage() {
  const navigate = useNavigate();
  const level = useArrowsStore((state) => state.level);
  const levelIndex = useArrowsStore((state) => state.levelIndex);
  const unlocked = useArrowsStore((state) => state.unlocked);
  const status = useArrowsStore((state) => state.status);
  const [screen, setScreen] = useState<MazeScreen>("intro");
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (screen !== "play" || status !== "won") {
      setShowResult(false);
      return;
    }
    const timer = window.setTimeout(() => setShowResult(true), 450);
    return () => window.clearTimeout(timer);
  }, [screen, status]);

  const goHome = () => navigate({ to: "/" });

  const startAndPlay = (index: number) => {
    useArrowsStore.getState().startLevel(index);
    setScreen("play");
  };

  const handleNext = () => {
    if (levelIndex + 1 < LEVEL_COUNT) {
      startAndPlay(levelIndex + 1);
      return;
    }
    useArrowsStore.getState().restart();
    setScreen("play");
  };

  if (screen === "levels") {
    return (
      <MazeLevelSelect
        current={levelIndex}
        levels={MAZE_LEVELS}
        unlocked={unlocked}
        onBack={() => setScreen("intro")}
        onSelect={startAndPlay}
      />
    );
  }

  if (screen === "intro") {
    return (
      <MazeIntro
        level={level}
        levelCount={LEVEL_COUNT}
        levelIndex={levelIndex}
        unlocked={unlocked}
        onHome={goHome}
        onLevels={() => setScreen("levels")}
        onPlay={() => startAndPlay(levelIndex)}
      />
    );
  }

  return (
    <>
      <MazePlay onBack={() => setScreen("intro")} />
      <MazeOverlays
        showResult={showResult}
        onHome={goHome}
        onLevels={() => setScreen("levels")}
        onNext={handleNext}
      />
    </>
  );
}
