import type { Cell } from "@entities/murdoku";
import type { HelpMarks } from "./vendored/helpMarks";

function emptyMarks(): HelpMarks {
  return {
    areas: [],
    ring: new Set<Cell>(),
    rooms: new Set<string>(),
    windows: false,
    doors: false,
    redRing: new Set<Cell>(),
    redRooms: new Set<string>(),
    redWindows: false,
    redDoors: false,
  };
}

/**
 * Voegt één kameromtrek toe aan de bestaande referentiemarkeringen. Gebruikt
 * voor de onthulling: de kamer van het slachtoffer blijft omlijnd, ook als
 * hints later hun eigen markeringen tonen.
 */
export function withRoomOutline(marks: HelpMarks | null, roomId: string | null): HelpMarks | null {
  if (!roomId) return marks;
  const base = marks ?? emptyMarks();
  return { ...base, rooms: new Set([...base.rooms, roomId]) };
}
