import type { Puzzle } from "@entities/murdoku";
import type { MurdokuClueFocus, MurdokuHintState, MurdokuText } from "@features/murdoku-game";

/**
 * De zaak die de pagina toont: het bord, de tekstlaag en de titel. Eén bundel
 * houdt de bedrading tussen pagina, bord en kaarten kort.
 */
export interface MurdokuCaseView {
  puzzle: Puzzle;
  text: MurdokuText;
  title: string;
  intro: string;
}

/** De hint en de tikbare woorden van één zaak. */
export interface MurdokuHintView {
  /** De hint die nu op het bord staat. */
  hint: MurdokuHintState | null;
  /** De hint als leesbare Nederlandse zin. */
  hintMessage: string | null;
  /** Het woord uit een aanwijzing dat op het bord oplicht. */
  clueFocus: MurdokuClueFocus | null;
  /** Melding bij dat woord, bijvoorbeeld "De keuken licht op." */
  clueMessage: string | null;
  onHint: () => void;
  onFocusWord: (focus: MurdokuClueFocus, label: string) => void;
}
