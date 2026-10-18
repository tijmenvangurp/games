import { Button, Heart, Home, RotateCcw } from "@shared/ui";

interface MazeLostProps {
  onRestart: () => void;
  onLevels: () => void;
  onHome: () => void;
}

export function MazeLost({ onRestart, onLevels, onHome }: MazeLostProps) {
  return (
    <div
      aria-labelledby="maze-lost-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onHome();
        }
      }}
    >
      <div className="game-panel animate-pop w-full max-w-sm p-6 text-center">
        <div aria-hidden="true" className="mb-2 flex justify-center gap-1 text-danger">
          <Heart className="size-10" fill="currentColor" />
          <Heart className="size-10" fill="currentColor" />
          <Heart className="size-10" fill="currentColor" />
        </div>
        <h2 className="font-display text-2xl" id="maze-lost-title">
          Harten op
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Je tikte drie keer op een pijl die nog niet vrij was. Probeer het nog eens.
        </p>

        <div className="mt-6 space-y-2">
          <Button autoFocus className="w-full" size="lg" variant="success" onClick={onRestart}>
            <RotateCcw aria-hidden="true" className="size-5" />
            Opnieuw
          </Button>
          <Button className="w-full" variant="outline" onClick={onLevels}>
            Kies level
          </Button>
          <Button className="w-full" variant="ghost" onClick={onHome}>
            <Home aria-hidden="true" className="size-4" />
            Naar het menu
          </Button>
        </div>
      </div>
    </div>
  );
}
