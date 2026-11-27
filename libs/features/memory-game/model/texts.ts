import { defineTexts } from "@shared/i18n";

export const memoryTexts = defineTexts(
  {
    modes: {
      auto: { label: "Groeit mee", hint: "De app kiest het aantal paren", short: "groeit mee" },
      manual: { label: "Zelf kiezen", hint: "Blijf op één niveau", short: "zelf gekozen" },
    },
    levelLabel: (pairs: number) => `${pairs} paren`,
    levelHint: (cards: number) => `${cards} kaarten`,
    setupSubtitle: "Zoek de Pokémon-paren. De app kan het aantal paren laten meegroeien.",
    modeLegend: "Hoe kies je het niveau?",
    autoStart: (pairs: number) => `Je begint bij ${pairs} paren.`,
    autoExplain:
      "Twee goede paren op een rij en je gaat een stapje verder. Soms is het weer even zoeken; dat hoort erbij.",
    levelLegend: "Aantal paren",
    heading: "Vind alle paren",
    progress: (matched: number, pairs: number, mode: string) =>
      `${matched} van ${pairs} paren · ${mode}`,
    pairs: "paren",
    hint: "Hint",
    challenge: "Uitdaging",
    again: "Opnieuw",
    status: {
      locked: "Nog niet. De kaarten draaien zo terug.",
      found: "Alle Pokémon gevonden!",
      hint: "Kijk naar de kaarten met de gele rand.",
      idle: "Draai twee kaarten om en zoek hetzelfde Pokémon-paar.",
    },
    moves: (moves: number) => `Je deed ${moves} ${moves === 1 ? "poging" : "pogingen"}.`,
    noMoves: "Zoek rustig verder.",
    cardFound: (name: string) => `${name}, gevonden`,
    cardHidden: "Omgedraaide kaart",
  },
  {
    modes: {
      auto: {
        label: "Grows with you",
        hint: "The app picks the number of pairs",
        short: "grows with you",
      },
      manual: { label: "Choose yourself", hint: "Stay on one level", short: "your choice" },
    },
    levelLabel: (pairs: number) => `${pairs} pairs`,
    levelHint: (cards: number) => `${cards} cards`,
    setupSubtitle: "Find the Pokémon pairs. The app can add more pairs as you go.",
    modeLegend: "How do you pick the level?",
    autoStart: (pairs: number) => `You start with ${pairs} pairs.`,
    autoExplain:
      "Do well twice in a row and you go up a step. Sometimes you'll need to search a bit longer; that's part of the game.",
    levelLegend: "Number of pairs",
    heading: "Find all the pairs",
    progress: (matched: number, pairs: number, mode: string) =>
      `${matched} of ${pairs} pairs · ${mode}`,
    pairs: "pairs",
    hint: "Hint",
    challenge: "Challenge",
    again: "Again",
    status: {
      locked: "Not yet. The cards will turn back in a moment.",
      found: "You found all the Pokémon!",
      hint: "Look at the cards with the yellow border.",
      idle: "Turn over two cards and find a matching Pokémon pair.",
    },
    moves: (moves: number) => `Tries so far: ${moves}.`,
    noMoves: "Take your time and keep looking.",
    cardFound: (name: string) => `${name}, found`,
    cardHidden: "Face-down card",
  },
);

export type MemoryTexts = (typeof memoryTexts)["nl"];
