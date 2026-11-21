import { defineTexts } from "@shared/i18n";

export const mathTrainerTexts = defineTexts(
  {
    setup: {
      best: (score: number) => `Beste score: ${score} van 10 sterren`,
      noScore: "Nog geen score",
      mode: "Soort som",
      level: "Niveau",
    },
    progress: (current: number, total: number) => `Som ${current} van ${total}`,
    chooseLabel: "Kies het juiste antwoord",
    answer: (choice: number) => `Antwoord ${choice}`,
    choose: "Kies het juiste antwoord.",
    almost: "Bijna! Probeer nog één keer.",
    correctAnswer: (answer: number) => `Het juiste antwoord is ${answer}.`,
    listenAnswer: "Beluister het antwoord",
    listenQuestion: "Beluister de som",
    next: "Volgende",
    done: "Klaar",
    numberLine: (max: number, from: number, to: number) =>
      `Getallenlijn van 0 tot ${max}. ${from} naar ${to}.`,
    dots: (groups: number, perGroup: number) => `${groups} groepjes van ${perGroup} stippen`,
  },
  {
    setup: {
      best: (score: number) => `Best score: ${score} out of 10 stars`,
      noScore: "No score yet",
      mode: "Kind of sum",
      level: "Level",
    },
    progress: (current: number, total: number) => `Sum ${current} of ${total}`,
    chooseLabel: "Choose the right answer",
    answer: (choice: number) => `Answer ${choice}`,
    choose: "Choose the right answer.",
    almost: "Almost! Try one more time.",
    correctAnswer: (answer: number) => `The right answer is ${answer}.`,
    listenAnswer: "Listen to the answer",
    listenQuestion: "Listen to the sum",
    next: "Next",
    done: "Done",
    numberLine: (max: number, from: number, to: number) =>
      `Number line from 0 to ${max}. ${from} to ${to}.`,
    dots: (groups: number, perGroup: number) => `${groups} groups of ${perGroup} dots`,
  },
);
