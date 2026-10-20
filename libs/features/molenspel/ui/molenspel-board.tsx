import {
  MOLENSPEL_LINES,
  MOLENSPEL_POINTS,
  isInMill,
  legalMoves,
  millsOf,
  type MolenspelGame,
  type MolenspelPlayer,
  type MolenspelPoint,
} from "@entities/molenspel";
import { cn } from "@shared/lib";

/**
 * Het bord staat op een raster van 0 tot 6. Rondom blijft een halve eenheid
 * marge, zodat stenen op de hoekpunten binnen het bord blijven.
 */
const BOARD_VIEWBOX = "-0.75 -0.75 7.5 7.5";
const BOARD_SIZE = 7.24;
const BOARD_INSET = -0.62;

const STONE_FILL: Readonly<Record<MolenspelPlayer, string>> = {
  wit: "#fffdf5",
  zwart: "#3f3f46",
};

const STONE_STROKE: Readonly<Record<MolenspelPlayer, string>> = {
  wit: "#b45309",
  zwart: "#18181b",
};

interface MolenspelBoardProps {
  game: MolenspelGame;
  /** De stenen die verwijderd mogen worden, als de speler een molentje maakte. */
  removable: readonly number[];
  onTap: (point: number) => void;
}

interface MolenspelPointProps {
  game: MolenspelGame;
  point: MolenspelPoint;
  isTarget: boolean;
  isRemovable: boolean;
  onTap: (point: number) => void;
}

function labelFor(game: MolenspelGame, point: number): string {
  const piece = game.board[point];
  if (piece === null) {
    return "Leeg punt";
  }
  const name = piece === "wit" ? "wit" : "zwart";
  if (game.awaitRemoval && piece !== game.turn) {
    return `Steen van ${name}, tik om weg te nemen`;
  }
  if (piece === game.turn) {
    return `Eigen steen (${name}), tik om te kiezen`;
  }
  return `Steen van ${name}`;
}

/** De steen op een punt. */
function MolenspelStone({
  point,
  piece,
  isSelected,
  isRemovable,
}: {
  point: MolenspelPoint;
  piece: MolenspelPlayer;
  isSelected: boolean;
  isRemovable: boolean;
}) {
  return (
    <g>
      <circle
        cx={point.col}
        cy={point.row}
        fill={STONE_FILL[piece]}
        r="0.26"
        stroke={STONE_STROKE[piece]}
        strokeWidth="0.035"
      />
      {/* Klein lichtpuntje zodat de steen niet plat oogt. */}
      <circle
        cx={point.col - 0.08}
        cy={point.row - 0.09}
        fill={piece === "wit" ? "#ffffff" : "#71717a"}
        opacity={0.7}
        r="0.06"
      />
      {isSelected || isRemovable ? (
        <circle
          className={isSelected ? "stroke-emerald-500" : "stroke-rose-500"}
          cx={point.col}
          cy={point.row}
          fill="none"
          r="0.34"
          strokeWidth="0.045"
        />
      ) : null}
    </g>
  );
}

/** De puntstip, het doelpunt en de focusring van een punt. */
function MolenspelPointBase({
  point,
  piece,
  isTarget,
}: {
  point: MolenspelPoint;
  piece: MolenspelPlayer | null;
  isTarget: boolean;
}) {
  if (isTarget && !piece) {
    return <circle className="fill-emerald-500" cx={point.col} cy={point.row} r="0.11" />;
  }
  return (
    <circle
      className="fill-amber-900/35"
      cx={point.col}
      cy={point.row}
      r={piece ? "0.1" : "0.085"}
    />
  );
}

/** Eén punt van het bord: de puntstip, de steen en de treftarget. */
function MolenspelPointView({ game, point, isTarget, isRemovable, onTap }: MolenspelPointProps) {
  const piece = game.board[point.id];
  const isSelected = game.selected === point.id;
  const inMill = piece ? isInMill(game.board, piece, point.id) : false;

  return (
    <g
      aria-label={`${labelFor(game, point.id)} (vak ${point.col + 1}, ${point.row + 1})`}
      className={cn("molenspel-point", isTarget && !piece && "molenspel-point--target")}
      onClick={() => onTap(point.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onTap(point.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <circle
        className="molenspel-point-focus"
        cx={point.col}
        cy={point.row}
        fill="none"
        r="0.42"
        strokeWidth="0.05"
      />
      <MolenspelPointBase isTarget={isTarget} piece={piece} point={point} />
      {piece ? (
        <MolenspelStone
          isRemovable={isRemovable}
          isSelected={isSelected}
          piece={piece}
          point={point}
        />
      ) : null}
      {inMill && piece ? (
        <circle
          className="fill-none stroke-amber-500"
          cx={point.col}
          cy={point.row}
          r="0.2"
          strokeWidth="0.025"
        />
      ) : null}
      {/* Onzichtbaar, maar groot genoeg om met de vinger te raken. */}
      <circle
        className="molenspel-point-hit"
        cx={point.col}
        cy={point.row}
        fill="transparent"
        r="0.45"
      />
    </g>
  );
}

/** De lijnen van het bord. */
function MolenspelLines() {
  return (
    <g>
      {MOLENSPEL_LINES.map((line) => {
        const positions = line.points.map((point) => {
          const position = MOLENSPEL_POINTS[point];
          return `${position?.col ?? 0},${position?.row ?? 0}`;
        });
        // Een polyline sluit zichzelf niet; een vierkant moet terug naar het begin.
        const points = line.closed ? [...positions, positions[0]].join(" ") : positions.join(" ");
        return (
          <polyline
            key={points}
            className="fill-none stroke-amber-800/90"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="0.07"
          />
        );
      })}
    </g>
  );
}

/** Een lijn door de drie stenen van een gesloten molentje. */
function MolenspelMillLines({ game }: { game: MolenspelGame }) {
  const mills = [...millsOf(game.board, "wit"), ...millsOf(game.board, "zwart")];
  return (
    <g>
      {mills.map((mill) => {
        const first = MOLENSPEL_POINTS[mill[0] as number];
        const last = MOLENSPEL_POINTS[mill[mill.length - 1] as number];
        if (!first || !last) {
          return null;
        }
        return (
          <line
            key={mill.join("-")}
            className="stroke-amber-400/60"
            strokeLinecap="round"
            strokeWidth="0.2"
            x1={first.col}
            x2={last.col}
            y1={first.row}
            y2={last.row}
          />
        );
      })}
    </g>
  );
}

export function MolenspelBoard({ game, removable, onTap }: MolenspelBoardProps) {
  const targets = legalMoves(game, game.turn);
  const openTargets = new Set<number>();
  for (const list of targets.values()) {
    for (const target of list) {
      openTargets.add(target);
    }
  }
  const removableSet = new Set(removable);

  return (
    <svg
      aria-label="Molenspelbord"
      className="molenspel-board h-auto w-full select-none"
      role="group"
      viewBox={BOARD_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        className="fill-amber-50"
        height={BOARD_SIZE}
        rx="0.45"
        width={BOARD_SIZE}
        x={BOARD_INSET}
        y={BOARD_INSET}
      />
      <MolenspelMillLines game={game} />
      <MolenspelLines />
      {MOLENSPEL_POINTS.map((point) => (
        <MolenspelPointView
          key={point.id}
          game={game}
          isRemovable={game.awaitRemoval && removableSet.has(point.id)}
          isTarget={openTargets.has(point.id)}
          point={point}
          onTap={onTap}
        />
      ))}
    </svg>
  );
}
