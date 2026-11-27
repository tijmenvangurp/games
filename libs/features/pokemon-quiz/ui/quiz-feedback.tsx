import { useTexts } from "@shared/i18n";
import { Button, Play, StatusBanner } from "@shared/ui";
import { pokemonQuizTexts } from "../model/texts";

interface QuizFeedbackProps {
  correct: boolean;
  praise: string;
  targetName: string;
  onNext: () => void;
}

export function QuizFeedback({ correct, praise, targetName, onNext }: QuizFeedbackProps) {
  const t = useTexts(pokemonQuizTexts);
  return (
    <StatusBanner
      align="center"
      className="animate-pop flex-col p-4"
      role="status"
      tone={correct ? "success" : "warning"}
    >
      <p className="text-lg font-bold">{correct ? praise : t.notYet}</p>
      <p className="mt-0.5 text-sm font-medium opacity-85">
        {correct ? t.itIs(targetName) : t.rightAnswer(targetName)}
      </p>
      <Button className="mt-3 w-full" variant={correct ? "success" : "default"} onClick={onNext}>
        <Play aria-hidden="true" className="size-4" />
        {t.next}
      </Button>
    </StatusBanner>
  );
}
