import { useTranslation } from "@shared/i18n";
import { Button } from "./button";
import { Play, Sparkles } from "./icons";

interface SetupActionsProps {
  onStart: () => void;
  startLabel?: string;
  loading?: boolean;
}

export function SetupActions({ onStart, startLabel, loading = false }: SetupActionsProps) {
  const { t } = useTranslation();
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
          {t("setup.loading")}
        </>
      ) : (
        <>
          <Play aria-hidden="true" className="size-5" />
          {startLabel ?? t("setup.start")}
        </>
      )}
    </Button>
  );
}
