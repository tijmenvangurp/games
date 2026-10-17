import { Button } from "./button";
import { ArrowLeft, Play, Sparkles } from "./icons";

interface SetupActionsProps {
  onStart: () => void;
  onBack?: () => void;
  backLabel?: string;
  startLabel?: string;
  loading?: boolean;
}

export function SetupActions({
  onStart,
  onBack,
  backLabel = "Terug naar je spel",
  startLabel = "Spelen",
  loading = false,
}: SetupActionsProps) {
  return (
    <>
      <Button
        className="mt-6 w-full"
        disabled={loading}
        size="lg"
        variant="success"
        onClick={onStart}
      >
        {loading ? (
          <>
            <Sparkles aria-hidden="true" className="size-5 animate-pulse" />
            Spel maken…
          </>
        ) : (
          <>
            <Play aria-hidden="true" className="size-5" />
            {startLabel}
          </>
        )}
      </Button>

      {onBack ? (
        <Button className="mt-2 w-full" variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLabel}
        </Button>
      ) : null}
    </>
  );
}
