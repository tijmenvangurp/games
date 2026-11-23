import type { GearSize, OutputKind, TrayItem } from "@entities/gear";
import { getTexts } from "@shared/i18n";
import { draaiwerkTexts } from "./texts";

export function chapterName(chapter: number): string {
  const t = getTexts(draaiwerkTexts);
  return t.chapterNames[chapter - 1] ?? t.chapter(chapter);
}

export function introducesLabel(introduces: string): string {
  const t = getTexts(draaiwerkTexts);
  const labels: Readonly<Record<string, string>> = t.newLabels;
  return labels[introduces] ?? t.somethingNew;
}

function shortSize(size: GearSize): string {
  return getTexts(draaiwerkTexts).shortSizes[size];
}

/** A compact tray label in the active language. */
export function trayShortLabel(item: TrayItem): string {
  const t = getTexts(draaiwerkTexts);
  switch (item.kind) {
    case "gear":
      return shortSize(item.size);
    case "belt":
      return item.crossed === true ? t.shortCrossed : t.shortChain;
    case "chain":
      return t.shortChain;
    case "axle":
      return t.shortAxle;
  }
}

export function outputName(kind: OutputKind): string {
  return getTexts(draaiwerkTexts).outputs[kind];
}

/** 0.5 -> "0,5" in het Nederlands en "0.5" in het Engels, 2 -> "2". */
export function formatSpeed(speed: number): string {
  const rounded = Math.round(speed * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0$/, "").replace(".", getTexts(draaiwerkTexts).decimalSeparator);
}
