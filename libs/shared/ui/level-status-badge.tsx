import { Check, Lock } from "./icons";

interface LevelStatusBadgeProps {
  locked: boolean;
  completed: boolean;
}

/** Het slotje of vinkje in de hoek van een levelknop; een open level krijgt niets. */
export function LevelStatusBadge({ locked, completed }: LevelStatusBadgeProps) {
  return (
    <span className="absolute right-2 top-2">
      {locked ? (
        <Lock aria-hidden="true" className="size-4" />
      ) : completed ? (
        <span className="grid size-5 place-items-center rounded-full bg-success text-white">
          <Check aria-hidden="true" className="size-3" />
        </span>
      ) : null}
    </span>
  );
}
