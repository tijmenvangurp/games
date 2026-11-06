import { squareKind, type PlayerId, type TurnEvent, type TurnResult } from "@entities/ganzenbord";

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

/** Alleen echte gebeurtenissen krijgen een kaart; een worp of verplaatsing niet. */
export function eventCard(step: AnimationStep | undefined): TurnEvent | undefined {
  if (!step?.event || step.event.kind === "roll" || step.event.kind === "move") {
    return undefined;
  }
  return step.event;
}

/** Alleen gebeurtenissen op een vak zijn de moeite van het inzoomen waard. */
const ZOOM_KINDS: ReadonlySet<TurnEvent["kind"]> = new Set([
  "first-throw",
  "goose",
  "bounce",
  "bridge",
  "inn",
  "well",
  "prison",
  "maze",
  "death",
  "free",
  "win",
]);

/** Het vak waarop de kaart betrekking heeft, of niets bij een algemene melding. */
export function zoomPositionFor(step: AnimationStep | undefined): number | undefined {
  const event = eventCard(step);
  if (!event || !ZOOM_KINDS.has(event.kind)) {
    return undefined;
  }
  return step?.position;
}

const STEP_MS = 150;
const LANDING_MS = 650;
const JUMP_MS = 1100;
const READ_MS = 2000;
const ROLL_MS = 550;

function movementSteps(from: number, to: number, event?: TurnEvent): AnimationStep[] {
  if (from === to) {
    return [{ position: to, ...(event ? { event } : {}), delayMs: LANDING_MS }];
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

  if (event) {
    const last = steps[steps.length - 1];
    steps[steps.length - 1] = { ...last, event };
  }
  return steps;
}

/**
 * Zet een kaart op de plek waar de pion staat. Staat daar net een gewone
 * verplaatsing, dan wordt die stap hergebruikt; zo blijft de pion niet twee
 * keer op hetzelfde vakje hangen.
 */
function addCard(
  steps: AnimationStep[],
  event: TurnEvent,
  position: number,
  delayMs = READ_MS,
): void {
  const last = steps.at(-1);
  if (last?.position === position && (!last.event || last.event.kind === "move")) {
    steps[steps.length - 1] = { ...last, event, delayMs };
    return;
  }
  steps.push({ position, event, delayMs });
}

interface BuildState {
  readonly steps: AnimationStep[];
  position: number;
}

/** De pion loopt vakje voor vakje, ook als hij maar één vakje terug hoeft. */
function walk(state: BuildState, from: number, to: number, event?: TurnEvent): void {
  state.steps.push(...movementSteps(from, to, event));
  state.position = to;
}

/** Een sprong in één keer, zonder tussenliggende vakjes. */
function jump(state: BuildState, to: number): void {
  state.steps.push({ position: to, delayMs: JUMP_MS });
  state.position = to;
}

/**
 * De eerste worp van 9 slaat de gewone loop over. Voor het kind is het juist
 * leuk om eerst naar 9 te lopen en pas daarna de sprong naar 53 of 26 te zien.
 */
function animateFirstThrow(state: BuildState, event: TurnEvent, roll: TurnEvent | undefined): void {
  const from = event.from ?? state.position;
  const to = event.to ?? state.position;
  const rolled = roll?.value === undefined ? from : from + roll.value;

  if (rolled > from) {
    walk(state, from, rolled, {
      kind: "move",
      player: event.player,
      from,
      to: rolled,
    });
    addCard(state.steps, event, rolled);
  } else {
    addCard(state.steps, event, from);
  }

  jump(state, to);
}

function animateGoose(state: BuildState, event: TurnEvent): void {
  const from = event.from ?? state.position;
  addCard(state.steps, event, from);
  walk(state, from, event.to ?? from);
}

/**
 * Een gans die voorbij 63 komt, telt terug. De engine noemt dat een bounce;
 * voor de speler is het eerst een gans en daarna pas "te ver".
 */
function animateBounce(state: BuildState, event: TurnEvent): void {
  const from = event.from ?? state.position;
  const card = squareKind(from) === "goose" ? { ...event, kind: "goose" as const } : event;
  addCard(state.steps, card, from);
  walk(state, from, event.to ?? from);
}

/** Brug, doolhof en dood: eerst de kaart op het vak, dan de sprong. */
function animateJump(state: BuildState, event: TurnEvent): void {
  const from = event.from ?? state.position;
  addCard(state.steps, event, from);
  jump(state, event.to ?? from);
}

type Handler = (state: BuildState, event: TurnEvent, roll: TurnEvent | undefined) => void;

/** Een kaart op het vak waar de pion staat, zonder te bewegen. */
const showCard: Handler = (state, event) => {
  addCard(state.steps, event, event.from ?? state.position);
};

/** Een kaart voor iets dat niet aan een vak hangt, zoals een overslagen beurt. */
const showStatus: Handler = (state, event) => {
  addCard(state.steps, event, state.position);
};

const finish: Handler = (state, event) => {
  addCard(state.steps, event, 63);
  state.position = 63;
};

const HANDLERS: Readonly<Partial<Record<TurnEvent["kind"], Handler>>> = {
  move: (state, event) =>
    walk(state, event.from ?? state.position, event.to ?? state.position, event),
  goose: animateGoose,
  bounce: animateBounce,
  "first-throw": animateFirstThrow,
  bridge: animateJump,
  maze: animateJump,
  death: animateJump,
  inn: showCard,
  well: showCard,
  prison: showCard,
  free: showStatus,
  skip: showStatus,
  draw: showStatus,
  win: finish,
};

/**
 * Zet de gebeurtenissen van een beurt om in stapjes voor de pion. Elke
 * gebeurtenis krijgt een eigen moment: de pion landt, de kaart verschijnt, en
 * pas daarna volgt de sprong of de extra worp. De engine heeft de uitkomst al
 * berekend; deze functie bepaalt alleen hoe we die aan het kind laten zien.
 */
export function buildTurnAnimation(
  startPosition: number,
  player: PlayerId,
  result: TurnResult,
): readonly AnimationStep[] {
  const steps: AnimationStep[] = [];
  const roll = result.events.find((event) => event.kind === "roll");
  if (roll) {
    steps.push({ position: startPosition, event: roll, delayMs: ROLL_MS });
  }

  const state: BuildState = { steps, position: startPosition };
  for (const event of result.events) {
    HANDLERS[event.kind]?.(state, event, roll);
  }

  // Zonder beweging (bijvoorbeeld direct vast) is er alsnog een stap nodig om
  // de beurt te kunnen afronden.
  if (steps.length <= (roll ? 1 : 0)) {
    steps.push({ position: state.position, delayMs: LANDING_MS });
  }

  return steps;
}
