import type { GearSize, OutputKind, TrayItem } from "@entities/gear";

const CHAPTER_NAMES: Record<number, string> = {
  1: "Tandwielen",
  2: "Overbrengen",
  3: "Snelheid",
  4: "Kracht",
};

export function chapterName(chapter: number): string {
  return CHAPTER_NAMES[chapter] ?? `Hoofdstuk ${chapter}`;
}

const NEW_LABELS: Record<string, string> = {
  "first-mesh": "tandwiel",
  parity: "tussenwiel",
  "open-belt": "open riem",
  chain: "ketting",
  "crossed-belt": "gekruiste riem",
  detour: "omweg",
  "limited-tray": "beperkte voorraad",
  "reverse-motor": "andere motorrichting",
  size: "groot en klein",
  "worm-as": "wormas",
  "worm-as-strong": "sterke wormas",
  "speed-gauge": "snelheidsmeter",
  generator: "lamp",
  lift: "lift",
  split: "splitsing",
  "two-speeds": "twee snelheden",
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
    case "worm":
      return item.ratio <= 0.25 ? "Wormas sterk" : "Wormas";
    case "belt":
      return item.crossed === true ? "Gekruist" : "Open riem";
    case "chain":
      return "Ketting";
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
