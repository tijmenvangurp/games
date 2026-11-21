import { defineTexts } from "@shared/i18n";

/** Teksten voor de status, feedback en uitslag van de schaakpartij. Nederlands is de bron. */
export const presentationTexts = defineTexts(
  {
    side: { w: "Wit", b: "Zwart" },
    /** Namen die de app zelf invult (zie `createDefaultPlayers` en de store). */
    builtInNames: { Wit: "Wit", Zwart: "Zwart", Computer: "Computer" },
    status: {
      checkmate: (name: string) => `${name} wint met schaakmat.`,
      stalemate: "Pat! Er is geen legale zet meer.",
      draw: "Gelijkspel.",
      resigned: (name: string) => `${name} wint: de ander gaf op.`,
      thinking: "De computer denkt na…",
      check: (name: string) => `Schaak! ${name} is aan zet.`,
      turn: (name: string) => `${name} is aan zet.`,
    },
    feedback: {
      illegal: "Die zet mag niet. Kies een groene stip.",
      "not-your-turn": "Dat stuk is niet aan de beurt.",
      "engine-error": "De computer kon geen zet vinden. Probeer het nog eens.",
    },
    result: {
      wins: (name: string) => `${name} wint!`,
      checkmate: "Schaakmat! De koning kan nergens meer heen.",
      resigned: "De partij is gestopt omdat de ander opgaf.",
      stalemateTitle: "Pat!",
      stalemate: "Er is geen legale zet meer. Daarom is het gelijkspel.",
      drawTitle: "Gelijkspel",
      playingTitle: "De partij loopt nog",
      playing: "Er is nog geen winnaar.",
    },
    drawReasons: {
      "fifty-moves": "Er zijn vijftig zetten gedaan zonder slag of pionzet.",
      repetition: "Dezelfde stelling kwam drie keer terug.",
      "insufficient-material": "Er zijn te weinig stukken over om nog schaakmat te zetten.",
      draw: "Geen van beiden kan nog winnen.",
    },
  },
  {
    side: { w: "White", b: "Black" },
    builtInNames: { Wit: "White", Zwart: "Black", Computer: "Computer" },
    status: {
      checkmate: (name: string) => `${name} wins with checkmate.`,
      stalemate: "Stalemate! There are no legal moves left.",
      draw: "It's a draw.",
      resigned: (name: string) => `${name} wins: the other player gave up.`,
      thinking: "The computer is thinking…",
      check: (name: string) => `Check! It's ${name}'s turn.`,
      turn: (name: string) => `It's ${name}'s turn.`,
    },
    feedback: {
      illegal: "That move isn't allowed. Pick a green dot.",
      "not-your-turn": "It's not that piece's turn.",
      "engine-error": "The computer couldn't find a move. Try again.",
    },
    result: {
      wins: (name: string) => `${name} wins!`,
      checkmate: "Checkmate! The king has nowhere left to go.",
      resigned: "The game ended because the other player gave up.",
      stalemateTitle: "Stalemate!",
      stalemate: "There are no legal moves left. That makes it a draw.",
      drawTitle: "Draw",
      playingTitle: "The game is still going",
      playing: "There's no winner yet.",
    },
    drawReasons: {
      "fifty-moves": "Fifty moves were played without a capture or a pawn move.",
      repetition: "The same position came back three times.",
      "insufficient-material": "There aren't enough pieces left to checkmate.",
      draw: "Neither player can win any more.",
    },
  },
);
