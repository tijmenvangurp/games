import {
  ArrowsOutCardinal,
  BookOpenText,
  Calculator,
  Cards,
  Crown,
  MagnifyingGlass,
  PuzzlePiece,
  Question,
  Target,
  TextAa,
  Translate,
  type Icon,
  type IconProps,
} from "@phosphor-icons/react";

const GAME_ICONS = {
  sudoku: PuzzlePiece,
  "math-trainer": Calculator,
  arrows: ArrowsOutCardinal,
  seek: MagnifyingGlass,
  "word-search": TextAa,
  memory: Cards,
  "pokemon-quiz": Question,
  "chess-tutorial": Crown,
  "chess-puzzles": Target,
  "french-listening": Translate,
  "french-lesson": BookOpenText,
} satisfies Record<string, Icon>;

type GameIconName = keyof typeof GAME_ICONS;

interface GameIconProps extends IconProps {
  name: string;
}

/**
 * Eén iconenfamilie voor spelidentiteit. Gebruik `regular` voor rust en
 * `fill` voor een actieve of gekozen staat.
 */
export function GameIcon({ name, ...props }: GameIconProps) {
  const IconComponent = GAME_ICONS[name as GameIconName] ?? PuzzlePiece;

  return <IconComponent {...props} />;
}
