import { useEffect } from "react";
import { playSound } from "@shared/lib";
import { Button } from "./button";
import { Confetti } from "./confetti";
import { Dialog } from "./dialog";
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
    <Dialog
      className="text-center"
      describedBy="celebration-description"
      labelledBy="celebration-title"
      overlay={confetti ? <Confetti pieces={28} variant="shower" /> : undefined}
      size="sm"
      onClose={onHome}
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border border-warning/35 bg-warning-soft shadow-xs"
      >
        <Trophy className="size-10 text-warning-ink" />
      </div>
      <div aria-hidden="true" className="mb-2 flex justify-center gap-1.5">
        <Sparkles className="animate-rise size-4 text-primary" />
        <Star className="size-4 fill-warning text-warning" />
        <Sparkles className="animate-rise size-4 text-warning" />
      </div>
      <h2 className="font-display text-2xl tracking-tight" id="celebration-title">
        {title}
      </h2>
      <p
        className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
        id="celebration-description"
      >
        {description}
      </p>

      <div className="mt-6 space-y-2">
        <Button autoFocus className="w-full" size="lg" variant="success" onClick={onAgain}>
          <Sparkles aria-hidden="true" className="size-5" />
          {againLabel}
        </Button>
        <Button className="min-h-11 w-full" variant="outline" onClick={onChoose}>
          <LayoutGrid aria-hidden="true" className="size-4" />
          {chooseLabel}
        </Button>
        <Button className="min-h-11 w-full" variant="ghost" onClick={onHome}>
          {homeLabel}
        </Button>
      </div>
    </Dialog>
  );
}
