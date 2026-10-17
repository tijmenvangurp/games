import type { MemoryDifficulty } from "@entities/memory";
import { MONSTERS } from "@entities/memory";
import { cn } from "@shared/lib";
import { useMemoryStore } from "../model/use-memory-store";
import { MemoryCard } from "./memory-card";

const COLUMN_CLASSES: Record<MemoryDifficulty, string> = {
  makkelijk: "grid-cols-3 sm:grid-cols-4",
  gemiddeld: "grid-cols-4",
  moeilijk: "grid-cols-4 sm:grid-cols-5",
};

export function MemoryBoard() {
  const scene = useMemoryStore((state) => state.scene);
  const matched = useMemoryStore((state) => state.matched);
  const flipped = useMemoryStore((state) => state.flipped);

  if (!scene) {
    return null;
  }

  return (
    <div className={cn("mx-auto grid w-full max-w-2xl gap-2", COLUMN_CLASSES[scene.difficulty])}>
      {scene.cards.map((monsterId, index) => (
        <MemoryCard
          key={index}
          faceUp={matched[index] || flipped.includes(index)}
          index={index}
          matched={matched[index]}
          monster={MONSTERS[monsterId]}
          onFlip={(cardIndex) => useMemoryStore.getState().flip(cardIndex)}
        />
      ))}
    </div>
  );
}
