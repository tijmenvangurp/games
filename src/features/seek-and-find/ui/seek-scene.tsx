import { SCENE_SIZE, findTarget, type SeekScene as SeekSceneData } from "@entities/hidden-object";
import { CreatureGlyph } from "./creature-glyph";
import { DecorationGlyph } from "./decoration-glyph";

interface SeekSceneProps {
  scene: SeekSceneData;
  found: boolean;
  wrongId: number | null;
  hintVisible: boolean;
  onTap: (id: number) => void;
}

export function SeekScene({ scene, found, wrongId, hintVisible, onTap }: SeekSceneProps) {
  const gradientId = `seek-sky-${scene.seed}-${scene.difficulty}`;
  const target = hintVisible ? findTarget(scene) : null;
  const garden = scene.theme === "tuin";

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-white shadow-sm">
      <svg
        aria-label="Zoek de Wobbel met de ster tussen alle andere Wobbels"
        className="block h-auto w-full touch-manipulation"
        role="img"
        viewBox={`0 0 ${SCENE_SIZE} ${SCENE_SIZE}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={garden ? "#f0fdf4" : "#e0f2fe"} />
            <stop offset="100%" stopColor={garden ? "#fef9c3" : "#bae6fd"} />
          </linearGradient>
        </defs>

        <rect fill={`url(#${gradientId})`} height={SCENE_SIZE} width={SCENE_SIZE} />
        {garden ? (
          <ellipse cx="500" cy="990" fill="#bbf7d0" opacity="0.5" rx="650" ry="190" />
        ) : (
          <path
            d="M0 900 Q 250 840 500 900 T 1000 900 L 1000 1000 L 0 1000 Z"
            fill="#7dd3fc"
            opacity="0.35"
          />
        )}

        {scene.decorations.map((decoration) => (
          <g
            key={decoration.id}
            transform={`translate(${decoration.x} ${decoration.y}) rotate(${decoration.rotation}) scale(${decoration.size / 32})`}
          >
            <DecorationGlyph color={decoration.color} kind={decoration.kind} />
          </g>
        ))}

        {target ? (
          <circle
            cx={target.x}
            cy={target.y}
            data-testid="hint-region"
            fill="#fbbf24"
            fillOpacity="0.25"
            pointerEvents="none"
            r={scene.hintRadius}
            stroke="#f59e0b"
            strokeDasharray="12 9"
            strokeWidth="5"
          />
        ) : null}

        {scene.creatures.map((creature) => {
          const isTarget = creature.id === scene.targetId;
          const faded = found && !isTarget;
          const ringSize = creature.size * 0.74;

          return (
            <g
              key={creature.id}
              className="cursor-pointer transition-opacity"
              data-creature-id={creature.id}
              opacity={faded ? 0.3 : 1}
              transform={`translate(${creature.x} ${creature.y})`}
              onClick={() => onTap(creature.id)}
            >
              <circle fill="transparent" pointerEvents="all" r={creature.size * 0.62} />
              {creature.id === wrongId ? (
                <circle fill="none" r={ringSize} stroke="#f43f5e" strokeWidth="6" />
              ) : null}
              <g transform={`rotate(${creature.rotation}) scale(${creature.size / 100})`}>
                <CreatureGlyph creature={creature} />
              </g>
            </g>
          );
        })}

        {found ? <FoundRing scene={scene} /> : null}
      </svg>
    </div>
  );
}

function FoundRing({ scene }: { scene: SeekSceneData }) {
  const target = findTarget(scene);
  const radius = target.size * 0.82;

  return (
    <g pointerEvents="none" transform={`translate(${target.x} ${target.y})`}>
      <circle fill="#22c55e" fillOpacity="0.15" r={radius} />
      <circle className="animate-ping" fill="none" r={radius} stroke="#22c55e" strokeWidth="5" />
      <circle fill="none" r={radius} stroke="#16a34a" strokeWidth="6" />
    </g>
  );
}
