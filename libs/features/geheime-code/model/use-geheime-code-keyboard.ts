import { useHotkeys } from "react-hotkeys-hook";
import { useGeheimeCodeStore } from "./use-geheime-code-store";

function isTypingKey(event: KeyboardEvent): boolean {
  return (
    !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat && event.key.length === 1
  );
}

/** Fysiek toetsenbord als extra invoer; de on-screen keys blijven de basis. */
export function useGeheimeCodeKeyboard(): void {
  useHotkeys(
    "*",
    (event) => {
      if (!isTypingKey(event)) {
        return;
      }
      useGeheimeCodeStore.getState().typeLetter(event.key);
    },
    { useKey: true, keydown: true, preventDefault: isTypingKey },
  );
  useHotkeys(
    "backspace",
    (event) => {
      event.preventDefault();
      useGeheimeCodeStore.getState().clearCell();
    },
    { keydown: true, preventDefault: true },
  );
}
