import { defineTexts } from "@shared/i18n";

export const lettersPageTexts = defineTexts(
  {
    title: "Letterpret",
    setupSubtitle: "Hoor de klank en kies de letter",
    subtitles: {
      letters: "Letterronde · 6 vragen",
      woorden: "Woordlezen · 6 woorden",
      trein: "Woordtrein · 6 woorden",
      klankplek: "Klankplek · 6 woorden",
      zoemlees: "Zoemlees · 6 woorden",
    },
    celebrations: {
      woorden: {
        title: "Knap gelezen!",
        description: "Je las zes woorden. Probeer het nog eens met andere woorden.",
      },
      trein: {
        title: "Knap gebouwd!",
        description: "Je bouwde zes woorden. Probeer het nog eens met andere woorden.",
      },
      klankplek: {
        title: "Knap geluisterd!",
        description: "Je hoorde waar de klank zat. Probeer het nog eens met andere woorden.",
      },
      zoemlees: {
        title: "Knap gelezen!",
        description: "Je las zes woorden door de letters te verbinden.",
      },
    },
    practisedTitle: "Knap geoefend!",
    known: (letters: string) => `Deze letters ken je al: ${letters}.`,
    practised: "Je oefende met de letters. Ze komen later terug.",
    again: "Nog een ronde",
    choose: "Naar de uitleg",
  },
  {
    title: "Letter Fun",
    setupSubtitle: "Hear the sound and choose the letter",
    subtitles: {
      letters: "Letter Round · 6 questions",
      woorden: "Word Reading · 6 words",
      trein: "Word Train · 6 words",
      klankplek: "Sound Spot · 6 words",
      zoemlees: "Blend & Read · 6 words",
    },
    celebrations: {
      woorden: {
        title: "Great reading!",
        description: "You read six words. Try again with different words.",
      },
      trein: {
        title: "Great building!",
        description: "You built six words. Try again with different words.",
      },
      klankplek: {
        title: "Great listening!",
        description: "You heard where the sound was. Try again with different words.",
      },
      zoemlees: {
        title: "Great reading!",
        description: "You read six words by joining the letters together.",
      },
    },
    practisedTitle: "Great practising!",
    known: (letters: string) => `You already know these letters: ${letters}.`,
    practised: "You practised the letters. They will come back later.",
    again: "Another round",
    choose: "Back to the lessons",
  },
);
