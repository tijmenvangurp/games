import { defineTexts } from "@shared/i18n";

/** De vaste teksten van het bord, de kaarten, de legenda en de uitleg. */
export const MURDOKU_UI_TEXTS = defineTexts(
  {
    board: {
      label: (title: string, width: number, height: number) =>
        `Plattegrond van ${title}, ${width} bij ${height}`,
      cells: "Vakjes van de plattegrond",
      rowGroup: (row: number) => `Rij ${row}`,
      /** De letters van de rij- en kolomlabels (R1, K1). */
      rowLetter: "R",
      colLetter: "K",
      blocked: "geen plek",
      crossed: "kruisje",
      empty: "leeg",
      lit: "licht op",
      nobodyHere: "hier mag niemand staan",
      row: (row: number) => `rij ${row}`,
      col: (col: number) => `kolom ${col}`,
      objectsJoin: " en ",
      tapToRemove: "tik om weg te halen",
      tapToCross: "tik om weg te strepen",
      canStandHere: (name: string) => `${name} kan hier staan`,
      summary: "Waar staat wie?",
      notPlaced: (name: string) => `${name} is nog niet op het bord.`,
      placedAt: (name: string, row: number, col: number) =>
        `${name} is op rij ${row}, kolom ${col}.`,
    },
    cards: {
      showWord: (word: string) => `Toon ${word} op het bord`,
    },
    legend: {
      canStand: "Hier mag je staan",
      cannotStand: "Hier mag je niet staan",
      window: "Een raam is geen vakje: het zit op de muur.",
      loot: (loot: string) => ` De buit (${loot}) heeft een eigen icoon en is geen meubel.`,
    },
    lesson: {
      previous: "Vorige stap",
      next: "Volgende stap",
      stepOf: (step: number, total: number) => `Stap ${step} van ${total}`,
      pickStep: "Kies een scherm",
      stepLabel: (step: number, title: string) => `Stap ${step}: ${title}`,
      glossary: "Woordenlijst",
      glossaryIntro:
        "Elk woord uit een aanwijzing betekent altijd hetzelfde. Tik op een woord in een aanwijzing om het op het bord te zien.",
      legend: "Waar mag je staan?",
      tips: "Twee tips",
    },
  },
  {
    board: {
      label: (title: string, width: number, height: number) =>
        `Floor plan of ${title}, ${width} by ${height}`,
      cells: "Squares of the floor plan",
      rowGroup: (row: number) => `Row ${row}`,
      rowLetter: "R",
      colLetter: "C",
      blocked: "no space",
      crossed: "crossed out",
      empty: "empty",
      lit: "lit up",
      nobodyHere: "nobody can stand here",
      row: (row: number) => `row ${row}`,
      col: (col: number) => `column ${col}`,
      objectsJoin: " and ",
      tapToRemove: "tap to remove",
      tapToCross: "tap to cross out",
      canStandHere: (name: string) => `${name} can stand here`,
      summary: "Who is where?",
      notPlaced: (name: string) => `${name} is not on the board yet.`,
      placedAt: (name: string, row: number, col: number) =>
        `${name} is in row ${row}, column ${col}.`,
    },
    cards: {
      showWord: (word: string) => `Show ${word} on the board`,
    },
    legend: {
      canStand: "You can stand here",
      cannotStand: "You can't stand here",
      window: "A window is not a square: it is part of the wall.",
      loot: (loot: string) => ` The loot (${loot}) has its own icon and is not furniture.`,
    },
    lesson: {
      previous: "Previous step",
      next: "Next step",
      stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
      pickStep: "Choose a screen",
      stepLabel: (step: number, title: string) => `Step ${step}: ${title}`,
      glossary: "Word list",
      glossaryIntro:
        "Every word in a clue always means the same thing. Tap a word in a clue to see it on the board.",
      legend: "Where can you stand?",
      tips: "Two tips",
    },
  },
);
