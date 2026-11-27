import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@shared/i18n";

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

/**
 * Combineert de lokale "setup open"-stand met de navigatie-opties die elke
 * gamepagina nodig heeft. Houdt de pagina's vrij van dezelfde boilerplate.
 */
export function useGameSetupState(hasActiveGame: boolean, backToGameLabel?: string) {
  const { t } = useTranslation();
  const [showSetup, setShowSetup] = useState(false);
  const setupVisible = showSetup || !hasActiveGame;
  const navigation = useGameSetupNavigation({
    setupVisible,
    hasActiveGame,
    backToGameLabel: backToGameLabel ?? t("shell.backToGame"),
    onCloseSetup: () => setShowSetup(false),
    onOpenSetup: () => setShowSetup(true),
  });

  return { showSetup, setShowSetup, setupVisible, navigation };
}
