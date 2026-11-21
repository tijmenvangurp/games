import type { GearSize, OutputKind, TrayItem } from "@entities/gear";

const CHAPTER_NAMES: Record<number, string> = {
  1: "Tandwielen",
  2: "Overbrengen",
  3: "Snelheid",
  4: "Kracht",
  5: "Machines",
  6: "De fabriek",
  7: "De tandwielkamer",
  8: "De aandrijving",
};

export function chapterName(chapter: number): string {
  return CHAPTER_NAMES[chapter] ?? `Hoofdstuk ${chapter}`;
}

const NEW_LABELS: Record<string, string> = {
  "first-mesh": "tandwiel",
  parity: "tussenwiel",
  "open-belt": "gesloten ketting",
  chain: "lange ketting",
  "crossed-belt": "gekruiste ketting",
  detour: "omweg",
  "limited-tray": "beperkte voorraad",
  "reverse-motor": "andere motorrichting",
  size: "groot en klein",
  "speed-gauge": "snelheidsmeter",
  "belt-ratio": "kettingvertraging",
  "two-ratios": "twee maten",
  generator: "lamp",
  lift: "lift",
  split: "splitsing",
  "two-speeds": "twee snelheden",
  "double-chain": "twee kettingen",
  "chain-mesh": "ketting en tandwiel",
  factory: "hijskraan",
  "mixed-split": "tandwiel en ketting",
  "opposite-directions": "twee richtingen",
  "mesh-and-chain": "keerkoppeling",
  "diagonal-train": "diagonale route",
  "three-outputs": "drie uitgangen",
  finale: "productielijn",
  "three-gear-train": "drie tandwielen",
  "gear-arch": "tandwielboog",
  "chain-and-gear-split": "kettingen en tandwiel",
  "four-gear-split": "dubbele tandwieltrein",
  "rigid-axle": "as",
  "axle-overdrive": "versnelling",
  "axle-split": "verdeelas",
  "output-through": "door het doel",
};

export function introducesLabel(introduces: string): string {
  return NEW_LABELS[introduces] ?? "iets nieuws";
}

function shortSize(size: GearSize): string {
  if (size === 1) {
    return "klein";
  }
  return size === 2 ? "middel" : "groot";
}

/** A compact tray label that still reads as Dutch. */
export function trayShortLabel(item: TrayItem): string {
  switch (item.kind) {
    case "gear":
      return shortSize(item.size).replace(/^./, (letter) => letter.toUpperCase());
    case "belt":
      return item.crossed === true ? "Gekruist" : "Ketting";
    case "chain":
      return "Ketting";
    case "axle":
      return "As";
  }
}

export function outputName(kind: OutputKind): string {
  if (kind === "generator") {
    return "Lamp";
  }
  return kind === "lift" ? "Lift" : "Doel";
}

/** 0.5 -> "0,5", 2 -> "2". Keeps the gauges readable in Dutch. */
export function formatSpeed(speed: number): string {
  const rounded = Math.round(speed * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0$/, "").replace(".", ",");
}
