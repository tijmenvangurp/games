import type { DecorationKind } from "@entities/hidden-object";

function Flower({ color }: { color: string }) {
  const petals = [0, 72, 144, 216, 288].map((degrees) => {
    const radians = (degrees * Math.PI) / 180;
    return { x: Math.cos(radians) * 7, y: Math.sin(radians) * 7 };
  });

  return (
    <g>
      {petals.map((petal, index) => (
        <circle key={index} cx={petal.x} cy={petal.y} r="5.5" fill={color} />
      ))}
      <circle r="4.5" fill="#fbbf24" />
    </g>
  );
}

export function DecorationGlyph({ kind, color }: { kind: DecorationKind; color: string }) {
  switch (kind) {
    case "flower":
      return <Flower color={color} />;
    case "leaf":
      return (
        <g>
          <ellipse rx="7" ry="14" fill={color} />
          <path d="M0 -12 L0 12" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.5" />
        </g>
      );
    case "star":
      return (
        <path
          d="M0 -13 L3.8 -4 L13 -3.5 L6 2.5 L8.5 12 L0 6.5 L-8.5 12 L-6 2.5 L-13 -3.5 L-3.8 -4 Z"
          fill={color}
        />
      );
    case "bubble":
      return (
        <g fill="none" stroke={color}>
          <circle r="11" strokeWidth="3" />
          <circle cx="-3.5" cy="-4" r="2" fill={color} stroke="none" />
        </g>
      );
    case "shell":
      return (
        <g>
          <path d="M-13 8 A13 13 0 0 1 13 8 Z" fill={color} />
          <path
            d="M0 8 L-8 -3 M0 8 L0 -5 M0 8 L8 -3"
            stroke="#ffffff"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
        </g>
      );
  }
}
