import type { BadgeKind, HiddenCreature } from "@entities/hidden-object";

const PETALS = [0, 72, 144, 216, 288].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return { x: Math.cos(radians) * 6, y: Math.sin(radians) * 6 };
});

function BadgeGlyph({ kind }: { kind: BadgeKind }) {
  switch (kind) {
    case "star":
      return (
        <path
          d="M0 -12 L3.5 -3.5 L12 -3 L5.5 2.5 L8 11 L0 6 L-8 11 L-5.5 2.5 L-12 -3 L-3.5 -3.5 Z"
          fill="#fbbf24"
        />
      );
    case "heart":
      return (
        <path
          d="M0 10 C -13 1 -11 -9 -4 -9 C -1 -9 0 -6 0 -5 C 0 -6 1 -9 4 -9 C 11 -9 13 1 0 10 Z"
          fill="#fb7185"
        />
      );
    case "moon":
      return <path d="M5 -11 A11 11 0 1 0 5 11 A8 8 0 1 1 5 -11 Z" fill="#a5b4fc" />;
    case "drop":
      return <path d="M0 -12 C6 -2 9 3 9 6 A9 9 0 0 1 -9 6 C-9 3 -6 -2 0 -12 Z" fill="#60a5fa" />;
    case "bolt":
      return <path d="M2 -12 L-8 2 L-2 2 L-4 12 L8 -2 L2 -2 Z" fill="#fb923c" />;
    case "flower":
      return (
        <g>
          {PETALS.map((petal, index) => (
            <circle key={index} cx={petal.x} cy={petal.y} r="5" fill="#f9a8d4" />
          ))}
          <circle r="4" fill="#fbbf24" />
        </g>
      );
  }
}

export function CreatureGlyph({ creature }: { creature: HiddenCreature }) {
  const { colors, badge } = creature;

  return (
    <g stroke="#0f172a" strokeOpacity="0.18" strokeWidth="1.5">
      <ellipse cx="-13" cy="43" rx="10" ry="7" fill={colors.hat} />
      <ellipse cx="13" cy="43" rx="10" ry="7" fill={colors.hat} />
      <ellipse cx="-30" cy="13" rx="8" ry="12" fill={colors.body} transform="rotate(-25 -30 13)" />
      <ellipse cx="30" cy="13" rx="8" ry="12" fill={colors.body} transform="rotate(25 30 13)" />
      <ellipse cx="0" cy="8" rx="29" ry="32" fill={colors.body} />
      <ellipse cx="0" cy="22" rx="20" ry="17" fill={colors.belly} stroke="none" />
      <circle cx="-10" cy="2" r="7.5" fill="#ffffff" stroke="none" />
      <circle cx="10" cy="2" r="7.5" fill="#ffffff" stroke="none" />
      <circle cx="-9" cy="3" r="3.6" fill="#1e293b" stroke="none" />
      <circle cx="11" cy="3" r="3.6" fill="#1e293b" stroke="none" />
      <path
        d="M-5 17 Q0 22 5 17"
        fill="none"
        stroke="#1e293b"
        strokeOpacity="0.7"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path d="M-29 -14 Q0 -52 29 -14 Z" fill={colors.hat} />
      <rect x="-33" y="-16" width="66" height="8" rx="4" fill={colors.hat} />
      <circle cx="0" cy="-46" r="7" fill={colors.belly} />
      <g transform="translate(0 -26) scale(1.1)">
        <BadgeGlyph kind={badge} />
      </g>
    </g>
  );
}
