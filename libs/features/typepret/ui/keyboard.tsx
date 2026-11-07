import { fingerForKey, HOME_ROW } from "@entities/typepret";
import { FINGER_COLORS } from "../model/finger-colors";

const ROWS: readonly (readonly string[])[] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ","],
];
const ROW_OFFSET = [0, 14, 38] as const;
const KEY = 44;
const GAP = 6;
const WIDTH = 10 * (KEY + GAP) + 38;
const HEIGHT = 3 * (KEY + GAP);

interface KeyboardProps {
  /** Het doelteken dat nu getypt moet worden. */
  target: string | undefined;
  /** Vergroot de aanwijzing na meerdere fouten. */
  emphasize: boolean;
}

/** Eigen SVG-toetsenbord: alleen de basisrij is gekleurd, de rest staat rustig op de achtergrond. */
export function Keyboard({ target, emphasize }: KeyboardProps) {
  return (
    <svg
      aria-hidden="true"
      className="mx-auto h-auto w-full max-w-xl"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      {ROWS.map((row, rowIndex) =>
        row.map((key, keyIndex) => {
          const x = ROW_OFFSET[rowIndex] + keyIndex * (KEY + GAP);
          const y = rowIndex * (KEY + GAP);
          const finger = fingerForKey(key);
          const home = HOME_ROW.includes(key);
          const active = key === target;
          const fill = finger && home ? FINGER_COLORS[finger.id] : "var(--muted)";
          return (
            <g key={key} opacity={home || active ? 1 : 0.6}>
              <rect
                fill={fill}
                height={KEY}
                rx={9}
                stroke={active ? "var(--foreground)" : "var(--border)"}
                strokeWidth={active ? (emphasize ? 5 : 3.5) : 1.5}
                width={KEY}
                x={x}
                y={y}
              />
              <text
                dominantBaseline="central"
                fill="var(--foreground)"
                fontSize={active && emphasize ? 24 : 20}
                fontWeight={active ? 900 : 700}
                textAnchor="middle"
                x={x + KEY / 2}
                y={y + KEY / 2}
              >
                {key.toUpperCase()}
              </text>
              {key === "f" || key === "j" ? (
                <rect
                  fill="var(--foreground)"
                  height={3}
                  rx={1.5}
                  width={14}
                  x={x + KEY / 2 - 7}
                  y={y + KEY - 9}
                />
              ) : null}
            </g>
          );
        }),
      )}
    </svg>
  );
}
