import { defineTexts } from "@shared/i18n";

/** De vaste teksten van de speelpagina, de zaakkeuze en de uitlegpagina. */
export const MURDOKU_PAGE_TEXTS = defineTexts(
  {
    title: "Wie was het?",
    backToCase: "Terug naar de zaak",
    /** De afloopzin: wie was als enige bij de buit, en in welke kamer? */
    reveal: (name: string, loot: string, roomName: string, _roomPhrase: string) =>
      `${name} was als enige bij ${loot} in de ${roomName}.`,
    solved: (reveal: string) => `Opgelost! ${reveal}`,
    wrong: "Nog niet helemaal. Kijk nog eens naar de aanwijzingen en probeer het opnieuw.",
    levelUp: "Je had hooguit één aanwijzing nodig. De volgende zaak mag een maatje groter.",
    levelDown:
      "Deze zaak was pittig. De volgende keer pakken we een rustiger zaak; je kunt deze altijd opnieuw proberen.",
    game: {
      otherCase: "Kies een andere zaak",
      howItWorks: "Zo werkt het",
      whoIsWho: "Wie is wie?",
      whereToStand: "Waar mag je staan?",
      viewPlan: "Bekijk de plattegrond",
      solvedTitle: "Opgelost!",
    },
    revealPanel: {
      heading: "De dief",
      note: "De buit staat ook op de plattegrond; de kamer van de buit is omlijnd.",
      again: "Nog een keer",
    },
    settings: {
      heading: "Zo speel ik",
      intro:
        "Een kruisje betekent: hier kan niemand staan. Deze keuze geldt voor elke zaak en blijft bewaard.",
      autoCross: "Rij en kolom automatisch wegstrepen",
      autoCrossNote:
        "Automatisch wegstrepen zet zelf een kruisje in de rij en kolom van iemand die je plaatst. Zo hoef je die vakjes niet zelf weg te strepen.",
    },
    board: {
      heading: "De plattegrond",
      crossMode: "Kruisjesstand: tik op een vrij vakje om het weg te strepen.",
      placed: (name: string, row: number, col: number) =>
        `${name} staat op rij ${row}, kolom ${col}. Tik op een ander vakje om te verplaatsen, of op dit vakje om weg te halen.`,
      chosen: (name: string) => `${name} is gekozen. Tik op een vakje om te plaatsen.`,
      choose: "Kies eerst een persoon hieronder.",
      cross: "Kruisjesstand",
      undo: "Ongedaan maken",
      restart: "Opnieuw beginnen",
      hint: "Aanwijzing",
      check: "Controleer",
      help: "Uitleg en woordenlijst",
      checkLater: "Controleren kan zodra iedereen op het bord staat.",
      boardHelp:
        "Rijen staan links (R), kolommen boven (K). Tik nog eens op een geplaatst persoon om hem weg te halen.",
    },
    cases: {
      subtitle: "Twaalf eigen zaken",
      heading: "Kies een zaak",
      intro:
        'Begin met een kleine zaak of kies meteen een grote. De zaak met "Past bij jou" groeit met je mee; je mag altijd zelf een andere kiezen.',
      solved: "Opgelost",
      unplayed: "Nog niet gespeeld",
      recommended: "Past bij jou",
    },
    lesson: {
      title: "Zo werkt het",
      subtitle: "Zeven stappen en een woordenlijst",
      intro:
        "Lees één scherm per keer. Alles wat je leert, komt terug in de aanwijzingen van elke zaak.",
      toCase: "Naar de zaak",
    },
  },
  {
    title: "Who Did It?",
    backToCase: "Back to the case",
    reveal: (name: string, loot: string, _roomName: string, roomPhrase: string) =>
      `${name} was the only one with ${loot} in ${roomPhrase}.`,
    solved: (reveal: string) => `Solved! ${reveal}`,
    wrong: "Not quite yet. Take another look at the clues and try again.",
    levelUp: "You needed one clue at most. The next case can be a bit bigger.",
    levelDown:
      "This case was a tricky one. Next time we'll pick a calmer case; you can always try this one again.",
    game: {
      otherCase: "Choose another case",
      howItWorks: "How it works",
      whoIsWho: "Who is who?",
      whereToStand: "Where can you stand?",
      viewPlan: "Look at the floor plan",
      solvedTitle: "Solved!",
    },
    revealPanel: {
      heading: "The thief",
      note: "The loot is on the floor plan too; the loot's room has an outline.",
      again: "Play again",
    },
    settings: {
      heading: "How I play",
      intro:
        "A cross means: nobody can stand here. This choice applies to every case and is saved.",
      autoCross: "Cross out row and column automatically",
      autoCrossNote:
        "Automatic crossing out puts a cross in the row and column of anyone you place. That way you don't have to cross out those squares yourself.",
    },
    board: {
      heading: "The floor plan",
      crossMode: "Cross mode: tap a free square to cross it out.",
      placed: (name: string, row: number, col: number) =>
        `${name} is in row ${row}, column ${col}. Tap another square to move them, or this square to take them off.`,
      chosen: (name: string) => `${name} is chosen. Tap a square to place them.`,
      choose: "First choose a person below.",
      cross: "Cross mode",
      undo: "Undo",
      restart: "Start again",
      hint: "Hint",
      check: "Check",
      help: "How it works and word list",
      checkLater: "You can check once everyone is on the board.",
      boardHelp:
        "Rows are on the left (R), columns along the top (C). Tap a placed person again to take them off.",
    },
    cases: {
      subtitle: "Twelve cases of our own",
      heading: "Choose a case",
      intro:
        'Start with a small case or pick a big one straight away. The case marked "Right for you" grows with you; you can always choose a different one.',
      solved: "Solved",
      unplayed: "Not played yet",
      recommended: "Right for you",
    },
    lesson: {
      title: "How it works",
      subtitle: "Seven steps and a word list",
      intro:
        "Read one screen at a time. Everything you learn comes back in the clues of every case.",
      toCase: "To the case",
    },
  },
);
