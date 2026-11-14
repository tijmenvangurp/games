import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { allLevels, LEVEL_COUNT, levelAt } from "@entities/gear";
import {
  chapterName,
  DraaiwerkLevelSelect,
  DraaiwerkPlay,
  useDraaiwerkStore,
} from "@features/draaiwerk";
import { CelebrationDialog } from "@shared/ui";
import { GameShell } from "@widgets/game-shell";

type DraaiwerkScreenName = "play" | "levels";

interface DraaiwerkScreenProps {
  onHome: () => void;
}

function subtitleFor(screen: DraaiwerkScreenName, levelIndex: number, chapter: number): string {
  if (screen === "levels") {
    const chapters = new Set(allLevels().map((level) => level.chapter)).size;
    return `${LEVEL_COUNT} levels · ${chapters} hoofdstukken`;
  }
  return `${chapterName(chapter)} · level ${levelIndex + 1} van ${LEVEL_COUNT}`;
}

export function DraaiwerkScreen({ onHome }: DraaiwerkScreenProps) {
  const level = useDraaiwerkStore((state) => state.level);
  const levelIndex = useDraaiwerkStore((state) => state.levelIndex);
  const unlocked = useDraaiwerkStore((state) => state.unlocked);
  const finished = useDraaiwerkStore((state) => state.finished);
  const status = useDraaiwerkStore((state) => state.status);
  const [screen, setScreen] = useState<DraaiwerkScreenName>("play");
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (status !== "solved") {
      setShowResult(false);
      return;
    }
    const timer = window.setTimeout(() => setShowResult(true), 600);
    return () => window.clearTimeout(timer);
  }, [status]);

  const hasNext = levelIndex + 1 < LEVEL_COUNT;
  const followingLevel = hasNext ? levelAt(levelIndex + 1) : null;
  const chapterLast = !followingLevel || followingLevel.chapter !== level.chapter;
  const winText = [
    ...new Set(
      level.outputs.map((output) =>
        output.kind === "generator"
          ? "De lamp brandt."
          : output.kind === "lift"
            ? "De lift staat omhoog."
            : "Het doel draait goed.",
      ),
    ),
  ].join(" ");

  const startAndPlay = (index: number) => {
    useDraaiwerkStore.getState().startLevel(index);
    setShowResult(false);
    setScreen("play");
  };

  const handleNext = () => {
    useDraaiwerkStore.getState().nextLevel();
    setShowResult(false);
  };

  const handleChoose = () => {
    setShowResult(false);
    setScreen("levels");
  };

  return (
    <>
      <GameShell
        backLabel={screen === "levels" ? "Terug naar het spel" : "Terug naar het menu"}
        fitViewport={screen === "play"}
        showSpeech={false}
        subtitle={subtitleFor(screen, levelIndex, level.chapter)}
        title="Draaiwerk"
        wide
        onBack={() => {
          if (screen === "levels") {
            setScreen("play");
            return;
          }
          onHome();
        }}
      >
        {screen === "levels" ? (
          <DraaiwerkLevelSelect
            current={levelIndex}
            finished={finished}
            levels={allLevels()}
            unlocked={unlocked}
            onSelect={startAndPlay}
          />
        ) : (
          <DraaiwerkPlay onLevels={handleChoose} />
        )}
      </GameShell>

      {showResult ? (
        <CelebrationDialog
          againLabel={hasNext ? "Volgende level" : "Opnieuw spelen"}
          chooseLabel="Kies level"
          confetti={chapterLast}
          description={`Level ${levelIndex + 1} · ${level.name} is opgelost. ${winText}`}
          homeLabel="Naar het menu"
          title="Gelukt!"
          onAgain={handleNext}
          onChoose={handleChoose}
          onHome={onHome}
        />
      ) : null}
    </>
  );
}

export function DraaiwerkPage() {
  const navigate = useNavigate();

  return <DraaiwerkScreen onHome={() => navigate({ to: "/" })} />;
}
