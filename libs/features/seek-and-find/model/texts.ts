import { defineTexts } from "@shared/i18n";

export const seekTexts = defineTexts(
  {
    setup: {
      difficulty: "Moeilijkheid",
      theme: "Waar zoek je?",
      difficulties: { makkelijk: "Makkelijk", gemiddeld: "Gemiddeld", moeilijk: "Moeilijk" },
      themes: {
        tuin: { label: "Tuin", hint: "Bloemen en blaadjes" },
        onderwater: { label: "Onder water", hint: "Bubbels en schelpen" },
      },
    },
    found: "Gevonden!",
    notYet: "Nog niet — kijk goed naar de ster.",
    targetLabel: "Doel: de Wobbel met een ster op de hoed",
    lookFor: "Zoek deze",
    target: "Wobbel met de ster",
    hint: "Hint",
    newScene: "Nieuw zoekveld",
    sceneLabel: "Zoek de Wobbel met de ster tussen alle andere Wobbels",
    creature: (number: number) => `Wobbel ${number}`,
  },
  {
    setup: {
      difficulty: "Difficulty",
      theme: "Where will you look?",
      difficulties: { makkelijk: "Easy", gemiddeld: "Medium", moeilijk: "Hard" },
      themes: {
        tuin: { label: "Garden", hint: "Flowers and leaves" },
        onderwater: { label: "Under water", hint: "Bubbles and shells" },
      },
    },
    found: "Found it!",
    notYet: "Not yet — look closely at the star.",
    targetLabel: "Goal: the Wobbel with a star on its hat",
    lookFor: "Look for this one",
    target: "Wobbel with the star",
    hint: "Hint",
    newScene: "New search scene",
    sceneLabel: "Find the Wobbel with the star among all the other Wobbels",
    creature: (number: number) => `Wobbel ${number}`,
  },
);
