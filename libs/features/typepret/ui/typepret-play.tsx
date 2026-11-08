import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { currentTarget, fingerForKey, needsHint } from "@entities/typepret";
import { cn } from "@shared/lib";
import { useNeedsKeyboard } from "../model/use-keyboard-hint";
import { FINGER_COLORS } from "../model/finger-colors";
import { useTypepretStore } from "../model/use-typepret-store";
import { Keyboard } from "./keyboard";

function isTypingKey(event: KeyboardEvent): boolean {
  return (
    !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat && event.key.length === 1
  );
}

function useWindowFocus(): boolean {
  const [focused, setFocused] = useState(true);
  useEffect(() => {
    const on = () => setFocused(true);
    const off = () => setFocused(false);
    window.addEventListener("focus", on);
    window.addEventListener("blur", off);
    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("blur", off);
    };
  }, []);
  return focused;
}

export function TypepretPlay() {
  const round = useTypepretStore((state) => state.round);
  const needsKeyboard = useNeedsKeyboard();
  const focused = useWindowFocus();

  // Elke losse toets, op de getypte letter (`useKey`). Ctrl, Cmd, Alt en herhaalde
  // toetsen tellen niet mee; losse tekens blokkeren we, zodat ' of / geen snelzoekbalk opent.
  useHotkeys(
    "*",
    (event) => {
      if (!isTypingKey(event)) {
        return;
      }
      useTypepretStore.getState().press(event.key);
    },
    { useKey: true, keydown: true, preventDefault: isTypingKey },
  );

  if (!round) {
    return null;
  }

  const target = currentTarget(round);
  const finger = target ? fingerForKey(target) : undefined;
  const hint = needsHint(round);
  const wrong = round.mistakesOnTarget > 0;
  let offset = 0;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {needsKeyboard ? (
        <p className="game-panel p-3 text-center text-sm font-semibold" role="status">
          Sluit een toetsenbord aan om te oefenen. Blind leren typen kan niet op een aanraakscherm.
        </p>
      ) : null}

      <div
        aria-label="Typ deze letters"
        className="game-panel flex flex-wrap justify-center gap-x-5 gap-y-3 p-4 sm:p-6"
        role="group"
      >
        {round.round.groups.map((group, groupIndex) => {
          const start = offset;
          offset += group.length;
          return (
            <span
              key={`${group}-${groupIndex}`}
              className="flex gap-1 font-mono text-3xl font-black tracking-wide sm:text-4xl"
            >
              {[...group].map((letter, letterIndex) => {
                const position = start + letterIndex;
                const done = position < round.index;
                const active = position === round.index;
                return (
                  <span
                    key={position}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-lg border-2 border-transparent",
                      done && "text-muted-foreground/60",
                      active && "border-foreground bg-primary/15",
                      active && wrong && "border-dashed bg-amber-100",
                    )}
                  >
                    {letter === ";" ? ";" : letter.toUpperCase()}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>

      <div
        aria-live="polite"
        className={cn(
          "game-panel flex items-center justify-center gap-3 p-3 text-center",
          hint ? "text-xl font-black" : "text-base font-bold",
        )}
      >
        {finger ? (
          <>
            <span
              aria-hidden="true"
              className="size-5 shrink-0 rounded-full border-2 border-foreground"
              style={{ backgroundColor: FINGER_COLORS[finger.id] }}
            />
            <span>
              {wrong ? "Probeer nog eens: " : "Gebruik je "}
              {finger.label}
            </span>
          </>
        ) : null}
      </div>

      <Keyboard emphasize={hint} target={target} />

      {!focused ? (
        <p className="text-center text-sm font-semibold text-muted-foreground" role="status">
          Klik op het scherm om verder te typen.
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Voel de ribbeltjes op F en J en zet daar je wijsvingers.
        </p>
      )}
    </section>
  );
}
