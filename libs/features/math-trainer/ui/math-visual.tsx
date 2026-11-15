import { groupingFor, type MathQuestion } from "@entities/math";

interface NumberLineSvgProps {
  question: MathQuestion;
  max: number;
  ticks: readonly number[];
  x: (value: number) => number;
  showLabel: (value: number) => boolean;
}

function NumberLineSvg({ question, max, ticks, x, showLabel }: NumberLineSvgProps) {
  const forward = question.answer >= question.left;
  const startAnchor = forward ? "end" : "start";
  const endAnchor = forward ? "start" : "end";

  return (
    <svg
      aria-label={`Getallenlijn van 0 tot ${max}. ${question.left} naar ${question.answer}.`}
      className="w-full"
      role="img"
      viewBox="0 0 320 88"
    >
      <line stroke="#cbd5e1" strokeWidth="4" x1="20" x2="300" y1="50" y2="50" />
      {ticks.map((tick) => (
        <g key={tick}>
          <line stroke="#94a3b8" strokeWidth="2" x1={x(tick)} x2={x(tick)} y1="45" y2="55" />
          {showLabel(tick) ? (
            <text
              fill="#64748b"
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              x={x(tick)}
              y="72"
            >
              {tick}
            </text>
          ) : null}
        </g>
      ))}
      <line
        stroke="#0d9488"
        strokeLinecap="round"
        strokeWidth="7"
        x1={x(question.left)}
        x2={x(question.answer)}
        y1="50"
        y2="50"
      />
      <circle cx={x(question.left)} cy="50" fill="#0f766e" r="7" />
      <circle cx={x(question.answer)} cy="50" fill="#f59e0b" r="7" />
      <text
        fill="#0f766e"
        fontSize="12"
        fontWeight="800"
        textAnchor={startAnchor}
        x={x(question.left) + (forward ? -4 : 4)}
        y="31"
      >
        {question.left}
      </text>
      <text
        fill="#b45309"
        fontSize="12"
        fontWeight="800"
        textAnchor={endAnchor}
        x={x(question.answer) + (forward ? 4 : -4)}
        y="31"
      >
        {question.answer}
      </text>
    </svg>
  );
}

function NumberLine({ question }: { question: MathQuestion }) {
  const max = Math.max(question.left, question.answer, 10);
  const step = max <= 10 ? 1 : max <= 20 ? 2 : 10;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, index) => index * step);

  return (
    <NumberLineSvg
      max={max}
      question={question}
      showLabel={(value) =>
        value === 0 || value === max || value === Math.floor(max / 2 / step) * step
      }
      ticks={ticks}
      x={(value) => 20 + (value / max) * 280}
    />
  );
}

function DotGroups({ question }: { question: MathQuestion }) {
  const { groups, perGroup } = groupingFor(question);
  const columns = perGroup <= 5 ? perGroup : Math.ceil(perGroup / 2);

  return (
    <div aria-label={`${groups} groepjes van ${perGroup} stippen`} className="space-y-2" role="img">
      <div className="flex flex-wrap justify-center gap-1.5">
        {Array.from({ length: groups }, (_, groupIndex) => (
          <div
            key={groupIndex}
            className="grid gap-0.5 rounded-lg border border-border bg-muted p-1"
            style={{ gridTemplateColumns: `repeat(${columns}, 6px)` }}
          >
            {Array.from({ length: perGroup }, (_, dotIndex) => (
              <span key={dotIndex} className="size-1.5 rounded-full bg-foreground/70" />
            ))}
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-semibold text-muted-foreground">
        {question.mode === "keer"
          ? `${groups} × ${perGroup} = ${groups * perGroup}`
          : `${groups} groepjes van ${perGroup}`}
      </p>
    </div>
  );
}

export function MathVisual({ question }: { question: MathQuestion }) {
  if (question.mode === "plus" || question.mode === "min") {
    return <NumberLine question={question} />;
  }

  return <DotGroups question={question} />;
}
