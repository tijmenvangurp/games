import type { GearSize, OutputKind, TrayItem } from "@entities/gear";
import { currentLanguage, getTexts, type Language } from "@shared/i18n";
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

const NUMBER_FORMATS = new Map<Language, Intl.NumberFormat>();

function numberFormat(language: Language): Intl.NumberFormat {
  const existing = NUMBER_FORMATS.get(language);
  if (existing) {
    return existing;
  }
  const format = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
  NUMBER_FORMATS.set(language, format);
  return format;
}

/** 0.5 -> "0,5" in het Nederlands en "0.5" in het Engels, 2 -> "2". */
export function formatSpeed(speed: number): string {
  return numberFormat(currentLanguage()).format(speed);
}
