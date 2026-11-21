import { Button, Play, StatusBanner } from "@shared/ui";

interface QuizFeedbackProps {
  correct: boolean;
  praise: string;
  targetName: string;
  onNext: () => void;
}

export function QuizFeedback({ correct, praise, targetName, onNext }: QuizFeedbackProps) {
  return (
    <StatusBanner
      align="center"
      className="animate-pop flex-col p-4"
      role="status"
      tone={correct ? "success" : "warning"}
    >
      <p className="text-lg font-bold">{correct ? praise : "Nog niet."}</p>
      <p className="mt-0.5 text-sm font-medium opacity-85">
        {correct ? `Het is ${targetName}.` : `Het juiste antwoord is ${targetName}.`}
      </p>
      <Button className="mt-3 w-full" variant={correct ? "success" : "default"} onClick={onNext}>
        <Play aria-hidden="true" className="size-4" />
        Volgende Pokémon
      </Button>
    </StatusBanner>
  );
}
