import { BookOpen } from "@shared/ui";

export function GanzenbordRules() {
  return (
    <details className="game-panel group p-3 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-bold marker:hidden">
        <BookOpen aria-hidden="true" className="size-4 text-primary" />
        Spelregels
        <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">
          open
        </span>
      </summary>
      <div className="mt-3 space-y-2 leading-relaxed text-muted-foreground">
        <p>
          Je gooit met twee dobbelstenen en verzet je gans. Wie het eerst precies op vakje 63 komt,
          wint.
        </p>
        <ul className="space-y-1.5">
          <li>
            <strong className="text-foreground">Gans:</strong> op 5, 9, 14, 18, 23, 27, 32, 36, 41,
            45, 50, 54 of 59 ga je hetzelfde aantal ogen nog eens.
          </li>
          <li>
            <strong className="text-foreground">Brug (6):</strong> door naar 12.
          </li>
          <li>
            <strong className="text-foreground">Herberg (19):</strong> één beurt overslaan.
          </li>
          <li>
            <strong className="text-foreground">Put (31) en gevangenis (52):</strong> wachten tot
            een andere speler op jouw vakje komt; die neemt je plaats over.
          </li>
          <li>
            <strong className="text-foreground">Doolhof (42):</strong> terug naar 37.
          </li>
          <li>
            <strong className="text-foreground">Dood (58):</strong> terug naar start.
          </li>
          <li>
            <strong className="text-foreground">Te ver:</strong> je telt vanaf 63 terug. Kom je
            terug op een gans, dan ga je nog eens terug.
          </li>
          <li>
            <strong className="text-foreground">Eerste worp 9:</strong> met 5 + 4 ga je naar 53, met
            6 + 3 naar 26.
          </li>
        </ul>
        <p className="text-xs">
          Zitten alle overgebleven spelers in de put of gevangenis, dan is het gelijkspel.
        </p>
      </div>
    </details>
  );
}
