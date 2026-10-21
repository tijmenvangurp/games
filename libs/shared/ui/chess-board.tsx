import { Chessboard, type ChessboardOptions } from "react-chessboard";
import { cn } from "@shared/lib";

/**
 * De coördinaten staan buiten het bord: rijnummers links, kolomletters onder.
 * In het bord zou een stuk de letter of het cijfer bedekken.
 *
 * De volgorde volgt de bordstand. Staat het bord omgedraaid (zwart onder),
 * dan lezen de nummers van boven naar beneden 1 tot en met 8 en de letters
 * van links naar rechts h tot en met a, net als op een echt bord.
 */
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
/** Van boven naar beneden bij een bord met wit onder. */
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

interface ChessBoardProps {
  readonly options: ChessboardOptions;
  /** Beschrijving van het bord voor schermlezers. */
  readonly label: string;
  readonly className?: string;
}

export function ChessBoard({ options, label, className }: ChessBoardProps) {
  const flipped = options.boardOrientation === "black";
  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;

  return (
    <div
      aria-label={label}
      className={cn("mx-auto w-full max-w-lg pl-5 pb-5", className)}
      role="group"
    >
      <div className="relative aspect-square w-full touch-manipulation">
        <Chessboard options={options} />
        <div
          className="absolute inset-y-0 -left-5 grid w-5 grid-rows-8 place-items-center text-xs font-bold leading-none text-muted-foreground"
          data-coordinates="ranks"
        >
          {ranks.map((rank) => (
            <span key={rank}>{rank}</span>
          ))}
        </div>
        <div
          className="absolute inset-x-0 -bottom-5 grid h-5 grid-cols-8 place-items-center text-xs font-bold leading-none text-muted-foreground"
          data-coordinates="files"
        >
          {files.map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
