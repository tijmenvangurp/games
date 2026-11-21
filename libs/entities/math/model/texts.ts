import { defineTexts } from "@shared/i18n";
import { MATH_PRAISE_LINES } from "./audio";

/**
 * Getoonde teksten bij de sommen. De gesproken regels in `audio.ts` blijven
 * Nederlands; de Nederlandse bemoedigingen hier komen uit die regels, zodat
 * scherm en stem gelijk blijven.
 */
export const mathTexts = defineTexts(
  {
    modes: {
      plus: { label: "Optellen", hint: "Erbij doen" },
      min: { label: "Aftrekken", hint: "Eraf halen" },
      keer: { label: "Keer", hint: "Groepjes maken" },
      deel: { label: "Delen", hint: "Eerlijk verdelen" },
    },
    levels: { makkelijk: "Makkelijk", gemiddeld: "Gemiddeld", moeilijk: "Moeilijk" },
    rangeHints: { makkelijk: "Tot 10", gemiddeld: "Tot 20", moeilijk: "Tot 100" },
    tableHints: { makkelijk: "Tafels 1–5", gemiddeld: "Tafels 1–10", moeilijk: "Tafels 6–10" },
    countOn: (from: number) => `Tel verder vanaf ${from}.`,
    countBack: (from: number) => `Tel terug vanaf ${from}.`,
    groupsOf: (groups: number, perGroup: number) => `${groups} groepjes van ${perGroup}`,
    thatIs: (groups: string) => `Dat zijn ${groups}.`,
    praise: MATH_PRAISE_LINES.map((line) => line.text),
  },
  {
    modes: {
      plus: { label: "Adding", hint: "Put more in" },
      min: { label: "Taking away", hint: "Take some out" },
      keer: { label: "Times", hint: "Make groups" },
      deel: { label: "Sharing", hint: "Share fairly" },
    },
    levels: { makkelijk: "Easy", gemiddeld: "Medium", moeilijk: "Hard" },
    rangeHints: { makkelijk: "Up to 10", gemiddeld: "Up to 20", moeilijk: "Up to 100" },
    tableHints: {
      makkelijk: "Tables 1–5",
      gemiddeld: "Tables 1–10",
      moeilijk: "Tables 6–10",
    },
    countOn: (from: number) => `Count on from ${from}.`,
    countBack: (from: number) => `Count back from ${from}.`,
    groupsOf: (groups: number, perGroup: number) => `${groups} groups of ${perGroup}`,
    thatIs: (groups: string) => `That's ${groups}.`,
    praise: [
      "Well calculated!",
      "Clever work!",
      "Great job!",
      "Totally right!",
      "Smart thinking!",
      "Well done!",
    ],
  },
);
