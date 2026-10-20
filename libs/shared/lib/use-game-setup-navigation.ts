import { useNavigate } from "@tanstack/react-router";

interface GameSetupNavigationOptions {
  setupVisible: boolean;
  hasActiveGame: boolean;
  backToGameLabel: string;
  onCloseSetup: () => void;
  onOpenSetup: () => void;
}

export function useGameSetupNavigation({
  setupVisible,
  hasActiveGame,
  backToGameLabel,
  onCloseSetup,
  onOpenSetup,
}: GameSetupNavigationOptions) {
  const navigate = useNavigate();
  const backToGame = setupVisible && hasActiveGame;

  return {
    backLabel: backToGame ? backToGameLabel : undefined,
    onBack: () => {
      if (backToGame) {
        onCloseSetup();
        return;
      }
      navigate({ to: "/" });
    },
    onNewGame: setupVisible ? undefined : onOpenSetup,
  };
}
