import { useEffect, useState } from "react";

/**
 * Laat een uitslag pas zien nadat de laatste zet even in beeld is geweest.
 * Zodra `visible` weer false wordt, verdwijnt de uitslag meteen.
 */
export function useDelayedVisible(visible: boolean, delayMs: number): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }

    const timer = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [visible, delayMs]);

  return shown;
}
