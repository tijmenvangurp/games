import type { MemoryMonster, MonsterEyes, MonsterHorns, MonsterShape } from "@entities/memory";

function BodyShape({ shape, color }: { shape: MonsterShape; color: string }) {
  switch (shape) {
    case "blob":
      return <ellipse cx="0" cy="4" fill={color} rx="31" ry="30" />;
    case "tall":
      return <ellipse cx="0" cy="2" fill={color} rx="24" ry="36" />;
    case "round":
      return <circle cx="0" cy="2" fill={color} r="33" />;
    case "spiky":
      return (
        <path
          d="M0 -34 L9 -22 L24 -26 L22 -10 L36 0 L22 10 L24 26 L9 22 L0 34 L-9 22 L-24 26 L-22 10 L-36 0 L-22 -10 L-24 -26 L-9 -22 Z"
          fill={color}
        />
      );
    case "square":
      return <rect fill={color} height="56" rx="14" width="56" x="-28" y="-26" />;
  }
}

function Horns({ kind, color }: { kind: MonsterHorns; color: string }) {
  switch (kind) {
    case "none":
      return (
        <g fill={color}>
          <circle cx="-27" cy="-18" r="6" />
          <circle cx="27" cy="-18" r="6" />
        </g>
      );
    case "one":
      return <path d="M0 -34 L9 -16 L-9 -16 Z" fill={color} />;
    case "two":
      return (
        <g fill={color}>
          <path d="M-18 -30 L-9 -14 L-27 -16 Z" />
          <path d="M18 -30 L9 -14 L27 -16 Z" />
        </g>
      );
    case "antenna":
      return (
        <g fill="none" stroke={color} strokeWidth="3">
          <path d="M0 -28 Q-6 -38 0 -43" strokeLinecap="round" />
          <circle cx="0" cy="-44" fill={color} r="4.5" stroke="none" />
        </g>
      );
  }
}

interface Eye {
  cx: number;
  cy: number;
  r: number;
  pupil: number;
}

function eyeLayout(count: MonsterEyes): Eye[] {
  switch (count) {
    case 1:
      return [{ cx: 0, cy: 0, r: 13, pupil: 6 }];
    case 2:
      return [
        { cx: -11, cy: 0, r: 8, pupil: 3.5 },
        { cx: 11, cy: 0, r: 8, pupil: 3.5 },
      ];
    case 3:
      return [
        { cx: -15, cy: -4, r: 5.5, pupil: 2.5 },
        { cx: 0, cy: -9, r: 5.5, pupil: 2.5 },
        { cx: 15, cy: -4, r: 5.5, pupil: 2.5 },
      ];
  }
}

function Eyes({ count }: { count: MonsterEyes }) {
  return (
    <g>
      {eyeLayout(count).map((eye, index) => (
        <g key={index}>
          <circle cx={eye.cx} cy={eye.cy} fill="#ffffff" r={eye.r} stroke="none" />
          <circle cx={eye.cx - 1} cy={eye.cy + 1} fill="#1e293b" r={eye.pupil} stroke="none" />
          <circle
            cx={eye.cx - 1 - eye.pupil / 2}
            cy={eye.cy + 1 - eye.pupil / 2}
            fill="#ffffff"
            r={eye.pupil / 3}
            stroke="none"
          />
        </g>
      ))}
    </g>
  );
}

export function MonsterGlyph({ monster }: { monster: MemoryMonster }) {
  return (
    <g stroke="#0f172a" strokeOpacity="0.16" strokeWidth="2">
      <BodyShape color={monster.body} shape={monster.shape} />
      <Horns color={monster.accent} kind={monster.horns} />
      <Eyes count={monster.eyes} />
      <g fill="#fb7185" opacity="0.35" stroke="none">
        <circle cx="-21" cy="10" r="4.5" />
        <circle cx="21" cy="10" r="4.5" />
      </g>
      <path
        d="M-6 14 Q0 20 6 14"
        fill="none"
        stroke="#1e293b"
        strokeLinecap="round"
        strokeOpacity="0.7"
        strokeWidth="2.5"
      />
    </g>
  );
}
