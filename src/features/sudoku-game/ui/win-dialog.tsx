import { Button, RotateCcw, Sparkles, Star, Trophy } from "@shared/ui";

interface WinDialogProps {
  onAgain: () => void;
  onChoose: () => void;
  onHome: () => void;
}

export function WinDialog({ onAgain, onChoose, onHome }: WinDialogProps) {
  return (
    <div
      aria-labelledby="win-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="animate-pop w-full max-w-sm rounded-3xl border bg-card p-6 text-center shadow-xl">
        <div aria-hidden="true" className="mb-2 flex justify-center gap-1 text-4xl">
          <span className="animate-rise">🎉</span>
          <Star className="size-10 text-amber-400" />
          <span className="animate-rise">⭐</span>
        </div>
        <Trophy aria-hidden="true" className="mx-auto mb-2 size-12 text-amber-500" />
        <h2 className="text-2xl font-black" id="win-title">
          Goed gedaan!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Je hebt de sudoku helemaal opgelost.</p>

        <div className="mt-6 space-y-2">
          <Button autoFocus className="w-full" size="lg" variant="success" onClick={onAgain}>
            <Sparkles aria-hidden="true" className="size-5" />
            Nog een keer
          </Button>
          <Button className="w-full" variant="outline" onClick={onChoose}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Ander spel kiezen
          </Button>
          <Button className="w-full" variant="ghost" onClick={onHome}>
            Naar het menu
          </Button>
        </div>
      </div>
    </div>
  );
}
