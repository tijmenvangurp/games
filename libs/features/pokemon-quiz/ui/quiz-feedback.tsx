import { Button, Play } from "@shared/ui";
import { cn } from "@shared/lib";

interface QuizFeedbackProps {
  correct: boolean;
  targetName: string;
  onNext: () => void;
}

export function QuizFeedback({ correct, targetName, onNext }: QuizFeedbackProps) {
  return (
    <div
      className={cn(
        "animate-pop rounded-3xl border-2 p-4 text-center",
        correct ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50",
      )}
      role="status"
    >
      <p className={cn("text-lg font-black", correct ? "text-emerald-800" : "text-rose-800")}>
        {correct ? "Goed gedaan!" : "Bijna!"}
      </p>
      <p className="text-sm text-muted-foreground">
        {correct ? `${targetName} is goed!` : `Het juiste antwoord is ${targetName}.`}
      </p>
      <Button className="mt-3 w-full" variant={correct ? "success" : "default"} onClick={onNext}>
        <Play aria-hidden="true" className="size-4" />
        Volgende Pokémon
      </Button>
    </div>
  );
}
