import { MOLENSPEL_PIECES_PER_PLAYER, type MolenspelPlayer } from "@entities/molenspel";
import { Button, PageHeader } from "@shared/ui";
import { cn } from "@shared/lib";

const PLAYERS: readonly { value: MolenspelPlayer; label: string; hint: string; emoji: string }[] = [
  { value: "wit", label: "Wit", hint: "Zet de witte stenen", emoji: "⚪" },
  { value: "zwart", label: "Zwart", hint: "Zet de zwarte stenen", emoji: "⚫" },
];

const RULES: readonly { title: string; body: string }[] = [
  {
    title: "Leg stenen.",
    body: `Je zet om en om een steen op een leeg punt. Elk van jullie heeft ${MOLENSPEL_PIECES_PER_PLAYER} stenen.`,
  },
  {
    title: "Maak een molentje.",
    body: "Drie stenen van dezelfde kleur op één rij vormen een molentje. Daarmee pak je één steen van de tegenstander. Losse stenen mag je eerst pakken.",
  },
  {
    title: "Schuif je stenen.",
    body: "Zodra alle stenen op het bord liggen, schuif je een steen naar een naburig punt.",
  },
  {
    title: "Vlieg met drie stenen.",
    body: "Heb je nog maar drie stenen, dan mag je met elke steen naar elk vrij punt springen.",
  },
  {
    title: "Winnen.",
    body: "De tegenstander verliest als er nog maar twee stenen over zijn, of als hij geen enkele zet meer kan doen.",
  },
];

interface MolenspelIntroProps {
  onBack: () => void;
  onStart: (firstPlayer: MolenspelPlayer) => void;
  firstPlayer: MolenspelPlayer;
  onSelectPlayer: (player: MolenspelPlayer) => void;
}

/** De regels van het molenspel. */
function MolenspelRules() {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-black">Zo speel je</h2>
      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
        {RULES.map((rule) => (
          <li key={rule.title}>
            <strong className="text-foreground">{rule.title}</strong> {rule.body}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** De keuze wie begint. */
function MolenspelStartChoice({
  firstPlayer,
  onSelectPlayer,
}: {
  firstPlayer: MolenspelPlayer;
  onSelectPlayer: (player: MolenspelPlayer) => void;
}) {
  return (
    <fieldset className="rounded-3xl border bg-card p-5 shadow-sm">
      <legend className="px-1 text-sm font-semibold">Wie mag beginnen?</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {PLAYERS.map((player) => (
          <button
            key={player.value}
            aria-pressed={firstPlayer === player.value}
            className={cn(
              "flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 transition",
              firstPlayer === player.value
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/40",
            )}
            onClick={() => onSelectPlayer(player.value)}
            type="button"
          >
            <span aria-hidden="true" className="text-3xl">
              {player.emoji}
            </span>
            <span className="font-black">{player.label}</span>
            <span className="text-xs text-muted-foreground">{player.hint}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function MolenspelIntro({
  onBack,
  onStart,
  firstPlayer,
  onSelectPlayer,
}: MolenspelIntroProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 px-4 pb-safe pt-safe">
      <PageHeader
        subtitle="Een eeuwenoud bordspel voor twee spelers"
        title="Het Molenspel"
        onBack={onBack}
      />
      <MolenspelRules />
      <MolenspelStartChoice firstPlayer={firstPlayer} onSelectPlayer={onSelectPlayer} />
      <Button className="w-full" size="lg" variant="success" onClick={() => onStart(firstPlayer)}>
        Spelen
      </Button>
    </div>
  );
}
