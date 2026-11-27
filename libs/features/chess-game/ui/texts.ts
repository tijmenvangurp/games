import { COMPUTER_LEVEL_INFO } from "@entities/chess";
import { defineTexts } from "@shared/i18n";

/** Teksten van de schermen van de schaakpartij. Nederlands is de bron. */
export const chessGameTexts = defineTexts(
  {
    section: "Schaakpartij",
    hintThinking: "Hint…",
    hint: "Hint",
    clearHint: "Wis hint",
    showMove: "Toon zet",
    computerSides: (human: string, computer: string) =>
      `Jij speelt met ${human} · de computer met ${computer}.`,
    friendTurns: "Jullie spelen om de beurt op dit scherm.",
    board:
      "Schaakbord met coördinaten a tot en met h en 1 tot en met 8. Tik op een stuk en daarna op een groene stip, of sleep het stuk.",
    undo: "Ongedaan",
    resign: "Opgeven",
    settings: "Instellingen",
    newOpponent: "Nieuwe tegenstander",

    // Instellingen
    modes: { friend: "Samen spelen", computer: "Computer" },
    levels: {
      makkelijk: COMPUTER_LEVEL_INFO.makkelijk.label,
      middel: COMPUTER_LEVEL_INFO.middel.label,
      moeilijk: COMPUTER_LEVEL_INFO.moeilijk.label,
    },
    computerSuffix: " · computer",
    computer: "Computer",
    nameFor: (side: string) => `Naam voor ${side}`,
    avatarFor: (side: string) => `Kies een avatar voor ${side}`,
    avatar: (avatar: string) => `Avatar ${avatar}`,
    newGame: "Nieuwe partij",
    play: "Spelen",
    setupSubtitle:
      "Kies je tegenstander, een avatar en een naam. Daarna zie je meteen wie aan zet is.",
    saved: "Je partij is bewaard",
    movesOnBoard: (count: number) =>
      count === 1 ? "Er staat 1 zet op het bord." : `Er staan ${count} zetten op het bord.`,
    resume: "Doorgaan",
    opponentLegend: "Tegen wie?",
    levelLegend: "Hoe sterk is de computer?",
    sideLegend: "Met welke kleur speel jij?",

    // Spelerskaart en zettenlijst
    playerCard: (name: string, side: string, active: boolean) =>
      `${name}, speelt met ${side}${active ? ", is aan zet" : ""}`,
    thinking: "Denkt…",
    toMove: "Aan zet",
    moves: (count: number) => `Zetten (${count})`,

    // Promotie
    promotionTitle: "Kies een stuk",
    promotionText: "Je pion is aan de overkant. Wat wordt het?",
    pieces: { q: "Dame", r: "Toren", b: "Loper", n: "Paard" },
    cancel: "Annuleren",
  },
  {
    section: "Chess game",
    hintThinking: "Hint…",
    hint: "Hint",
    clearHint: "Clear hint",
    showMove: "Show move",
    computerSides: (human: string, computer: string) =>
      `You play ${human} · the computer plays ${computer}.`,
    friendTurns: "Take turns on this screen.",
    board:
      "Chessboard with coordinates a to h and 1 to 8. Tap a piece and then a green dot, or drag the piece.",
    undo: "Undo",
    resign: "Give up",
    settings: "Settings",
    newOpponent: "New opponent",

    modes: { friend: "Play together", computer: "Computer" },
    levels: { makkelijk: "Easy", middel: "Medium", moeilijk: "Hard" },
    computerSuffix: " · computer",
    computer: "Computer",
    nameFor: (side: string) => `Name for ${side}`,
    avatarFor: (side: string) => `Choose an avatar for ${side}`,
    avatar: (avatar: string) => `Avatar ${avatar}`,
    newGame: "New game",
    play: "Play",
    setupSubtitle:
      "Choose your opponent, an avatar and a name. Then you'll see right away whose turn it is.",
    saved: "Your game has been saved",
    movesOnBoard: (count: number) =>
      count === 1 ? "There is 1 move on the board." : `There are ${count} moves on the board.`,
    resume: "Continue",
    opponentLegend: "Who are you playing against?",
    levelLegend: "How strong is the computer?",
    sideLegend: "Which colour do you want to play?",

    playerCard: (name: string, side: string, active: boolean) =>
      `${name}, plays ${side}${active ? ", to move" : ""}`,
    thinking: "Thinking…",
    toMove: "Your turn",
    moves: (count: number) => `Moves (${count})`,

    promotionTitle: "Choose a piece",
    promotionText: "Your pawn reached the other side. What should it become?",
    pieces: { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" },
    cancel: "Cancel",
  },
);
