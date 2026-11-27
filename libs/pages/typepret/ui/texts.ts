import { defineTexts } from "@shared/i18n";

export const typepretPageTexts = defineTexts(
  {
    title: "Typepret",
    subtitle: "Leer blind typen",
    lessonSubtitle: (lesson: string, keys: number) => `${lesson} · ${keys} toetsen`,
    again: "Nog een ronde",
    choose: "Andere les",
    verdicts: {
      ontgrendeld: {
        title: "Goed geoefend!",
        description: "Je typte rustig en netjes. De volgende les staat open.",
      },
      bijna: {
        title: "Bijna!",
        description: "Je bent dichtbij. Nog een keer oefenen en dan lukt het nog beter.",
      },
      nogmaals: {
        title: "Nog een keer oefenen",
        description: "Typ rustig en kijk niet naar je vingers. Elke ronde wordt makkelijker.",
      },
    },
  },
  {
    title: "Typing Fun",
    subtitle: "Learn to touch type",
    lessonSubtitle: (lesson: string, keys: number) => `${lesson} · ${keys} keys`,
    again: "Another round",
    choose: "Other lesson",
    verdicts: {
      ontgrendeld: {
        title: "Well practised!",
        description: "You typed calmly and neatly. The next lesson is open.",
      },
      bijna: {
        title: "Almost!",
        description: "You're very close. Practise once more and it will go even better.",
      },
      nogmaals: {
        title: "Practise once more",
        description: "Type calmly and don't look at your fingers. Every round gets easier.",
      },
    },
  },
);
