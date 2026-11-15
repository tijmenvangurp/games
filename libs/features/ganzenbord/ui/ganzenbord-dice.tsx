import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import ReactDiceImport, { type ReactDiceRef } from "react-dice-complete";
import type { Dice } from "@entities/ganzenbord";

type DiceComponent = typeof ReactDiceImport;

/**
 * De package is een UMD/CJS-bundel. Vite levert hem in productie soms als
 * `{ default: { default: component } }`; deze helper pakt de echte component.
 */
function resolveDiceComponent(value: unknown): DiceComponent {
  let candidate = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (
      typeof candidate === "function" ||
      (candidate !== null && typeof candidate === "object" && "$$typeof" in candidate)
    ) {
      return candidate as DiceComponent;
    }
    if (candidate && typeof candidate === "object" && "default" in candidate) {
      candidate = (candidate as { default: unknown }).default;
      continue;
    }
    break;
  }
  throw new Error("react-dice-complete kon niet worden geladen");
}

const ReactDice = resolveDiceComponent(ReactDiceImport);

export interface GanzenbordDiceHandle {
  roll: (dice: Dice) => void;
}

interface GanzenbordDiceProps {
  onDone: (values: number[]) => void;
}

/**
 * Twee witte dobbelstenen met groene stippen, passend bij de houten kaart.
 * De uitkomst komt van buiten (de store), zodat het spel deterministisch en
 * testbaar blijft.
 */
export const GanzenbordDice = forwardRef<GanzenbordDiceHandle, GanzenbordDiceProps>(
  function GanzenbordDice({ onDone }, ref) {
    const diceRef = useRef<ReactDiceRef>(null);
    const handleRollDone = useCallback(
      (_total: number, values: number[]) => onDone(values),
      [onDone],
    );

    useImperativeHandle(
      ref,
      () => ({
        roll: (dice) => {
          diceRef.current?.rollAll([...dice]);
        },
      }),
      [],
    );

    return (
      <div aria-hidden="true" className="flex min-h-16 items-center justify-center">
        <ReactDice
          ref={diceRef}
          defaultRoll={1}
          dieSize={52}
          disableIndividual
          dotColor="#2f7d32"
          faceColor="#fffdf2"
          margin={9}
          numDice={2}
          outline
          outlineColor="#c9b78f"
          rollDone={handleRollDone}
          rollTime={0.7}
        />
      </div>
    );
  },
);
