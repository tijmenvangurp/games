import type { PlayerId, TurnEvent, TurnResult } from "@entities/ganzenbord";

export interface AnimationStep {
  /** Waar de actieve pion op dit moment staat. */
  readonly position: number;
  /** Alleen bij een bijzonder moment; dan verschijnt de gebeurteniskaart. */
  readonly event?: TurnEvent;
  /** Hoe lang dit stapje blijft staan voordat de volgende volgt. */
  readonly delayMs: number;
}

export interface TurnAnimation {
  readonly player: PlayerId;
  readonly steps: readonly AnimationStep[];
  readonly index: number;
  readonly result: TurnResult;
}

const STEP_MS = 150;
const LANDING_MS = 650;
const JUMP_MS = 1100;
const STATUS_MS = 1000;
const FINISH = 63;

interface StepResult {
  readonly steps: readonly AnimationStep[];
  readonly position: number;
}

type StepBuilder = (event: TurnEvent, position: number) => StepResult;

function movementSteps(from: number, to: number, event: TurnEvent): AnimationStep[] {
  if (from === to) {
    return [{ position: to, event, delayMs: LANDING_MS }];
  }

  const direction = to > from ? 1 : -1;
  const steps: AnimationStep[] = [];
  let position = from;
  while (position !== to) {
    position += direction;
    steps.push({
      position,
      delayMs: position === to ? LANDING_MS : STEP_MS,
    });
  }

  const last = steps[steps.length - 1];
  steps[steps.length - 1] = { ...last, event };
  return steps;
}

/** Een gewone verplaatsing, of een gans die hetzelfde aantal vakjes verder springt. */
const walk: StepBuilder = (event, position) => {
  const from = event.from ?? position;
  const to = event.to ?? position;
  return { steps: movementSteps(from, to, event), position: to };
};

/** Een sprong in één keer: brug, doolhof, eerste worp 9 en de dood. */
const jump: StepBuilder = (event, position) => {
  const to = event.to ?? position;
  return { steps: [{ position: to, event, delayMs: JUMP_MS }], position: to };
};

/** Blijven staan terwijl de kaart uitlegt wat er aan de hand is. */
const hold: StepBuilder = (event, position) => {
  const to = event.to ?? position;
  return { steps: [{ position: to, event, delayMs: STATUS_MS + 300 }], position: to };
};

const stay: StepBuilder = (event, position) => ({
  steps: [{ position, event, delayMs: STATUS_MS }],
  position,
});

const finish: StepBuilder = (event) => ({
  steps: [{ position: FINISH, event, delayMs: JUMP_MS }],
  position: FINISH,
});

const BUILDERS: Readonly<Partial<Record<TurnEvent["kind"], StepBuilder>>> = {
  move: walk,
  goose: walk,
  bounce: walk,
  "first-throw": jump,
  bridge: jump,
  maze: jump,
  death: jump,
  inn: hold,
  well: hold,
  prison: hold,
  free: stay,
  skip: stay,
  draw: stay,
  win: finish,
};

/**
 * Zet de gebeurtenissen van een beurt om in stapjes voor de pion. Een gewone
 * worp loopt vakje voor vakje; een gans, brug, doolhof of dood is een sprong
 * met een duidelijke gebeurteniskaart. De engine heeft de uitkomst al berekend;
 * deze functie bepaalt alleen hoe we die aan het kind laten zien.
 */
export function buildTurnAnimation(
  startPosition: number,
  player: PlayerId,
  result: TurnResult,
): readonly AnimationStep[] {
  const steps: AnimationStep[] = [];
  const roll = result.events.find((event) => event.kind === "roll");
  if (roll) {
    steps.push({ position: startPosition, event: roll, delayMs: 550 });
  }

  let position = startPosition;
  for (const event of result.events) {
    const builder = BUILDERS[event.kind];
    if (!builder) {
      continue;
    }
    const step = builder(event, position);
    steps.push(...step.steps);
    position = step.position;
  }

  // Zonder beweging (bijvoorbeeld direct vast) is er alsnog een stap nodig om
  // de beurt te kunnen afronden.
  if (steps.length <= (roll ? 1 : 0)) {
    steps.push({ position, delayMs: LANDING_MS });
  }

  return steps;
}
