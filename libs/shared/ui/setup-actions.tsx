import { Button } from "./button";
import { Play, Sparkles } from "./icons";

interface SetupActionsProps {
  onStart: () => void;
  startLabel?: string;
  loading?: boolean;
}

export function SetupActions({
  onStart,
  startLabel = "Spelen",
  loading = false,
}: SetupActionsProps) {
  return (
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
  );
}
