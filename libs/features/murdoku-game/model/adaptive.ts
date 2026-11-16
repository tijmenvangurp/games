import {
  clampLevelIndex,
  type AdaptiveConfig,
  type AdaptiveState,
  type Attempt,
  type RoundSummary,
} from "@entities/adaptive";
import { MURDOKU_LADDER } from "@entities/murdoku";

/**
 * De adaptieve regelaar van Wie was het?.
 *
 * Eén zaak is één ronde, zoals ADR 0026 voorschrijft. Een losse foutplaatsing
 * is geen ronde-uitkomst en telt daarom niet mee: pas als de zaak klaar is of
 * het kind halverwege stopt, beweegt het niveau. Zo demoteert een puzzel van
 * tien minuten niet door één ongelukkige tik.
 */
export const MURDOKU_ADAPTIVE_CONFIG: AdaptiveConfig = {
  levelCount: MURDOKU_LADDER.length,
  startIndex: 0,
  maxStepsPerRound: 1,
};

/** Wat één afgeronde of gestopte zaak aan de regelaar vertelt. */
export interface MurdokuRoundInput {
  /** De id van de zaak; de logregel bewaart hem als item. */
  readonly caseId: string;
  readonly solved: boolean;
  /** Het kind stopte voordat de zaak klaar was. */
  readonly abandoned: boolean;
  readonly hints: number;
  readonly durationMs: number;
  /** Epoch milliseconds. */
  readonly at: number;
}

export interface MurdokuRoundOutcome {
  /** De lokale logregel; `ok` is alleen waar bij een opgeloste zaak. */
  readonly attempt: Attempt;
  /** De nieuwe stand en het toegepaste verschil. */
  readonly summary: RoundSummary;
}

function wholeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * De richting van één ronde:
 * - opgelost met hooguit één hint: één stap omhoog;
 * - opgelost met twee hints: blijven staan;
 * - opgelost met drie of meer hints, of halverwege gestopt: één stap omlaag.
 */
function roundDelta(input: MurdokuRoundInput): number {
  if (input.solved) {
    if (input.hints <= 1) return 1;
    return input.hints >= 3 ? -1 : 0;
  }
  return input.abandoned ? -1 : 0;
}

/**
 * Waarom een ronde omlaag gaat, is een cluster van signalen (ADR 0026), geen
 * enkele fout. `stuck` markeert daarom alleen de demotie, niet elke ronde
 * waarin iets misging.
 */
export function evaluateMurdokuRound(
  state: AdaptiveState,
  input: MurdokuRoundInput,
): MurdokuRoundOutcome {
  const hints = wholeCount(input.hints);
  const start = clampLevelIndex(state.levelIndex, MURDOKU_LADDER.length);
  const wanted = roundDelta({ ...input, hints });
  const levelIndex = clampLevelIndex(start + wanted, MURDOKU_LADDER.length);
  const delta = levelIndex - start;

  return {
    attempt: {
      itemId: input.caseId,
      ok: input.solved,
      at: input.at,
      durationMs: wholeCount(input.durationMs),
      hints,
    },
    summary: {
      state: { levelIndex, streak: 0 },
      delta,
      accuracy: input.solved ? 1 : 0,
      stuck: wanted < 0,
    },
  };
}

/** De zaak die bij het huidige niveau hoort; buiten de lijst wordt hij geklemd. */
export function murdokuCaseForLevel(levelIndex: number) {
  return MURDOKU_LADDER[clampLevelIndex(levelIndex, MURDOKU_LADDER.length)];
}
