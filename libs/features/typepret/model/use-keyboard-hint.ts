import { useEffect, useState } from "react";

/**
 * Toont een melding op apparaten zonder fysiek toetsenbord: een aanraakscherm
 * (`pointer: coarse`) waarop nog geen toets is ingedrukt.
 */
export function useNeedsKeyboard(): boolean {
  const [coarse, setCoarse] = useState(false);
  const [keySeen, setKeySeen] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onKey = () => setKeySeen(true);
    window.addEventListener("keydown", onKey, { once: true });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return coarse && !keySeen;
}
