import type { Finger, FingerId } from "./types";

export const FINGERS: readonly Finger[] = [
  { id: "linker-pink", label: "linker pink", hand: "links" },
  { id: "linker-ringvinger", label: "linker ringvinger", hand: "links" },
  { id: "linker-middelvinger", label: "linker middelvinger", hand: "links" },
  { id: "linker-wijsvinger", label: "linker wijsvinger", hand: "links" },
  { id: "rechter-wijsvinger", label: "rechter wijsvinger", hand: "rechts" },
  { id: "rechter-middelvinger", label: "rechter middelvinger", hand: "rechts" },
  { id: "rechter-ringvinger", label: "rechter ringvinger", hand: "rechts" },
  { id: "rechter-pink", label: "rechter pink", hand: "rechts" },
];

const FINGER_BY_ID: Readonly<Record<FingerId, Finger>> = Object.fromEntries(
  FINGERS.map((finger) => [finger.id, finger]),
) as Record<FingerId, Finger>;

/** Basisrij in de QWERTY-grondhouding: vingers op A S D F en J K L ;. */
export const HOME_ROW: readonly string[] = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"];

const KEY_FINGER: Readonly<Record<string, FingerId>> = {
  a: "linker-pink",
  s: "linker-ringvinger",
  d: "linker-middelvinger",
  f: "linker-wijsvinger",
  g: "linker-wijsvinger",
  h: "rechter-wijsvinger",
  j: "rechter-wijsvinger",
  k: "rechter-middelvinger",
  l: "rechter-ringvinger",
  ";": "rechter-pink",
};

export function fingerForKey(key: string): Finger | undefined {
  const id = KEY_FINGER[key];
  return id ? FINGER_BY_ID[id] : undefined;
}
