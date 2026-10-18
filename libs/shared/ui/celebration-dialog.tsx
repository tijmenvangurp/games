import { useEffect } from "react";
import { playSound } from "@shared/lib";
import { Button } from "./button";
import { Confetti } from "./confetti";
import { LayoutGrid, Sparkles, Star, Trophy } from "./icons";

interface CelebrationDialogProps {
  title: string;
  description: string;
  onAgain: () => void;
  onChoose: () => void;
  onHome: () => void;
  againLabel?: string;
  chooseLabel?: string;
  homeLabel?: string;
  confetti?: boolean;
}

export function CelebrationDialog({
  title,
  description,
  onAgain,
  onChoose,
  onHome,
  againLabel = "Nog een keer",
  chooseLabel = "Ander spel kiezen",
  homeLabel = "Naar het menu",
  confetti = false,
}: CelebrationDialogProps) {
  useEffect(() => {
    playSound("win");
  }, []);

  return (
    <div
      aria-describedby="celebration-description"
      aria-labelledby="celebration-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onHome();
        }
      }}
    >
      {confetti ? <Confetti pieces={28} /> : null}
      <div className="animate-pop w-full max-w-sm rounded-3xl border bg-card p-6 text-center shadow-xl">
        <div aria-hidden="true" className="mb-2 flex justify-center gap-1 text-4xl">
          <Sparkles className="animate-rise size-10 text-rose-400" />
          <Star className="size-10 text-amber-400" />
          <Sparkles className="animate-rise size-10 text-amber-400" />
        </div>
        <Trophy aria-hidden="true" className="mx-auto mb-2 size-12 text-amber-500" />
        <h2 className="text-2xl font-black" id="celebration-title">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground" id="celebration-description">
          {description}
        </p>

        <div className="mt-6 space-y-2">
          <Button autoFocus className="w-full" size="lg" variant="success" onClick={onAgain}>
            <Sparkles aria-hidden="true" className="size-5" />
            {againLabel}
          </Button>
          <Button className="w-full" variant="outline" onClick={onChoose}>
            <LayoutGrid aria-hidden="true" className="size-4" />
            {chooseLabel}
          </Button>
          <Button className="w-full" variant="ghost" onClick={onHome}>
            {homeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
