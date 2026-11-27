import { defineTexts } from "@shared/i18n";

export const typepretTexts = defineTexts(
  {
    setupTitle: "Kies je les",
    setupSubtitle: (lessons: number) =>
      `${lessons} lessen · 20 toetsen per ronde. Zet je vingers op de basisrij en tik de letter die oplicht.`,
    setupKeyboard:
      "Sluit een toetsenbord aan om te oefenen. Op een aanraakscherm kun je geen blind typen leren.",
    done: "· afgerond",
    locked: "· nog dicht",
    playKeyboard:
      "Sluit een toetsenbord aan om te oefenen. Blind leren typen kan niet op een aanraakscherm.",
    typeThese: "Typ deze letters",
    tryAgain: "Probeer nog eens: ",
    use: "Gebruik je ",
    clickToContinue: "Klik op het scherm om verder te typen.",
    bumps: "Voel de ribbeltjes op F en J en zet daar je wijsvingers.",
    fingers: {
      "linker-pink": "linker pink",
      "linker-ringvinger": "linker ringvinger",
      "linker-middelvinger": "linker middelvinger",
      "linker-wijsvinger": "linker wijsvinger",
      "rechter-wijsvinger": "rechter wijsvinger",
      "rechter-middelvinger": "rechter middelvinger",
      "rechter-ringvinger": "rechter ringvinger",
      "rechter-pink": "rechter pink",
    },
  },
  {
    setupTitle: "Choose your lesson",
    setupSubtitle: (lessons: number) =>
      `${lessons} lessons · 20 keys per round. Put your fingers on the home row and press the letter that lights up.`,
    setupKeyboard: "Connect a keyboard to practise. You can't learn touch typing on a touchscreen.",
    done: "· done",
    locked: "· still locked",
    playKeyboard: "Connect a keyboard to practise. Touch typing doesn't work on a touchscreen.",
    typeThese: "Type these letters",
    tryAgain: "Try again: ",
    use: "Use your ",
    clickToContinue: "Click on the screen to keep typing.",
    bumps: "Feel the little bumps on F and J and put your index fingers there.",
    fingers: {
      "linker-pink": "left little finger",
      "linker-ringvinger": "left ring finger",
      "linker-middelvinger": "left middle finger",
      "linker-wijsvinger": "left index finger",
      "rechter-wijsvinger": "right index finger",
      "rechter-middelvinger": "right middle finger",
      "rechter-ringvinger": "right ring finger",
      "rechter-pink": "right little finger",
    },
  },
);
