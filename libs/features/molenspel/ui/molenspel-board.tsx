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

const STONE_FILL: Readonly<Record<MolenspelPlayer, string>> = {
  wit: "#fffdf5",
  zwart: "#3f3f46",
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
  if (game.awaitRemoval) {
    return `Steen van ${piece}, tik om weg te nemen`;
  }
  if (piece === game.turn) {
    return `Eigen steen (${piece}), tik om te kiezen`;
  }
  return `Steen van ${piece}`;
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
    <circle
      className={cn(
        "stroke-amber-900/60",
        isSelected && "stroke-emerald-500",
        isRemovable && "stroke-rose-500",
      )}
      cx={point.col}
      cy={point.row}
      fill={STONE_FILL[piece]}
      r="0.33"
      strokeWidth={isSelected || isRemovable ? "0.08" : "0.045"}
    />
  );
}

/** De markeringen rond een punt: doelpunt, molentje en selectie. */
function MolenspelPointMarks({
  point,
  isTarget,
  isSelected,
  inMill,
}: {
  point: MolenspelPoint;
  isTarget: boolean;
  isSelected: boolean;
  inMill: boolean;
}) {
  return (
    <g>
      {isTarget ? (
        <circle className="fill-emerald-400/70" cx={point.col} cy={point.row} r="0.16" />
      ) : null}
      {inMill ? (
        <circle
          className="fill-none stroke-amber-500/80"
          cx={point.col}
          cy={point.row}
          r="0.26"
          strokeWidth="0.03"
        />
      ) : null}
      {isSelected ? (
        <circle
          className="fill-none stroke-emerald-500"
          cx={point.col}
          cy={point.row}
          r="0.45"
          strokeWidth="0.05"
        />
      ) : null}
    </g>
  );
}

/** Eén punt van het bord: de steen, de markering en de treftarget. */
function MolenspelPointView({ game, point, isTarget, isRemovable, onTap }: MolenspelPointProps) {
  const piece = game.board[point.id];
  const isSelected = game.selected === point.id;
  const inMill = piece ? isInMill(game.board, piece, point.id) : false;

  return (
    <g>
      <circle
        className="fill-white stroke-amber-700/70"
        cx={point.col}
        cy={point.row}
        r="0.2"
        strokeWidth="0.045"
      />
      {piece ? (
        <MolenspelStone
          isRemovable={isRemovable}
          isSelected={isSelected}
          piece={piece}
          point={point}
        />
      ) : null}
      <MolenspelPointMarks
        inMill={inMill}
        isSelected={isSelected}
        isTarget={isTarget}
        point={point}
      />
      <circle
        className="fill-transparent cursor-pointer"
        cx={point.col}
        cy={point.row}
        onClick={() => onTap(point.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onTap(point.id);
          }
        }}
        role="button"
        r="0.45"
        tabIndex={0}
        aria-label={`${labelFor(game, point.id)} (vak ${point.col + 1}, ${point.row + 1})`}
      />
    </g>
  );
}

/** De lijnen van het bord. */
function MolenspelLines() {
  return (
    <g>
      {MOLENSPEL_LINES.map((line) => {
        const points = line.points
          .map((point) => {
            const position = MOLENSPEL_POINTS[point];
            return `${position?.col ?? 0},${position?.row ?? 0}`;
          })
          .join(" ");
        return (
          <polyline
            key={points}
            className="fill-none stroke-amber-800"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="0.075"
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
            className="stroke-amber-500"
            strokeLinecap="round"
            strokeWidth="0.12"
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
      className="h-auto w-full select-none"
      role="group"
      viewBox="-0.55 -0.55 7.1 7.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        className="fill-amber-50 stroke-amber-200"
        height="6.4"
        rx="0.35"
        strokeWidth="0.06"
        width="6.4"
        x="-0.2"
        y="-0.2"
      />
      <MolenspelLines />
      <MolenspelMillLines game={game} />
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
