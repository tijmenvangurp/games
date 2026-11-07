import type { CSSProperties } from "react";
import KeyboardReact from "react-simple-keyboard";
import { FINGERS, fingerForKey, HOME_ROW } from "@entities/typepret";
import { FINGER_COLORS } from "../model/finger-colors";

const LAYOUT = {
  default: ["q w e r t y u i o p", "a s d f g h j k l ;", "z x c v b n m ,"],
};

const DISPLAY: Record<string, string> = Object.fromEntries(
  LAYOUT.default.flatMap((row) => row.split(" ")).map((key) => [key, key.toUpperCase()]),
);

const OTHER_KEYS = LAYOUT.default
  .flatMap((row) => row.split(" "))
  .filter((key) => !HOME_ROW.includes(key));

/** Eén CSS-variabele per vinger; de klassen in `index.css` lezen die uit. */
const FINGER_VARS = Object.fromEntries(
  FINGERS.map((finger) => [`--finger-${finger.id}`, FINGER_COLORS[finger.id]]),
) as CSSProperties;

function themesFor(target: string | undefined) {
  const themes = FINGERS.map((finger) => ({
    class: `tp-finger tp-${finger.id}`,
    buttons: HOME_ROW.filter((key) => fingerForKey(key)?.id === finger.id).join(" "),
  }));
  themes.push({ class: "tp-dim", buttons: OTHER_KEYS.join(" ") });
  themes.push({ class: "tp-bump", buttons: "f j" });
  if (target) {
    themes.push({ class: "tp-target", buttons: target });
  }
  return themes;
}

interface KeyboardProps {
  /** Het doelteken dat nu getypt moet worden. */
  target: string | undefined;
  /** Vergroot de aanwijzing na meerdere fouten. */
  emphasize: boolean;
}

/**
 * Toetsenbord op het scherm met `react-simple-keyboard`, alleen als weergave:
 * het neemt geen invoer aan en is voor schermlezers verborgen. De vingeraanwijzing
 * staat als tekst in de speelweergave.
 */
export function Keyboard({ target, emphasize }: KeyboardProps) {
  return (
    <div
      aria-hidden="true"
      className="typepret-keyboard mx-auto w-full max-w-xl"
      data-emphasize={emphasize}
      style={FINGER_VARS}
    >
      <KeyboardReact
        buttonTheme={themesFor(target)}
        disableButtonHold
        display={DISPLAY}
        layout={LAYOUT}
        layoutName="default"
        onKeyPress={() => undefined}
      />
    </div>
  );
}
