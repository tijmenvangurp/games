import { defineTexts } from "@shared/i18n";

/**
 * Teksten van Letterpret. De letters, klanken, woorden en opnames blijven
 * Nederlands: dit spel leert Nederlandse letterklanken. Alleen de uitleg vertaalt.
 */
export const letterTexts = defineTexts(
  {
    setupTitle: "Kies je les",
    setupSubtitle:
      "10 letters · 6 vragen per les. Hoor de klank en kies de letter, lees woorden of bouw ze zelf.",
    languageNote: "",
    lessons: {
      letters: {
        title: "Letterronde",
        description: "Hoor de klank en kies de letter. Zes korte vragen.",
      },
      woorden: {
        title: "Woordlezen",
        description: "Luister naar een woord en kies het juiste woord. Zes woorden.",
      },
      trein: {
        title: "Woordtrein",
        description: "Bouw het woord met letters. Zes korte woorden.",
      },
      klankplek: {
        title: "Klankplek",
        description: "Waar hoor je de klank? Sleep de letter naar het juiste vakje. Zes woorden.",
      },
      zoemlees: {
        title: "Zoemlees",
        description: "Lees het woord en tik de letters. Hoor hoe het klinkt. Zes woorden.",
      },
    },
    known: (letters: string) => `Deze letters ken je al: ${letters}.`,
    startLetters: "We beginnen met i, k, m, s, p, v, e, n, t en a.",
    parentTipTitle: "Tip voor ouders",
    parentTip:
      "Laat je kind na de ronde een letter op papier schrijven of een gelezen woord aanwijzen in een boek. Dat helpt bij het onthouden.",
    units: {
      letters: "Vraag",
      woorden: "Woord",
      trein: "Woord",
      klankplek: "Klank",
      zoemlees: "Woord",
    },
    progress: (unit: string, current: number, total: number) => `${unit} ${current} van ${total}`,
    listen: "Luister",
    listenAgain: "Luister nog eens",
    listenSound: (letter: string) => `Luister naar de klank ${letter}`,
    listenWord: (word: string) => `Luister naar ${word}`,
    letter: (letter: string) => `Letter ${letter}`,
    word: (word: string) => `Woord ${word}`,
    box: (index: number) => `Vak ${index}`,
    klankPrompt: "Welke letter hoort bij deze klank?",
    chooseLetter: "Kies de letter",
    vangerPrompt: "Welk woord hoor je? Welke letter hoort vooraan?",
    chooseFirstLetter: "Kies de eerste letter",
    jachtPrompt: "Zoek deze letter:",
    findLetter: "Zoek de letter",
    leesPrompt: "Luister en lees. Welk woord hoor je?",
    chooseWord: "Kies het woord",
    plekPrompt: "Waar hoor je deze klank?",
    plekHint: "Sleep de letter naar het juiste vakje, of tik op een vakje.",
    chooseBox: "Kies het vak",
    trainPrompt: "Bouw het woord. Sleep of tik de letters.",
    wordBoxes: "Woordvakken",
    chooseLetters: "Kies letters",
    nextLetter: (letter: string) => `De volgende letter is ${letter}.`,
    zoemPrompt: "Lees het woord. Tik de letters van links naar rechts.",
    readWord: "Lees het woord",
    almost: "Bijna! Probeer nog eens.",
    listenAndChoose: "Luister en kies.",
    done: "Klaar",
    next: "Volgende",
    positions: {
      begin: "vooraan in",
      midden: "in het midden van",
      eind: "achteraan in",
    },
    success: {
      klank: (letter: string) => `Ja! Dit is de ${letter}. Luister nog eens.`,
      vanger: (word: string, letter: string) => `Ja! ${word} begint met de ${letter}.`,
      jacht: (letter: string) => `Ja, dit is de ${letter}.`,
      lees: (word: string) => `Ja! Dit is ${word}.`,
      plek: (letter: string, position: string, word: string) =>
        `Ja! De ${letter} zit ${position} ${word}.`,
      zoem: (word: string) => `Ja! Je las ${word}.`,
      trein: (word: string) => `Goed gebouwd: ${word}.`,
    },
    retry: {
      klank: (letter: string) => `Dit is de ${letter}. Luister nog eens.`,
      vanger: (word: string, letter: string) => `Bijna. ${word} begint met de ${letter}.`,
      jacht: (letter: string) => `Dit is de ${letter}.`,
      lees: (word: string) => `Bijna. Dit woord is ${word}.`,
      plek: (letter: string, position: string, word: string) =>
        `De ${letter} zit ${position} ${word}.`,
      zoem: (word: string) => `Het woord is ${word}.`,
      trein: (word: string) => `Het woord is ${word}.`,
    },
  },
  {
    setupTitle: "Choose your lesson",
    setupSubtitle:
      "10 letters · 6 questions per lesson. Hear the sound and choose the letter, read words or build them yourself.",
    languageNote: "Letter sounds and words are in Dutch.",
    lessons: {
      letters: {
        title: "Letter Round",
        description: "Hear the sound and choose the letter. Six short questions.",
      },
      woorden: {
        title: "Word Reading",
        description: "Listen to a word and choose the right word. Six words.",
      },
      trein: {
        title: "Word Train",
        description: "Build the word with letters. Six short words.",
      },
      klankplek: {
        title: "Sound Spot",
        description: "Where do you hear the sound? Drag the letter to the right box. Six words.",
      },
      zoemlees: {
        title: "Blend & Read",
        description: "Read the word and tap the letters. Hear how it sounds. Six words.",
      },
    },
    known: (letters: string) => `You already know these letters: ${letters}.`,
    startLetters: "We start with i, k, m, s, p, v, e, n, t and a.",
    parentTipTitle: "Tip for parents",
    parentTip:
      "After the round, let your child write a letter on paper or point to a word they read in a book. That helps them remember.",
    units: {
      letters: "Question",
      woorden: "Word",
      trein: "Word",
      klankplek: "Sound",
      zoemlees: "Word",
    },
    progress: (unit: string, current: number, total: number) => `${unit} ${current} of ${total}`,
    listen: "Listen",
    listenAgain: "Listen again",
    listenSound: (letter: string) => `Listen to the sound ${letter}`,
    listenWord: (word: string) => `Listen to ${word}`,
    letter: (letter: string) => `Letter ${letter}`,
    word: (word: string) => `Word ${word}`,
    box: (index: number) => `Box ${index}`,
    klankPrompt: "Which letter goes with this sound?",
    chooseLetter: "Choose the letter",
    vangerPrompt: "Which word do you hear? Which letter comes first?",
    chooseFirstLetter: "Choose the first letter",
    jachtPrompt: "Find this letter:",
    findLetter: "Find the letter",
    leesPrompt: "Listen and read. Which word do you hear?",
    chooseWord: "Choose the word",
    plekPrompt: "Where do you hear this sound?",
    plekHint: "Drag the letter to the right box, or tap a box.",
    chooseBox: "Choose the box",
    trainPrompt: "Build the word. Drag or tap the letters.",
    wordBoxes: "Word boxes",
    chooseLetters: "Choose letters",
    nextLetter: (letter: string) => `The next letter is ${letter}.`,
    zoemPrompt: "Read the word. Tap the letters from left to right.",
    readWord: "Read the word",
    almost: "Almost! Try again.",
    listenAndChoose: "Listen and choose.",
    done: "Done",
    next: "Next",
    positions: {
      begin: "at the start of",
      midden: "in the middle of",
      eind: "at the end of",
    },
    success: {
      klank: (letter: string) => `Yes! This is the ${letter}. Listen again.`,
      vanger: (word: string, letter: string) => `Yes! ${word} starts with the ${letter}.`,
      jacht: (letter: string) => `Yes, this is the ${letter}.`,
      lees: (word: string) => `Yes! This is ${word}.`,
      plek: (letter: string, position: string, word: string) =>
        `Yes! The ${letter} is ${position} ${word}.`,
      zoem: (word: string) => `Yes! You read ${word}.`,
      trein: (word: string) => `Well built: ${word}.`,
    },
    retry: {
      klank: (letter: string) => `This is the ${letter}. Listen again.`,
      vanger: (word: string, letter: string) => `Almost. ${word} starts with the ${letter}.`,
      jacht: (letter: string) => `This is the ${letter}.`,
      lees: (word: string) => `Almost. This word is ${word}.`,
      plek: (letter: string, position: string, word: string) =>
        `The ${letter} is ${position} ${word}.`,
      zoem: (word: string) => `The word is ${word}.`,
      trein: (word: string) => `The word is ${word}.`,
    },
  },
);

export type LetterTexts = (typeof letterTexts)["nl"];
