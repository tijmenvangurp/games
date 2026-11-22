import {
  Anchor,
  Bag,
  Bell,
  Boat,
  Book,
  Carrot,
  Cat,
  Crown,
  Fish,
  Flower,
  Gift,
  Heart,
  House,
  Key,
  Moon,
  Rocket,
  Star,
  Tree,
  type Icon,
} from "@phosphor-icons/react";

const ICONS: Readonly<Record<string, Icon>> = {
  anchor: Anchor,
  bag: Bag,
  bell: Bell,
  boat: Boat,
  book: Book,
  carrot: Carrot,
  cat: Cat,
  crown: Crown,
  fish: Fish,
  flower: Flower,
  gift: Gift,
  heart: Heart,
  house: House,
  key: Key,
  moon: Moon,
  rocket: Rocket,
  star: Star,
  tree: Tree,
};

export function SymbolIcon({ id, className }: { id: string; className?: string }) {
  const IconComponent = ICONS[id] ?? Star;
  return <IconComponent aria-hidden className={className} weight="regular" />;
}
