import {
  AppWindow,
  Armchair,
  BedDouble,
  BookOpen,
  DoorOpen,
  Grid2x2,
  Package,
  Sprout,
  Square,
  Table2,
  Tv,
} from "@shared/ui";
import { cn } from "@shared/lib";

/**
 * Het icoon van een objecttype uit de engine. De legenda, de uitleg en de
 * diagrammen gebruiken hetzelfde beeld, zodat een kind het meubel herkent
 * zonder de naam te hoeven lezen.
 */
export function MurdokuObjectIcon({ type, className }: { type: string; className?: string }) {
  const classes = cn("shrink-0", className);

  switch (type) {
    case "bed":
      return <BedDouble aria-hidden="true" className={classes} />;
    case "chair":
      return <Armchair aria-hidden="true" className={classes} />;
    case "carpet":
      return <Grid2x2 aria-hidden="true" className={classes} />;
    case "table":
      return <Table2 aria-hidden="true" className={classes} />;
    case "plant":
      return <Sprout aria-hidden="true" className={classes} />;
    case "tv":
      return <Tv aria-hidden="true" className={classes} />;
    case "shelf":
      return <BookOpen aria-hidden="true" className={classes} />;
    case "box":
      return <Package aria-hidden="true" className={classes} />;
    case "window":
      return <AppWindow aria-hidden="true" className={classes} />;
    case "door":
      return <DoorOpen aria-hidden="true" className={classes} />;
    default:
      return <Square aria-hidden="true" className={classes} />;
  }
}
