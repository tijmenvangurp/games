import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { allLevels, LEVEL_COUNT, levelAt } from "@entities/gear";
import {
  chapterName,
  DraaiwerkLevelSelect,
  DraaiwerkPlay,
  useDraaiwerkStore,
} from "@features/draaiwerk";
import { useTexts } from "@shared/i18n";
import { GameShell } from "@widgets/game-shell";
import { draaiwerkPageTexts } from "./texts";

type DraaiwerkScreenName = "play" | "levels";

interface DraaiwerkScreenProps {
  onHome: () => void;
}

type DraaiwerkPageTexts = (typeof draaiwerkPageTexts)["nl"];

function subtitleFor(
  t: DraaiwerkPageTexts,
  screen: DraaiwerkScreenName,
  levelIndex: number,
  chapter: number,
): string {
  if (screen === "levels") {
    const chapters = new Set(allLevels().map((level) => level.chapter)).size;
    return t.levelsSubtitle(LEVEL_COUNT, chapters);
  }
  return t.playSubtitle(chapterName(chapter), levelIndex + 1, LEVEL_COUNT);
}

export function DraaiwerkScreen({ onHome }: DraaiwerkScreenProps) {
  const level = useDraaiwerkStore((state) => state.level);
  const levelIndex = useDraaiwerkStore((state) => state.levelIndex);
  const unlocked = useDraaiwerkStore((state) => state.unlocked);
  const finished = useDraaiwerkStore((state) => state.finished);
  const status = useDraaiwerkStore((state) => state.status);
  const [screen, setScreen] = useState<DraaiwerkScreenName>("play");
  const t = useTexts(draaiwerkPageTexts);

  const hasNext = levelIndex + 1 < LEVEL_COUNT;
  const followingLevel = hasNext ? levelAt(levelIndex + 1) : null;
  const chapterLast = !followingLevel || followingLevel.chapter !== level.chapter;

  const startAndPlay = (index: number) => {
    useDraaiwerkStore.getState().startLevel(index);
    setScreen("play");
  };

  const handleNext = () => {
    useDraaiwerkStore.getState().nextLevel();
  };

  const handleChoose = () => {
    setScreen("levels");
  };

  return (
    <GameShell
      backLabel={screen === "levels" ? t.backToGame : undefined}
      fitViewport={screen === "play"}
      showSpeech={false}
      subtitle={subtitleFor(t, screen, levelIndex, level.chapter)}
      title={t.title}
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
        <DraaiwerkPlay
          celebrate={chapterLast && status === "solved"}
          hasNext={hasNext}
          onLevels={handleChoose}
          onNext={handleNext}
        />
      )}
    </GameShell>
  );
}

export function DraaiwerkPage() {
  const navigate = useNavigate();

  return <DraaiwerkScreen onHome={() => navigate({ to: "/" })} />;
}
